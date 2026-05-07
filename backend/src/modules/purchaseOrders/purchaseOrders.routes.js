const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');
const { nextCode } = require('../../utils/codes');
const { notify } = require('../../utils/notify');

router.use(auth);

router.get('/', rbac('ADMIN', 'PURCHASE_MANAGER', 'QUALITY_MANAGER', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true, product: true, batch: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (e) { next(e); }
});

router.post('/', rbac('ADMIN', 'PURCHASE_MANAGER'), async (req, res, next) => {
  try {
    const { supplierId, productId, quantity, orderDate } = req.body || {};
    if (!supplierId || !productId || !quantity) throw new ApiError(400, 'supplierId, productId, quantity required');
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId, 10) } });
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.category !== 'RAW_MATERIAL') throw new ApiError(400, 'Purchase orders require raw materials');
    const orderNumber = await nextCode('PO');
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: parseInt(supplierId, 10),
        productId: parseInt(productId, 10),
        quantity: Number(quantity),
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        status: 'SENT',
        userId: req.user.id,
      },
      include: { supplier: true, product: true },
    });
    res.status(201).json({ order });
  } catch (e) { next(e); }
});

// Confirm reception: create RM batch (PENDING_QC), mark PO RECEIVED, notify QC
router.put('/:id/receive', rbac('ADMIN', 'PURCHASE_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { manufactureDate, expiryDate } = req.body || {};
    const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { product: true } });
    if (!po) throw new ApiError(404, 'Purchase order not found');
    if (po.status === 'RECEIVED') throw new ApiError(400, 'Already received');

    const batchNumber = await nextCode('RM');
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          batchNumber,
          productId: po.productId,
          manufactureDate: manufactureDate ? new Date(manufactureDate) : new Date(),
          expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
          quantity: po.quantity,
          status: 'PENDING_QC',
          batchType: 'RM',
          origin: 'PURCHASE',
        },
      });
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED', batchId: batch.id },
        include: { supplier: true, product: true, batch: true },
      });
      return { updated, batch };
    });

    await notify({
      recipientRole: 'QUALITY_MANAGER',
      message: `New RM batch ${result.batch.batchNumber} pending analysis`,
      type: 'INFO',
      relatedId: result.batch.id,
      relatedType: 'batch',
    });

    res.json({ order: result.updated });
  } catch (e) { next(e); }
});

module.exports = router;
