const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function list() {
  return prisma.purchaseOrder.findMany({
    include: { supplier: true, lines: { include: { product: true } }, createdBy: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function create(data, userId) {
  const reference = `PO-${Date.now()}`;
  return prisma.purchaseOrder.create({
    data: {
      reference,
      supplierId: data.supplierId,
      createdById: userId,
      lines: { create: data.lines.map((l) => ({
        productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice,
      })) },
    },
    include: { lines: true },
  });
}

// Receiving a PO creates one batch per purchase line and a stock-IN movement — atomic transaction
async function receive(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status === 'RECEIVED') throw new ApiError(409, 'Already received');

    for (const line of order.lines) {
      const batch = await tx.batch.create({
        data: {
          batchNumber: `B-${order.reference}-${line.id.slice(-6)}`,
          productId: line.productId,
          quantity: line.quantity,
          remainingQty: line.quantity,
          status: 'IN_QUARANTINE',
          purchaseLineId: line.id,
          manufacturedAt: new Date(),
        },
      });
      await tx.stockMovement.create({
        data: {
          batchId: batch.id,
          type: 'IN_PURCHASE',
          quantity: line.quantity,
          reference: order.reference,
        },
      });
    }

    return tx.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'RECEIVED' },
      include: { lines: { include: { batch: true } } },
    });
  });
}

// Confirm a purchase order (DRAFT → CONFIRMED).
async function confirm(orderId) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'DRAFT') throw new ApiError(409, `Order is ${order.status}, cannot confirm`);
  return prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: 'CONFIRMED' },
    include: { supplier: true, lines: { include: { product: true } } },
  });
}

// Cancel a purchase order (only DRAFT or CONFIRMED can be cancelled).
async function cancel(orderId) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
    throw new ApiError(409, `Cannot cancel a ${order.status} order`);
  }
  return prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
  });
}

module.exports = { list, create, receive, confirm, cancel };
