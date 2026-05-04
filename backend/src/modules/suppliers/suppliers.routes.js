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

router.patch('/:id/rate', rbac('ADMIN', 'PURCHASER'), asyncHandler(async (req, res) => {
  const { rating } = req.body;
  const r = Number(rating);
  if (!r || r < 1 || r > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  const supplier = await prisma.supplier.findUnique({ where: { id: req.params.id } });
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(await prisma.supplier.update({ where: { id: req.params.id }, data: { rating: r } }));
}));

module.exports = router;
