const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function list() {
  const orders = await prisma.productionOrder.findMany({
    include: {
      producedBatches: { include: { product: { select: { sku: true, name: true, unit: true } } } },
      createdBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const productIds = [...new Set(orders.map((o) => o.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sku: true, name: true, unit: true },
  });
  const pMap = Object.fromEntries(products.map((p) => [p.id, p]));
  return orders.map((o) => ({ ...o, product: pMap[o.productId] || null }));
}

async function create(data, userId) {
  return prisma.productionOrder.create({
    data: {
      reference: `MO-${Date.now()}`,
      productId: data.productId,
      quantity: data.quantity,
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
      createdById: userId,
    },
  });
}

// Generate the next LOT-YYYY-XXX batch number (sequential within the year).
async function generateLotNumber(tx) {
  const year = new Date().getFullYear();
  const prefix = `LOT-${year}-`;
  const count = await (tx || prisma).batch.count({ where: { batchNumber: { startsWith: prefix } } });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

// Mark a production order as IN_PROGRESS.
async function start(orderId, userId) {
  const order = await prisma.productionOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, 'Production order not found');
  if (order.status !== 'PLANNED') throw new ApiError(409, `Order is already ${order.status}`);
  return prisma.productionOrder.update({
    where: { id: orderId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });
}

// Complete a production order:
// - consume specified raw-material batches (optimistic locking on each)
// - create finished product batch
// - build genealogy links (parent -> child)
// - create stock movements
// All inside a single serializable transaction to handle concurrency.
async function complete(orderId, { consumedBatches, finishedBatchNumber, expiryDate }) {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.productionOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiError(404, 'Production order not found');
      if (order.status === 'COMPLETED') throw new ApiError(409, 'Already completed');

      // 1) Consume raw batches with optimistic locking
      for (const c of consumedBatches) {
        const raw = await tx.batch.findUnique({ where: { id: c.batchId } });
        if (!raw) throw new ApiError(404, `Batch ${c.batchId} not found`);
        if (raw.status !== 'APPROVED') throw new ApiError(400, `Batch ${raw.batchNumber} not approved for use`);
        if (Number(raw.remainingQty) < c.quantity) {
          throw new ApiError(400, `Insufficient qty on batch ${raw.batchNumber}`);
        }
        const upd = await tx.batch.updateMany({
          where: { id: raw.id, version: raw.version },
          data: {
            remainingQty: { decrement: c.quantity },
            version: { increment: 1 },
          },
        });
        if (upd.count === 0) throw new ApiError(409, `Concurrent modification on batch ${raw.batchNumber}`);

        await tx.stockMovement.create({
          data: { batchId: raw.id, type: 'OUT_PRODUCTION', quantity: c.quantity, reference: order.reference },
        });
      }

      // 2) Create finished batch — use LOT-YYYY-XXX if no number provided
      const lotNumber = finishedBatchNumber || await generateLotNumber(tx);
      const finished = await tx.batch.create({
        data: {
          batchNumber: lotNumber,
          productId: order.productId,
          quantity: order.quantity,
          remainingQty: order.quantity,
          status: 'IN_QUARANTINE',
          manufacturedAt: new Date(),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          productionOrderId: order.id,
        },
      });

      // 3) Genealogy
      for (const c of consumedBatches) {
        await tx.batchGenealogy.create({
          data: { parentBatchId: c.batchId, childBatchId: finished.id, consumedQty: c.quantity },
        });
      }

      // 4) Stock IN
      await tx.stockMovement.create({
        data: { batchId: finished.id, type: 'IN_PRODUCTION', quantity: order.quantity, reference: order.reference },
      });

      // 5) Close order
      return tx.productionOrder.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: { producedBatches: true },
      });
    },
    { isolationLevel: 'Serializable' }
  );
}

module.exports = { list, create, start, complete };
