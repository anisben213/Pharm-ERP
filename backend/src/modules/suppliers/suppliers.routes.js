const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');

const schema = {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
};

router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await prisma.supplier.findMany({ orderBy: { name: 'asc' } }));
}));

router.post('/', rbac('ADMIN', 'PURCHASER'), validate(schema), asyncHandler(async (req, res) => {
  res.status(201).json(await prisma.supplier.create({ data: req.body }));
}));

module.exports = router;
