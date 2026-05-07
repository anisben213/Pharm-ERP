const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');
const { nextCode } = require('../../utils/codes');
const { notify } = require('../../utils/notify');

router.use(auth);

router.get('/', rbac('ADMIN', 'PRODUCTION_MANAGER', 'QUALITY_MANAGER', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const orders = await prisma.manufacturingOrder.findMany({
      include: { product: true, batch: true, reworkOf: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (e) { next(e); }
});

router.get('/:id', rbac('ADMIN', 'PRODUCTION_MANAGER', 'QUALITY_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { product: true, batch: true, reworkOf: true },
    });
    if (!order) throw new ApiError(404, 'Order not found');
    res.json({ order });
  } catch (e) { next(e); }
});

// Create MO + auto-generate LOT batch (status IN_PROGRESS)
router.post('/', rbac('ADMIN', 'PRODUCTION_MANAGER'), async (req, res, next) => {
  try {
    const { productId, plannedDate, quantity } = req.body || {};
    if (!productId || !plannedDate || !quantity) throw new ApiError(400, 'productId, plannedDate, quantity required');
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId, 10) } });
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.category !== 'FINISHED_PRODUCT') throw new ApiError(400, 'Manufacturing orders require finished products');

    const orderNumber = await nextCode('MO');
    const batchNumber = await nextCode('LOT');
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          batchNumber,
          productId: product.id,
          manufactureDate: new Date(plannedDate),
          expiryDate: new Date(new Date(plannedDate).getTime() + 540 * 24 * 60 * 60 * 1000),
          quantity: Number(quantity),
          status: 'IN_PROGRESS',
          batchType: 'LOT',
          origin: 'PRODUCTION',
        },
      });
      const order = await tx.manufacturingOrder.create({
        data: {
          orderNumber,
          productId: product.id,
          plannedDate: new Date(plannedDate),
          quantity: Number(quantity),
          status: 'IN_PROGRESS',
          batchId: batch.id,
          userId: req.user.id,
        },
        include: { product: true, batch: true },
      });
      return order;
    });
    res.status(201).json({ order: result });
  } catch (e) { next(e); }
});

// Close MO: batch -> PENDING_QC, MO -> PENDING_QC, notify QC
router.put('/:id/close', rbac('ADMIN', 'PRODUCTION_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const mo = await prisma.manufacturingOrder.findUnique({ where: { id }, include: { batch: true } });
    if (!mo) throw new ApiError(404, 'Order not found');
    if (mo.status !== 'IN_PROGRESS') throw new ApiError(400, 'Only IN_PROGRESS orders can be closed');
    if (!mo.batchId) throw new ApiError(400, 'Order has no batch');

    const result = await prisma.$transaction(async (tx) => {
      await tx.batch.update({ where: { id: mo.batchId }, data: { status: 'PENDING_QC' } });
      return tx.manufacturingOrder.update({
        where: { id },
        data: { status: 'PENDING_QC' },
        include: { product: true, batch: true },
      });
    });

    await notify({
      recipientRole: 'QUALITY_MANAGER',
      message: `New LOT batch ${result.batch.batchNumber} pending analysis`,
      type: 'INFO',
      relatedId: result.batch.id,
      relatedType: 'batch',
    });

    res.json({ order: result });
  } catch (e) { next(e); }
});

module.exports = router;
