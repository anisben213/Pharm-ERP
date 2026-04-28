const asyncHandler = require('../../utils/asyncHandler');
const service = require('./users.service');
const { recordAudit } = require('../../utils/auditLogger');

exports.list = asyncHandler(async (req, res) => res.json(await service.list()));
exports.getById = asyncHandler(async (req, res) => res.json(await service.getById(req.params.id)));

exports.create = asyncHandler(async (req, res) => {
  const user = await service.create(req.body);
  await recordAudit({ userId: req.user.id, action: 'USER_CREATED', entity: 'User', entityId: user.id, req });
  res.status(201).json(user);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await service.update(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'USER_UPDATED', entity: 'User', entityId: user.id, req });
  res.json(user);
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'USER_DEACTIVATED', entity: 'User', entityId: req.params.id, req });
  res.status(204).end();
});
