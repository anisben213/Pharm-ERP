const router = require('express').Router();
const ctrl = require('./users.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createSchema, updateSchema } = require('./users.validation');

router.use(auth, rbac('ADMIN'));
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(createSchema), ctrl.create);
router.put('/:id', validate(updateSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
