const router = require('express').Router();
const ctrl = require('./sales.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');
const validate = require('../../middleware/validateMiddleware');
const asyncHandler = require('../../utils/asyncHandler');
const { createSchema } = require('./sales.validation');

router.use(auth);
// Read access: sales + stock (delivery notes, track delivered batch)
router.get('/', rbac('ADMIN', 'SALES_AGENT', 'STOCK_MANAGER'), ctrl.list);
router.post('/', rbac('ADMIN', 'SALES_AGENT'), validate(createSchema), ctrl.create);
// Deliver: stock manager or sales agent can mark as delivered
router.post('/:id/deliver', rbac('ADMIN', 'SALES_AGENT', 'STOCK_MANAGER'), ctrl.deliver);
// Return: only delivered orders can be returned
router.post('/:id/return', rbac('ADMIN', 'SALES_AGENT', 'STOCK_MANAGER'), ctrl.returnOrder);

// Single order detail
router.get('/:id', rbac('ADMIN', 'SALES_AGENT', 'STOCK_MANAGER'), asyncHandler(async (req, res) => {
  const prisma = require('../../config/db');
  const order = await prisma.salesOrder.findUnique({
    where: { id: req.params.id },
    include: { lines: { include: { product: true, batch: true } }, customer: true },
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
}));

module.exports = router;
