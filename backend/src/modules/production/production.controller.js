const asyncHandler = require('../../utils/asyncHandler');
const service = require('./production.service');
const { recordAudit } = require('../../utils/auditLogger');

exports.list = asyncHandler(async (req, res) => res.json(await service.list()));
exports.getById = asyncHandler(async (req, res) => res.json(await service.getById(req.params.id)));

exports.create = asyncHandler(async (req, res) => {
  const order = await service.create(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'PRODUCTION_CREATED', entity: 'ProductionOrder', entityId: order.id, req });
  res.status(201).json(order);
});

exports.start = asyncHandler(async (req, res) => {
  const order = await service.start(req.params.id, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'PRODUCTION_STARTED', entity: 'ProductionOrder', entityId: order.id, req });
  res.json(order);
});

exports.complete = asyncHandler(async (req, res) => {
  const order = await service.complete(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'PRODUCTION_COMPLETED', entity: 'ProductionOrder', entityId: order.id, req });
  res.json(order);
});
