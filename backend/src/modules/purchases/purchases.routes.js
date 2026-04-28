const router = require('express').Router();
const ctrl = require('./purchases.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createSchema } = require('./purchases.validation');

router.use(auth, rbac('ADMIN', 'PURCHASER', 'STOCK_MANAGER', 'WAREHOUSE_KEEPER'));
router.get('/', ctrl.list);
router.post('/', validate(createSchema), ctrl.create);
router.post('/:id/confirm', ctrl.confirm);
router.post('/:id/receive', ctrl.receive);
router.post('/:id/cancel', ctrl.cancel);

module.exports = router;
