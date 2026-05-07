const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');
const { checkLowStock } = require('../../utils/notify');

router.use(auth);

// All validated batches (LOT + RM) grouped by category
router.get('/', rbac('ADMIN', 'STOCK_MANAGER', 'QUALITY_MANAGER', 'PRODUCTION_MANAGER', 'PURCHASE_MANAGER', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { status: { in: ['VALIDATED', 'REJECTED'] } },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    const finished = [];
    const raw = [];
    const blocked = [];
    for (const b of batches) {
      if (b.status === 'REJECTED') blocked.push(b);
      else if (b.product.category === 'FINISHED_PRODUCT') finished.push(b);
      else raw.push(b);
    }
    res.json({ finished, raw, blocked });
  } catch (e) { next(e); }
});

// Alerts: low stock + expiring within 30 days
router.get('/alerts', rbac('ADMIN', 'STOCK_MANAGER', 'PRODUCTION_MANAGER', 'PURCHASE_MANAGER'), async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ include: { batches: { where: { status: 'VALIDATED' } } } });
    const lowStock = products
      .map((p) => ({ product: p, total: p.batches.reduce((s, b) => s + b.quantity, 0) }))
      .filter((x) => x.total < x.product.minStockLevel)
      .map((x) => ({
        productId: x.product.id,
        productName: x.product.name,
        category: x.product.category,
        unit: x.product.unit,
        total: x.total,
        minStockLevel: x.product.minStockLevel,
      }));

    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiring = await prisma.batch.findMany({
      where: { status: 'VALIDATED', expiryDate: { lte: in30 } },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
    res.json({ lowStock, expiring });
  } catch (e) { next(e); }
});

// Batch traceability timeline (by batchNumber)
router.get('/batch/:batchNumber', rbac('ADMIN', 'STOCK_MANAGER', 'QUALITY_MANAGER', 'PRODUCTION_MANAGER', 'PURCHASE_MANAGER', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const { batchNumber } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { batchNumber },
      include: {
        product: true,
        purchaseOrder: { include: { supplier: true } },
        manufacturingOrder: true,
        qualityControls: { include: { user: true }, orderBy: { controlDate: 'asc' } },
        movements: { include: { user: true }, orderBy: { date: 'asc' } },
        salesOrderItems: { include: { salesOrder: { include: { client: true, deliveryNote: true } } } },
      },
    });
    if (!batch) throw new ApiError(404, 'Batch not found');

    const timeline = [];
    timeline.push({
      step: 'created',
      title: batch.batchType === 'RM' ? 'Raw material received' : 'Manufacturing started',
      date: batch.createdAt,
      detail: batch.batchType === 'RM'
        ? (batch.purchaseOrder ? `Purchase order ${batch.purchaseOrder.orderNumber} from ${batch.purchaseOrder.supplier?.name}` : 'Purchase reception')
        : (batch.manufacturingOrder ? `Manufacturing order ${batch.manufacturingOrder.orderNumber}` : 'Production'),
    });
    for (const qc of batch.qualityControls) {
      timeline.push({
        step: 'quality',
        title: `Quality control — ${qc.result.toLowerCase()}`,
        date: qc.controlDate,
        detail: qc.notes || '',
        by: qc.user?.fullName,
      });
    }
    for (const m of batch.movements) {
      timeline.push({
        step: m.type === 'ENTRY' ? 'stock_entry' : 'stock_exit',
        title: m.type === 'ENTRY' ? 'Stock entry' : 'Stock exit',
        date: m.date,
        detail: m.reason || '',
        quantity: m.quantity,
        by: m.user?.fullName,
      });
    }
    for (const it of batch.salesOrderItems) {
      const so = it.salesOrder;
      timeline.push({
        step: 'sales',
        title: `Sales order ${so.orderNumber}`,
        date: so.orderDate,
        detail: `Client: ${so.client.name} — qty ${it.quantity}`,
      });
      if (so.deliveryNote && so.deliveryNote.status === 'DELIVERED') {
        timeline.push({
          step: 'delivered',
          title: `Delivered (${so.deliveryNote.noteNumber})`,
          date: so.deliveryNote.deliveryDate,
          detail: `Client: ${so.client.name}`,
        });
      }
    }
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ batch, timeline });
  } catch (e) { next(e); }
});

router.get('/movements', rbac('ADMIN', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: { batch: { include: { product: true } }, user: true },
      orderBy: { date: 'desc' },
      take: 200,
    });
    res.json({ movements });
  } catch (e) { next(e); }
});

router.post('/movements', rbac('ADMIN', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const { batchId, type, quantity, reason } = req.body || {};
    if (!batchId || !type || !quantity) throw new ApiError(400, 'batchId, type, quantity required');
    if (!['ENTRY', 'EXIT'].includes(type)) throw new ApiError(400, 'Invalid type');
    const batch = await prisma.batch.findUnique({ where: { id: parseInt(batchId, 10) } });
    if (!batch) throw new ApiError(404, 'Batch not found');
    if (batch.status !== 'VALIDATED') throw new ApiError(400, 'Only validated batches accept stock movements');

    const movement = await prisma.$transaction(async (tx) => {
      const m = await tx.stockMovement.create({
        data: { batchId: batch.id, type, quantity: Number(quantity), reason, userId: req.user.id },
      });
      const delta = type === 'ENTRY' ? Number(quantity) : -Number(quantity);
      await tx.batch.update({ where: { id: batch.id }, data: { quantity: { increment: delta } } });
      return m;
    });
    if (type === 'EXIT') await checkLowStock(batch.productId);
    res.status(201).json({ movement });
  } catch (e) { next(e); }
});

router.get('/reports', rbac('ADMIN', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const totalValidated = await prisma.batch.count({ where: { status: 'VALIDATED' } });
    const totalBlocked = await prisma.batch.count({ where: { status: 'REJECTED' } });
    const last30Movements = await prisma.stockMovement.count({
      where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    res.json({ totalValidated, totalBlocked, last30Movements });
  } catch (e) { next(e); }
});

module.exports = router;
