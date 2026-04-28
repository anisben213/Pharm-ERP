const router = require('express').Router();
const ctrl = require('./quality.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { inspectSchema } = require('./quality.validation');

router.use(auth);
// Read access: quality team + production manager (consult quality history)
router.get('/', rbac('ADMIN', 'QUALITY_CONTROLLER', 'LAB_TECHNICIAN', 'PRODUCTION_MANAGER'), ctrl.list);
// Lab technician can enter results; quality controller can also validate/reject
router.post('/', rbac('ADMIN', 'QUALITY_CONTROLLER', 'LAB_TECHNICIAN'), validate(inspectSchema), ctrl.inspect);

module.exports = router;
