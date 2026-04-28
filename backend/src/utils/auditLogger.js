const prisma = require('../config/db');
const logger = require('../config/logger');

async function recordAudit({ userId, action, entity, entityId, metadata, req }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        metadata: metadata || undefined,
        ip: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
      },
    });
  } catch (err) {
    logger.error('Audit log failed', { err: err.message });
  }
}

module.exports = { recordAudit };
