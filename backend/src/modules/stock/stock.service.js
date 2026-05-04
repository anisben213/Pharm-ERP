const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function listMovements(filters = {}) {
  const where = {};
  if (filters.batchId) where.batchId = filters.batchId;
  if (filters.type) where.type = filters.type;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }
  return prisma.stockMovement.findMany({
    where,
    include: { batch: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
}

// Statuses that still hold usable / on-hand stock
const USABLE_STATUSES = ['CREATED', 'IN_QUARANTINE', 'APPROVED', 'IN_PRODUCTION', 'RELEASED'];

async function stockByProduct() {
  const rows = await prisma.batch.groupBy({
    by: ['productId', 'status'],
    where: {
      status: { in: USABLE_STATUSES },
      remainingQty: { gt: 0 },
    },
    _sum: { remainingQty: true },
  });
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sku: true, name: true, type: true, unit: true, minLevel: true },
  });
  const pMap = Object.fromEntries(products.map((p) => [p.id, p]));
  return rows.map((r) => ({
    productId: r.productId,
    product: pMap[r.productId] || null,
    status: r.status,
    quantity: Math.max(0, Number(r._sum.remainingQty || 0)),
  }));
}

async function createMovement({ batchId, batchNumber, type: rawType, quantity, reference, note, reason }) {
  // Accept batchNumber as lookup fallback
  const batch = batchId
    ? await prisma.batch.findUnique({ where: { id: batchId } })
    : batchNumber
      ? await prisma.batch.findUnique({ where: { batchNumber } })
      : null;
  if (!batch) throw new ApiError(404, 'Batch not found');

  // Map simplified IN/OUT to MovementType
  const typeMap = { IN: 'ADJUSTMENT', OUT: 'ADJUSTMENT' };
  const type = typeMap[rawType] || rawType;
  const validTypes = ['IN_PURCHASE', 'IN_PRODUCTION', 'OUT_PRODUCTION', 'OUT_SALES', 'ADJUSTMENT', 'RECALL'];
  if (!validTypes.includes(type)) throw new ApiError(400, `Invalid movement type: ${type}`);
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new ApiError(400, 'Quantity must be positive');

  const isOut = ['OUT_PRODUCTION', 'OUT_SALES', 'RECALL'].includes(type);
  const delta = isOut ? -qty : qty;
  const newRemaining = Number(batch.remainingQty) + delta;
  if (newRemaining < 0) throw new ApiError(409, 'Insufficient quantity in batch');

  const noteText = note || reason || null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.batch.updateMany({
      where: { id: batch.id, version: batch.version },
      data: { remainingQty: newRemaining, version: { increment: 1 } },
    });
    if (updated.count === 0) throw new ApiError(409, 'Batch was updated concurrently, retry');
    return tx.stockMovement.create({
      data: { batchId: batch.id, type, quantity: qty, reference, note: noteText },
      include: { batch: { include: { product: true } } },
    });
  });
}

async function blockBatch(batchId, actorId) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw new ApiError(404, 'Batch not found');
  if (['SOLD', 'RECALLED', 'EXPIRED'].includes(batch.status)) {
    throw new ApiError(409, `Cannot block a ${batch.status} batch`);
  }
  const updated = await prisma.batch.updateMany({
    where: { id: batchId, version: batch.version },
    data: { status: 'REJECTED', version: { increment: 1 } },
  });
  if (updated.count === 0) throw new ApiError(409, 'Batch was updated concurrently, retry');

  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action: 'BATCH_BLOCKED',
      entity: 'Batch',
      entityId: batchId,
      metadata: { batchNumber: batch.batchNumber, previousStatus: batch.status },
    },
  });
  return prisma.batch.findUnique({
    where: { id: batchId },
    include: { product: true },
  });
}

async function expiring(days = 90) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + Number(days));
  return prisma.batch.findMany({
    where: {
      expiryDate: { lte: threshold },
      remainingQty: { gt: 0 },
      status: { notIn: ['SOLD', 'RECALLED', 'EXPIRED', 'REJECTED'] },
    },
    include: { product: true },
    orderBy: { expiryDate: 'asc' },
    take: 50,
  });
}

module.exports = { listMovements, stockByProduct, createMovement, blockBatch, expiring };
