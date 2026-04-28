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
        const batch = await tx.batch.findUnique({ where: { id: line.batchId } });
        if (!batch) throw new ApiError(404, `Batch ${line.batchId} not found`);
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

module.exports = { list, create, deliver };
