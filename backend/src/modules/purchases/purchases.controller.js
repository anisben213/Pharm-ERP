const asyncHandler = require('../../utils/asyncHandler');
const service = require('./purchases.service');
const { recordAudit } = require('../../utils/auditLogger');

exports.list = asyncHandler(async (req, res) => res.json(await service.list()));

exports.create = asyncHandler(async (req, res) => {
  const order = await service.create(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'PURCHASE_CREATED', entity: 'PurchaseOrder', entityId: order.id, req });
  res.status(201).json(order);
});

exports.confirm = asyncHandler(async (req, res) => {
  const order = await service.confirm(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'PURCHASE_CONFIRMED', entity: 'PurchaseOrder', entityId: order.id, req });
  res.json(order);
});

exports.receive = asyncHandler(async (req, res) => {
  const order = await service.receive(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'PURCHASE_RECEIVED', entity: 'PurchaseOrder', entityId: order.id, req });
  res.json(order);
});

exports.cancel = asyncHandler(async (req, res) => {
  const order = await service.cancel(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'PURCHASE_CANCELLED', entity: 'PurchaseOrder', entityId: order.id, req });
  res.json(order);
});
