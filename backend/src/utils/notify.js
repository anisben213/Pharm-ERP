// Centralized notification creation + low-stock checks
const prisma = require('../config/db');

async function notify({ recipientRole, message, type = 'INFO', relatedId = null, relatedType = null }) {
  return prisma.notification.create({
    data: { recipientRole, message, type, relatedId, relatedType },
  });
}

// Check after a stock movement: if validated batch's total quantity for its
// product is below product.minStockLevel, notify the relevant role.
async function checkLowStock(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const agg = await prisma.batch.aggregate({
    where: { productId, status: 'VALIDATED' },
    _sum: { quantity: true },
  });
  const total = agg._sum.quantity || 0;
  if (total >= product.minStockLevel) return;

  // Avoid duplicate alerts within last 24h for same product+role
  const recipientRole = product.category === 'RAW_MATERIAL' ? 'PURCHASE_MANAGER' : 'PRODUCTION_MANAGER';
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      recipientRole,
      relatedType: 'product_low_stock',
      relatedId: productId,
      createdAt: { gte: since },
    },
  });
  if (existing) return;

  await notify({
    recipientRole,
    message: `Low stock alert: ${product.name} below minimum level`,
    type: 'WARNING',
    relatedId: productId,
    relatedType: 'product_low_stock',
  });
}

module.exports = { notify, checkLowStock };
