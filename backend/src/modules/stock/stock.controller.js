const asyncHandler = require('../../utils/asyncHandler');
const service = require('./stock.service');

exports.listMovements = asyncHandler(async (req, res) => res.json(await service.listMovements(req.query)));
exports.stockByProduct = asyncHandler(async (req, res) => res.json(await service.stockByProduct()));
exports.createMovement = asyncHandler(async (req, res) => res.status(201).json(await service.createMovement(req.body)));
exports.blockBatch = asyncHandler(async (req, res) => res.json(await service.blockBatch(req.params.batchId, req.user.id)));
exports.expiring = asyncHandler(async (req, res) => res.json(await service.expiring(req.query.days || 90)));
