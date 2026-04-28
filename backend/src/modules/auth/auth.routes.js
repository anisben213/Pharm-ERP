const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { registerSchema, loginSchema } = require('./auth.validation');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
