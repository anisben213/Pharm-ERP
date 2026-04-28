const asyncHandler = require('../../utils/asyncHandler');
const service = require('./batches.service');
const { recordAudit } = require('../../utils/auditLogger');

exports.list = asyncHandler(async (req, res) => res.json(await service.list(req.query)));
exports.getById = asyncHandler(async (req, res) => res.json(await service.getById(req.params.id)));
exports.trace = asyncHandler(async (req, res) => res.json(await service.trace(req.params.id)));
exports.getAffected = asyncHandler(async (req, res) => res.json(await service.getAffected(req.params.id)));

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, version } = req.body;
  const batch = await service.updateStatus(req.params.id, status, version, req.user.id);
  await recordAudit({
    userId: req.user.id, action: 'BATCH_STATUS_CHANGED',
    entity: 'Batch', entityId: batch.id, metadata: { status }, req,
  });
  res.json(batch);
});

exports.recall = asyncHandler(async (req, res) => {
  const result = await service.recall(req.params.id, req.user.id, req.body?.reason);
  res.json(result);
});
