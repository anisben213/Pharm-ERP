const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');

router.use(auth, rbac('ADMIN'));

const ROLES = ['ADMIN', 'STOCK_MANAGER', 'PRODUCTION_MANAGER', 'PURCHASE_MANAGER', 'QUALITY_MANAGER', 'SALES_MANAGER'];

function publicUser(u) {
  if (!u) return null;
  return { id: u.id, username: u.username, fullName: u.fullName, email: u.email, role: u.role, isActive: u.isActive, lastLogin: u.lastLogin, createdAt: u.createdAt };
}

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ users: users.map(publicUser) });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, fullName, email, role, password } = req.body || {};
    if (!username || !fullName || !email || !role || !password) throw new ApiError(400, 'Missing required fields');
    if (!ROLES.includes(role)) throw new ApiError(400, 'Invalid role');
    if (password.length < 8) throw new ApiError(400, 'Password must be ≥ 8 characters');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, fullName, email, role, passwordHash } });
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    if (e.code === 'P2002') return next(new ApiError(409, 'Username or email already exists'));
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { fullName, email, role, password, isActive } = req.body || {};
    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (email !== undefined) data.email = email;
    if (role !== undefined) {
      if (!ROLES.includes(role)) throw new ApiError(400, 'Invalid role');
      data.role = role;
    }
    if (isActive !== undefined) data.isActive = !!isActive;
    if (password) {
      if (password.length < 8) throw new ApiError(400, 'Password must be ≥ 8 characters');
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({ where: { id }, data });
    res.json({ user: publicUser(user) });
  } catch (e) {
    if (e.code === 'P2025') return next(new ApiError(404, 'User not found'));
    if (e.code === 'P2002') return next(new ApiError(409, 'Username or email already exists'));
    next(e);
  }
});

router.put('/:id/deactivate', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ user: publicUser(user) });
  } catch (e) {
    if (e.code === 'P2025') return next(new ApiError(404, 'User not found'));
    next(e);
  }
});

router.put('/:id/activate', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await prisma.user.update({ where: { id }, data: { isActive: true } });
    res.json({ user: publicUser(user) });
  } catch (e) {
    if (e.code === 'P2025') return next(new ApiError(404, 'User not found'));
    next(e);
  }
});

module.exports = router;
