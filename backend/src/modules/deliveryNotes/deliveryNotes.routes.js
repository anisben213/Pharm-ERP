const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');
const { nextCode } = require('../../utils/codes');

router.use(auth);

router.get('/', rbac('ADMIN', 'SALES_MANAGER', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const notes = await prisma.deliveryNote.findMany({
      include: {
        salesOrder: { include: { client: true, items: { include: { batch: true, product: true } } } },
      },
      orderBy: { deliveryDate: 'desc' },
    });
    res.json({ notes });
  } catch (e) { next(e); }
});

router.post('/', rbac('ADMIN', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const { salesOrderId, deliveryDate } = req.body || {};
    if (!salesOrderId) throw new ApiError(400, 'salesOrderId required');
    const order = await prisma.salesOrder.findUnique({ where: { id: parseInt(salesOrderId, 10) } });
    if (!order) throw new ApiError(404, 'Sales order not found');
    if (order.status !== 'CONFIRMED') throw new ApiError(400, 'Order must be CONFIRMED');
    const existing = await prisma.deliveryNote.findUnique({ where: { salesOrderId: order.id } });
    if (existing) throw new ApiError(409, 'Delivery note already exists');

    const noteNumber = await nextCode('DN');
    const note = await prisma.deliveryNote.create({
      data: {
        noteNumber,
        salesOrderId: order.id,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        status: 'PREPARED',
      },
      include: { salesOrder: { include: { client: true, items: { include: { batch: true, product: true } } } } },
    });
    res.status(201).json({ note });
  } catch (e) { next(e); }
});

router.put('/:id/status', rbac('ADMIN', 'STOCK_MANAGER', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body || {};
    if (!['PREPARED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) throw new ApiError(400, 'Invalid status');
    const existing = await prisma.deliveryNote.findUnique({
      where: { id },
      include: { salesOrder: { include: { items: true } } },
    });
    if (!existing) throw new ApiError(404, 'Delivery note not found');
    if (existing.status === 'DELIVERED' || existing.status === 'CANCELLED') {
      throw new ApiError(400, `Delivery note is already ${existing.status.toLowerCase()}`);
    }

    const note = await prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryNote.update({
        where: { id },
        data: { status, ...(status === 'DELIVERED' ? { deliveryDate: new Date() } : {}) },
        include: { salesOrder: true },
      });
      if (status === 'DELIVERED') {
        await tx.salesOrder.update({ where: { id: updated.salesOrderId }, data: { status: 'DELIVERED' } });
      }
      if (status === 'CANCELLED') {
        // Restock allocated batches and create ENTRY movements
        for (const it of existing.salesOrder.items) {
          await tx.batch.update({ where: { id: it.batchId }, data: { quantity: { increment: it.quantity } } });
          await tx.stockMovement.create({
            data: {
              batchId: it.batchId,
              type: 'ENTRY',
              quantity: it.quantity,
              reason: `Cancelled sales order ${existing.salesOrder.orderNumber} — restocked`,
              userId: req.user.id,
            },
          });
        }
        await tx.salesOrder.update({ where: { id: updated.salesOrderId }, data: { status: 'CANCELLED' } });
      }
      return updated;
    });
    res.json({ note });
  } catch (e) {
    if (e.code === 'P2025') return next(new ApiError(404, 'Delivery note not found'));
    next(e);
  }
});

module.exports = router;
