const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');
const { nextCode } = require('../../utils/codes');
const { notify, checkLowStock } = require('../../utils/notify');

router.use(auth);

// Pending: all PENDING_QC batches
router.get('/pending', rbac('ADMIN', 'QUALITY_MANAGER'), async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { status: 'PENDING_QC' },
      include: {
        product: true,
        purchaseOrder: { include: { supplier: true } },
        manufacturingOrder: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ batches });
  } catch (e) { next(e); }
});

router.get('/history', rbac('ADMIN', 'QUALITY_MANAGER'), async (req, res, next) => {
  try {
    const controls = await prisma.qualityControl.findMany({
      include: { batch: { include: { product: true } }, user: true },
      orderBy: { controlDate: 'desc' },
      take: 200,
    });
    res.json({ controls });
  } catch (e) { next(e); }
});

router.get('/:id/certificate', rbac('ADMIN', 'QUALITY_MANAGER', 'STOCK_MANAGER', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const control = await prisma.qualityControl.findUnique({
      where: { id },
      include: { batch: { include: { product: true } }, user: true },
    });
    if (!control) throw new ApiError(404, 'Control not found');
    res.json({ control });
  } catch (e) { next(e); }
});

// Create QC record (without verdict). Optional helper.
router.post('/', rbac('ADMIN', 'QUALITY_MANAGER'), async (req, res, next) => {
  try {
    const { batchId, notes } = req.body || {};
    if (!batchId) throw new ApiError(400, 'batchId required');
    const batch = await prisma.batch.findUnique({ where: { id: parseInt(batchId, 10) } });
    if (!batch) throw new ApiError(404, 'Batch not found');
    const control = await prisma.qualityControl.create({
      data: {
        batchId: batch.id,
        result: 'VALIDATED', // placeholder; not used until validate/reject
        notes,
        userId: req.user.id,
        origin: batch.origin,
      },
    });
    res.status(201).json({ control });
  } catch (e) { next(e); }
});

// Validate a pending batch (operates on the batch, returns the control record)
router.put('/batch/:batchId/validate', rbac('ADMIN', 'QUALITY_MANAGER'), async (req, res, next) => {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    const { notes } = req.body || {};
    const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { product: true } });
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (batch.status !== 'PENDING_QC') throw new ApiError(400, 'Batch not pending QC');

    const result = await prisma.$transaction(async (tx) => {
      const control = await tx.qualityControl.create({
        data: { batchId, result: 'VALIDATED', notes, userId: req.user.id, origin: batch.origin },
      });
      await tx.batch.update({ where: { id: batchId }, data: { status: 'VALIDATED' } });
      await tx.stockMovement.create({
        data: {
          batchId,
          type: 'ENTRY',
          quantity: batch.quantity,
          reason: 'QC validated — entered stock',
          userId: req.user.id,
        },
      });
      if (batch.origin === 'PRODUCTION') {
        await tx.manufacturingOrder.updateMany({ where: { batchId }, data: { status: 'CLOSED' } });
      }
      return control;
    });

    await notify({
      recipientRole: 'STOCK_MANAGER',
      message: `Batch ${batch.batchNumber} validated and entered stock`,
      type: 'SUCCESS',
      relatedId: batchId,
      relatedType: 'batch',
    });

    res.json({ control: result });
  } catch (e) { next(e); }
});

// Reject a pending batch
router.put('/batch/:batchId/reject', rbac('ADMIN', 'QUALITY_MANAGER'), async (req, res, next) => {
  try {
    const batchId = parseInt(req.params.batchId, 10);
    const { notes } = req.body || {};
    if (!notes || !notes.trim()) throw new ApiError(400, 'Notes required when rejecting');
    const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { product: true, manufacturingOrder: true } });
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (batch.status !== 'PENDING_QC') throw new ApiError(400, 'Batch not pending QC');

    const result = await prisma.$transaction(async (tx) => {
      const control = await tx.qualityControl.create({
        data: { batchId, result: 'REJECTED', notes, userId: req.user.id, origin: batch.origin },
      });
      await tx.batch.update({ where: { id: batchId }, data: { status: 'REJECTED' } });

      let reworkOrder = null;
      if (batch.origin === 'PRODUCTION') {
        // close the original MO and create a rework MO for same product/qty
        if (batch.manufacturingOrder) {
          await tx.manufacturingOrder.update({ where: { id: batch.manufacturingOrder.id }, data: { status: 'CLOSED' } });
        }
        // generate codes inside the txn
        const year = new Date().getUTCFullYear();
        // simple sequence: count + 1 via raw query of existing codes
        const all = await tx.manufacturingOrder.findMany({ where: { orderNumber: { startsWith: `MO-${year}-` } }, select: { orderNumber: true } });
        const max = all.reduce((m, r) => {
          const n = parseInt(r.orderNumber.split('-')[2], 10);
          return n > m ? n : m;
        }, 0);
        const newOrderNumber = `MO-${year}-${String(max + 1).padStart(3, '0')}`;
        const allBatches = await tx.batch.findMany({ where: { batchNumber: { startsWith: `LOT-${year}-` } }, select: { batchNumber: true } });
        const maxB = allBatches.reduce((m, r) => {
          const n = parseInt(r.batchNumber.split('-')[2], 10);
          return n > m ? n : m;
        }, 0);
        const newBatchNumber = `LOT-${year}-${String(maxB + 1).padStart(3, '0')}`;

        const newBatch = await tx.batch.create({
          data: {
            batchNumber: newBatchNumber,
            productId: batch.productId,
            manufactureDate: new Date(),
            expiryDate: new Date(Date.now() + 540 * 24 * 60 * 60 * 1000),
            quantity: batch.quantity,
            status: 'IN_PROGRESS',
            batchType: 'LOT',
            origin: 'PRODUCTION',
          },
        });
        reworkOrder = await tx.manufacturingOrder.create({
          data: {
            orderNumber: newOrderNumber,
            productId: batch.productId,
            plannedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            quantity: batch.quantity,
            status: 'IN_PROGRESS',
            batchId: newBatch.id,
            userId: req.user.id,
            reworkOfId: batch.manufacturingOrder?.id || null,
          },
          include: { product: true, batch: true },
        });
      }
      return { control, reworkOrder };
    });

    if (batch.origin === 'PRODUCTION') {
      await notify({
        recipientRole: 'PRODUCTION_MANAGER',
        message: `Batch ${batch.batchNumber} rejected — new order ${result.reworkOrder.orderNumber} created for rework`,
        type: 'WARNING',
        relatedId: result.reworkOrder.id,
        relatedType: 'manufacturing_order',
      });
    } else {
      await notify({
        recipientRole: 'STOCK_MANAGER',
        message: `Batch ${batch.batchNumber} rejected and blocked in stock`,
        type: 'ERROR',
        relatedId: batchId,
        relatedType: 'batch',
      });
    }

    res.json({ control: result.control, reworkOrder: result.reworkOrder });
  } catch (e) { next(e); }
});

module.exports = router;
