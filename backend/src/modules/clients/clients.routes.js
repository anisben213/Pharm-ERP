const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');

router.use(auth);

router.get('/', rbac('ADMIN', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ clients });
  } catch (e) { next(e); }
});

router.post('/', rbac('ADMIN', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const { name, contact, email, address } = req.body || {};
    if (!name) throw new ApiError(400, 'Name required');
    const client = await prisma.client.create({ data: { name, contact, email, address } });
    res.status(201).json({ client });
  } catch (e) { next(e); }
});

router.put('/:id', rbac('ADMIN', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, contact, email, address } = req.body || {};
    const client = await prisma.client.update({ where: { id }, data: { name, contact, email, address } });
    res.json({ client });
  } catch (e) {
    if (e.code === 'P2025') return next(new ApiError(404, 'Client not found'));
    next(e);
  }
});

module.exports = router;
