const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function list({ status, productId }) {
  return prisma.batch.findMany({
    where: {
      ...(status && { status }),
      ...(productId && { productId }),
    },
    include: { product: { select: { sku: true, name: true, type: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getById(id) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      product: true,
      qualityChecks: { include: { inspectedBy: { select: { fullName: true } } } },
      stockMovements: true,
      parentLinks: { include: { parentBatch: { include: { product: true } } } },
      childLinks: { include: { childBatch: { include: { product: true } } } },
    },
  });
  if (!batch) throw new ApiError(404, 'Batch not found');
  return batch;
}

// End-to-end trace: walk ancestors (raw materials) and descendants (finished products & sales)
async function trace(id) {
  const root = await prisma.batch.findUnique({ where: { id }, include: { product: true } });
  if (!root) throw new ApiError(404, 'Batch not found');

  async function walkUp(batchId, visited = new Set()) {
    if (visited.has(batchId)) return [];
    visited.add(batchId);
    const links = await prisma.batchGenealogy.findMany({
      where: { childBatchId: batchId },
      include: { parentBatch: { include: { product: true } } },
    });
    const result = [];
    for (const l of links) {
      result.push({ batch: l.parentBatch, consumedQty: l.consumedQty });
      const up = await walkUp(l.parentBatchId, visited);
      result.push(...up);
    }
    return result;
  }

  async function walkDown(batchId, visited = new Set()) {
    if (visited.has(batchId)) return [];
    visited.add(batchId);
    const links = await prisma.batchGenealogy.findMany({
      where: { parentBatchId: batchId },
      include: { childBatch: { include: { product: true } } },
    });
    const result = [];
    for (const l of links) {
      result.push({ batch: l.childBatch, consumedQty: l.consumedQty });
      const down = await walkDown(l.childBatchId, visited);
      result.push(...down);
    }
    return result;
  }

  const [ancestors, descendants, sales] = await Promise.all([
    walkUp(id),
    walkDown(id),
    prisma.salesLine.findMany({
      where: { batchId: id },
      include: { order: { include: { customer: true } } },
    }),
  ]);

  return { batch: root, ancestors, descendants, sales };
}

async function updateStatus(id, status, expectedVersion, userId) {
  // Optimistic locking using version field — solves concurrency
  const result = await prisma.batch.updateMany({
    where: { id, version: expectedVersion },
    data: { status, version: { increment: 1 } },
  });
  if (result.count === 0) {
    throw new ApiError(409, 'Concurrent update detected — refresh and retry');
  }
  await prisma.auditLog.create({
    data: {
      userId,
      action: `BATCH_${status}`,
      entity: 'Batch',
      entityId: id,
      metadata: { newStatus: status },
    },
  }).catch(() => {});
  return prisma.batch.findUnique({ where: { id } });
}

// Trigger full recall: find all affected customers via sales genealogy,
// create RECALL stock movement, set status to RECALLED, log audit entry.
async function recall(id, userId, reason) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      salesLines: { include: { order: { include: { customer: true } } } },
    },
  });
  if (!batch) throw new ApiError(404, 'Batch not found');
  if (batch.status === 'RECALLED') throw new ApiError(409, 'Batch already recalled');

  const affectedCustomers = [
    ...new Map(
      batch.salesLines
        .map((l) => l.order?.customer)
        .filter(Boolean)
        .map((c) => [c.id, c])
    ).values(),
  ];

  return prisma.$transaction(async (tx) => {
    const upd = await tx.batch.updateMany({
      where: { id, version: batch.version },
      data: { status: 'RECALLED', version: { increment: 1 } },
    });
    if (upd.count === 0) throw new ApiError(409, 'Concurrent update detected');

    await tx.stockMovement.create({
      data: {
        batchId: id,
        type: 'RECALL',
        quantity: batch.remainingQty,
        reference: `RECALL-${Date.now()}`,
        note: reason || 'Recall triggered',
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'BATCH_RECALL',
        entity: 'Batch',
        entityId: id,
        metadata: {
          batchNumber: batch.batchNumber,
          reason: reason || null,
          affectedCustomers: affectedCustomers.map((c) => ({ id: c.id, name: c.name, email: c.email })),
          affectedOrders: batch.salesLines.map((l) => l.order?.reference).filter(Boolean),
        },
      },
    });

    return {
      batch: await tx.batch.findUnique({ where: { id } }),
      affectedCustomers,
      affectedOrders: batch.salesLines.map((l) => ({
        reference: l.order?.reference,
        customer: l.order?.customer?.name,
        quantity: Number(l.quantity),
      })),
    };
  });
}

// Return the list of customers who received this batch via sales, without triggering a recall.
// Used by the UI to show impact BEFORE confirming the recall.
async function getAffected(id) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      salesLines: {
        include: { order: { include: { customer: true } } },
      },
    },
  });
  if (!batch) throw new ApiError(404, 'Batch not found');

  const clients = [
    ...new Map(
      batch.salesLines
        .map((l) => l.order?.customer)
        .filter(Boolean)
        .map((c) => [c.id, c])
    ).values(),
  ];

  const orders = batch.salesLines.map((l) => ({
    reference: l.order?.reference,
    customer: l.order?.customer?.name,
    quantity: Number(l.quantity),
  }));

  return { batchNumber: batch.batchNumber, clients, orders };
}

module.exports = { list, getById, trace, updateStatus, recall, getAffected };
