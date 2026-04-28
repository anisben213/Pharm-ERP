const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const service = require('./logs.service');

router.use(auth, rbac('ADMIN'));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await service.list(req.query));
}));

module.exports = router;
