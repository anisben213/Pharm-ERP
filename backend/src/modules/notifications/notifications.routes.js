const router = require('express').Router();
const prisma = require('../../config/db');
const auth = require('../../middleware/authMiddleware');
const ApiError = require('../../utils/ApiError');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientRole: req.user.role },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const unread = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unread });
  } catch (e) { next(e); }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const unread = await prisma.notification.count({
      where: { recipientRole: req.user.role, isRead: false },
    });
    res.json({ unread });
  } catch (e) { next(e); }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n) throw new ApiError(404, 'Notification not found');
    if (n.recipientRole !== req.user.role) throw new ApiError(403, 'Forbidden');
    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ notification: updated });
  } catch (e) { next(e); }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientRole: req.user.role, isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
