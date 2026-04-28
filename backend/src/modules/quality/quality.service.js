const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function list(batchId) {
  return prisma.qualityCheck.findMany({
    where: batchId ? { batchId } : undefined,
    include: { batch: { include: { product: true } }, inspectedBy: { select: { fullName: true } } },
    orderBy: { inspectedAt: 'desc' },
  });
}

async function inspect({ batchId, result, notes }, userId) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new ApiError(404, 'Batch not found');

    const qc = await tx.qualityCheck.create({
      data: { batchId, inspectedById: userId, result, notes },
    });

    // Propagate result to batch status (with optimistic lock)
    const newStatus = result === 'PASSED' ? 'APPROVED' : result === 'FAILED' ? 'REJECTED' : batch.status;
    if (newStatus !== batch.status) {
      const upd = await tx.batch.updateMany({
        where: { id: batchId, version: batch.version },
        data: { status: newStatus, version: { increment: 1 } },
      });
      if (upd.count === 0) throw new ApiError(409, 'Concurrent update — retry');
    }
    return qc;
  });
}

module.exports = { list, inspect };
