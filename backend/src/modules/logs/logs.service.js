const prisma = require('../../config/db');

async function list({ entity, action, userId, limit = 100 }) {
  return prisma.auditLog.findMany({
    where: {
      ...(entity && { entity }),
      ...(action && { action }),
      ...(userId && { userId }),
    },
    include: { user: { select: { email: true, fullName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit) || 100, 500),
  });
}

module.exports = { list };
