const asyncHandler = require('../../utils/asyncHandler');
const service = require('./quality.service');
const { recordAudit } = require('../../utils/auditLogger');

exports.list = asyncHandler(async (req, res) => res.json(await service.list(req.query.batchId)));

exports.inspect = asyncHandler(async (req, res) => {
  const qc = await service.inspect(req.body, req.user.id);
  await recordAudit({
    userId: req.user.id, action: 'QC_INSPECTED',
    entity: 'Batch', entityId: qc.batchId, metadata: { result: qc.result }, req,
  });
  res.status(201).json(qc);
});
