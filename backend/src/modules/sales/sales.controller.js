const asyncHandler = require('../../utils/asyncHandler');
const service = require('./sales.service');
const { recordAudit } = require('../../utils/auditLogger');

exports.list = asyncHandler(async (req, res) => res.json(await service.list()));

exports.create = asyncHandler(async (req, res) => {
  const order = await service.create(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'SALES_CREATED', entity: 'SalesOrder', entityId: order.id, req });
  res.status(201).json(order);
});

exports.deliver = asyncHandler(async (req, res) => {
  const order = await service.deliver(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'SALES_DELIVERED', entity: 'SalesOrder', entityId: order.id, req });
  res.json(order);
});
