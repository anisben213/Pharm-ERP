const router = require('express').Router();
const ctrl = require('./sales.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createSchema } = require('./sales.validation');

router.use(auth);
// Read access: sales + stock (delivery notes, track delivered batch)
router.get('/', rbac('ADMIN', 'SALES_AGENT', 'STOCK_MANAGER'), ctrl.list);
router.post('/', rbac('ADMIN', 'SALES_AGENT'), validate(createSchema), ctrl.create);
// Deliver: stock manager or sales agent can mark as delivered
router.post('/:id/deliver', rbac('ADMIN', 'SALES_AGENT', 'STOCK_MANAGER'), ctrl.deliver);

module.exports = router;
