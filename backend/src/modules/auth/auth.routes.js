const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('./auth.controller');
const auth = require('../../middleware/authMiddleware');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

router.post('/login', loginLimiter, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', auth, ctrl.me);
router.post('/forgot-password', resetLimiter, ctrl.forgotPassword);
router.post('/reset-password', resetLimiter, ctrl.resetPassword);

module.exports = router;
