const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');

const createSchema = {
  body: z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['RAW_MATERIAL', 'FINISHED_PRODUCT', 'PACKAGING']),
    unit: z.string().optional(),
    description: z.string().optional(),
    minLevel: z.number().min(0).optional(),
  }),
};

router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await prisma.product.findMany({ orderBy: { name: 'asc' } }));
}));

router.post('/', rbac('ADMIN', 'PURCHASER'), validate(createSchema), asyncHandler(async (req, res) => {
  const p = await prisma.product.create({ data: req.body });
  res.status(201).json(p);
}));

router.patch('/:id/min-level', rbac('ADMIN', 'STOCK_MANAGER'), asyncHandler(async (req, res) => {
  const { minLevel } = req.body;
  if (minLevel === undefined || Number(minLevel) < 0) {
    return res.status(400).json({ message: 'minLevel must be >= 0' });
  }
  const p = await prisma.product.update({
    where: { id: req.params.id },
    data: { minLevel: Number(minLevel) },
  });
  res.json(p);
}));

module.exports = router;
