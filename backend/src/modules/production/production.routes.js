const router = require('express').Router();
const ctrl = require('./production.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createSchema, completeSchema } = require('./production.validation');

router.use(auth);
// Read access: production team + quality (consult production history) + stock
const READERS = ['ADMIN', 'PRODUCTION_MANAGER', 'QUALITY_CONTROLLER', 'STOCK_MANAGER'];
router.get('/', rbac(...READERS), ctrl.list);
router.post('/', rbac('ADMIN', 'PRODUCTION_MANAGER'), validate(createSchema), ctrl.create);
router.post('/:id/start', rbac('ADMIN', 'PRODUCTION_MANAGER'), ctrl.start);
router.post('/:id/complete', rbac('ADMIN', 'PRODUCTION_MANAGER'), validate(completeSchema), ctrl.complete);

module.exports = router;
