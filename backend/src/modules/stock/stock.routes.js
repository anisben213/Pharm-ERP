const router = require('express').Router();
const ctrl = require('./stock.controller');
const auth = require('../../middleware/authMiddleware');
const rbac = require('../../middleware/rbacMiddleware');

router.use(auth);
// Stock levels & summary are visible to all operational roles
const READERS = ['ADMIN', 'STOCK_MANAGER', 'WAREHOUSE_KEEPER', 'PRODUCTION_MANAGER', 'PURCHASER', 'SALES_AGENT', 'QUALITY_CONTROLLER', 'LAB_TECHNICIAN'];
router.get('/movements', rbac(...READERS), ctrl.listMovements);
router.get('/summary', rbac(...READERS), ctrl.stockByProduct);
router.post('/movements', rbac('ADMIN', 'STOCK_MANAGER', 'WAREHOUSE_KEEPER'), ctrl.createMovement);
router.post('/block/:batchId', rbac('ADMIN', 'QUALITY_CONTROLLER', 'STOCK_MANAGER'), ctrl.blockBatch);
router.get('/expiring', rbac(...READERS), ctrl.expiring);

module.exports = router;
