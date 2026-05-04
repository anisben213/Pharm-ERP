const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function list() {
  return prisma.salesOrder.findMany({
    include: {
      customer: true,
      lines: { include: { product: true, batch: true } },
      createdBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Creating a sales order reserves stock from specific (RELEASED) batches — concurrent-safe.
async function create(data, userId) {
  return prisma.$transaction(
    async (tx) => {
      const reference = `SO-${Date.now()}`;
      const order = await tx.salesOrder.create({
        data: {
          reference,
          customerId: data.customerId,
          createdById: userId,
          status: 'CONFIRMED',
        },
      });

      for (const line of data.lines) {
        let batch;
        if (line.batchId) {
          batch = await tx.batch.findUnique({ where: { id: line.batchId } });
          if (!batch) throw new ApiError(404, `Batch ${line.batchId} not found`);
        } else if (line.productId) {
          // FEFO: pick the batch closest to expiry with enough remaining qty
          batch = await tx.batch.findFirst({
            where: {
              productId: line.productId,
              status: { in: ['RELEASED', 'APPROVED'] },
              remainingQty: { gte: line.quantity },
            },
            orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
          });
          if (!batch) {
            const prod = await tx.product.findUnique({ where: { id: line.productId }, select: { name: true } });
            throw new ApiError(400, `No available stock for "${prod?.name || line.productId}"`);
          }
        } else {
          throw new ApiError(400, 'Each line requires batchId or productId');
        }
        if (batch.status !== 'RELEASED' && batch.status !== 'APPROVED') {
          throw new ApiError(400, `Batch ${batch.batchNumber} not sellable`);
        }
        if (Number(batch.remainingQty) < line.quantity) {
          throw new ApiError(400, `Insufficient stock on ${batch.batchNumber}`);
        }

        const upd = await tx.batch.updateMany({
          where: { id: batch.id, version: batch.version },
          data: { remainingQty: { decrement: line.quantity }, version: { increment: 1 } },
        });
        if (upd.count === 0) throw new ApiError(409, `Concurrent modification on batch ${batch.batchNumber}`);

        await tx.salesLine.create({
          data: {
            orderId: order.id,
            productId: batch.productId,
            batchId: batch.id,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          },
        });

        await tx.stockMovement.create({
          data: { batchId: batch.id, type: 'OUT_SALES', quantity: line.quantity, reference },
        });
      }

      return tx.salesOrder.findUnique({
        where: { id: order.id },
        include: { lines: { include: { product: true, batch: true } }, customer: true },
      });
    },
    { isolationLevel: 'Serializable' }
  );
}

// Mark a sales order as DELIVERED (generates stock-out movements for traceability).
async function deliver(orderId) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  if (!order) throw new ApiError(404, 'Sales order not found');
  if (order.status !== 'CONFIRMED') throw new ApiError(409, `Order is ${order.status}, cannot deliver`);

  return prisma.salesOrder.update({
    where: { id: orderId },
    data: { status: 'DELIVERED' },
    include: { lines: { include: { product: true, batch: true } }, customer: true },
  });
}

async function returnOrder(orderId) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  if (!order) throw new ApiError(404, 'Sales order not found');
  if (order.status !== 'DELIVERED') throw new ApiError(409, `Order is ${order.status}, can only return a DELIVERED order`);

  return prisma.$transaction(async (tx) => {
    // Restore stock for each line batch
    for (const line of order.lines) {
      await tx.batch.update({
        where: { id: line.batchId },
        data: { remainingQty: { increment: line.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          batchId: line.batchId,
          type: 'ADJUSTMENT',
          quantity: line.quantity,
          reference: order.reference,
          note: 'Customer return',
        },
      });
    }
    return tx.salesOrder.update({
      where: { id: orderId },
      data: { status: 'RETURNED' },
      include: { lines: { include: { product: true, batch: true } }, customer: true },
    });
  });
}

module.exports = { list, create, deliver, returnOrder };
