const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const ApiError = require('../../utils/ApiError');

router.use(auth);

const CATEGORIES = ['FINISHED_PRODUCT', 'RAW_MATERIAL'];

// Sales Manager catalog: only FP with at least one VALIDATED LOT in stock
router.get('/catalog', rbac('ADMIN', 'SALES_MANAGER'), async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { category: 'FINISHED_PRODUCT' },
      include: {
        batches: {
          where: { status: 'VALIDATED', batchType: 'LOT' },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    const result = products.map((p) => {
      const totalQty = p.batches.reduce((s, b) => s + b.quantity, 0);
      const earliestExpiry = p.batches[0]?.expiryDate || null;
      return {
        id: p.id,
        name: p.name,
        unit: p.unit,
        availableQuantity: totalQty,
        earliestExpiry,
        batches: p.batches.map((b) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          quantity: b.quantity,
          expiryDate: b.expiryDate,
        })),
      };
    });
    res.json({ products: result });
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const products = await prisma.product.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products });
  } catch (e) { next(e); }
});

router.post('/', rbac('ADMIN'), async (req, res, next) => {
  try {
    const { name, category, unit, minStockLevel } = req.body || {};
    if (!name || !category || !unit) throw new ApiError(400, 'name, category, unit required');
    if (!CATEGORIES.includes(category)) throw new ApiError(400, 'Invalid category');
    const product = await prisma.product.create({
      data: {
        name,
        category,
        unit,
        minStockLevel: typeof minStockLevel === 'number' ? minStockLevel : 0,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ product });
  } catch (e) { next(e); }
});

router.put('/:id', rbac('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, category, unit, minStockLevel } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = name;
    if (unit !== undefined) data.unit = unit;
    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) throw new ApiError(400, 'Invalid category');
      data.category = category;
    }
    if (minStockLevel !== undefined) data.minStockLevel = Number(minStockLevel);
    const product = await prisma.product.update({ where: { id }, data });
    res.json({ product });
  } catch (e) {
    if (e.code === 'P2025') return next(new ApiError(404, 'Product not found'));
    next(e);
  }
});

module.exports = router;
