const router = require('express').Router();
const ctrl = require('./batches.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { updateStatusSchema } = require('./batches.validation');

router.use(auth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.get('/:id/trace', ctrl.trace);
router.get('/:id/affected', rbac('ADMIN', 'QUALITY_CONTROLLER'), ctrl.getAffected);
router.patch(
  '/:id/status',
  rbac('ADMIN', 'QUALITY_CONTROLLER', 'PRODUCTION_MANAGER'),
  validate(updateStatusSchema),
  ctrl.updateStatus
);
router.post(
  '/:id/recall',
  rbac('ADMIN', 'QUALITY_CONTROLLER'),
  ctrl.recall
);
router.patch(
  '/:id/corrective-action',
  rbac('ADMIN', 'QUALITY_CONTROLLER'),
  ctrl.setCorrectiveAction
);

module.exports = router;
