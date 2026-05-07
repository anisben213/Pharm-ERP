const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');

router.use(auth);

router.get('/', rbac('ADMIN', 'PURCHASE_MANAGER'), async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ suppliers });
  } catch (e) { next(e); }
});

router.post('/', rbac('ADMIN', 'PURCHASE_MANAGER'), async (req, res, next) => {
  try {
    const { name, contact, email } = req.body || {};
    if (!name) throw new ApiError(400, 'Name required');
    const supplier = await prisma.supplier.create({ data: { name, contact: contact || null, email: email || null } });
    res.status(201).json({ supplier });
  } catch (e) { next(e); }
});

router.put('/:id', rbac('ADMIN', 'PURCHASE_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, contact, email } = req.body || {};
    const supplier = await prisma.supplier.update({ where: { id }, data: { name, contact, email } });
    res.json({ supplier });
  } catch (e) {
    if (e.code === 'P2025') return next(new ApiError(404, 'Supplier not found'));
    next(e);
  }
});

module.exports = router;
