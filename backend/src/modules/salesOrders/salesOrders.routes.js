const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');
const { nextCode } = require('../../utils/codes');
const { notify, checkLowStock } = require('../../utils/notify');

router.use(auth);

router.get('/', rbac('ADMIN', 'SALES_MANAGER', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: {
        client: true,
        items: { include: { batch: true, product: true } },
        deliveryNote: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (e) { next(e); }
});

router.get('/:id', rbac('ADMIN', 'SALES_MANAGER', 'STOCK_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { batch: true, product: true } },
        deliveryNote: true,
      },
    });
    if (!order) throw new ApiError(404, 'Order not found');
    res.json({ order });
  } catch (e) { next(e); }
});

// Create pending order. items: [{ productId, quantity, unitPrice }]
// Auto-pick batches by FEFO during confirmation, not creation.
router.post('/', rbac('ADMIN', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const { clientId, items } = req.body || {};
    if (!clientId || !Array.isArray(items) || items.length === 0) throw new ApiError(400, 'clientId and items required');

    // Pre-pick batches for the order (FEFO) so each item points at a real batch.
    const itemsData = [];
    let total = 0;
    for (const it of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(it.productId, 10) } });
      if (!product) throw new ApiError(404, `Product ${it.productId} not found`);
      const batches = await prisma.batch.findMany({
        where: { productId: product.id, status: 'VALIDATED', batchType: 'LOT' },
        orderBy: { expiryDate: 'asc' },
      });
      const totalAvailable = batches.reduce((s, b) => s + b.quantity, 0);
      if (totalAvailable < Number(it.quantity)) {
        throw new ApiError(400, `Insufficient stock for ${product.name}: ${totalAvailable} available, ${it.quantity} requested`);
      }
      // Allocate FEFO
      let remaining = Number(it.quantity);
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(b.quantity, remaining);
        itemsData.push({ batchId: b.id, productId: product.id, quantity: take });
        remaining -= take;
      }
      const unitPrice = Number(it.unitPrice ?? 50);
      total += unitPrice * Number(it.quantity);
    }

    const orderNumber = await nextCode('SO');
    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        clientId: parseInt(clientId, 10),
        userId: req.user.id,
        status: 'PENDING',
        totalAmount: total,
        items: { create: itemsData },
      },
      include: { client: true, items: { include: { batch: true, product: true } } },
    });
    res.status(201).json({ order });
  } catch (e) { next(e); }
});

// Confirm: stock check + auto exit movements + notify stock manager
router.put('/:id/confirm', rbac('ADMIN', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { client: true, items: { include: { batch: true, product: true } } },
    });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status !== 'PENDING') throw new ApiError(400, 'Only pending orders can be confirmed');

    // Validate stock availability
    for (const it of order.items) {
      const fresh = await prisma.batch.findUnique({ where: { id: it.batchId } });
      if (!fresh || fresh.status !== 'VALIDATED' || fresh.quantity < it.quantity) {
        throw new ApiError(400, `Insufficient stock on batch ${fresh?.batchNumber || it.batchId}`);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const it of order.items) {
        await tx.batch.update({ where: { id: it.batchId }, data: { quantity: { decrement: it.quantity } } });
        await tx.stockMovement.create({
          data: {
            batchId: it.batchId,
            type: 'EXIT',
            quantity: it.quantity,
            reason: `Sales order ${order.orderNumber}`,
            userId: req.user.id,
          },
        });
      }
      return tx.salesOrder.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { client: true, items: { include: { batch: true, product: true } } },
      });
    });

    // Low-stock checks per product
    const productIds = [...new Set(order.items.map((i) => i.productId))];
    for (const pid of productIds) await checkLowStock(pid);

    await notify({
      recipientRole: 'STOCK_MANAGER',
      message: `Sales order ${order.orderNumber} confirmed — prepare delivery for ${order.client.name}`,
      type: 'INFO',
      relatedId: order.id,
      relatedType: 'sales_order',
    });

    res.json({ order: updated });
  } catch (e) { next(e); }
});

module.exports = router;
