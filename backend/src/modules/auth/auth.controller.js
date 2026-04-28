const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');
const { recordAudit } = require('../../utils/auditLogger');
const env = require('../../config/env');

const cookieBase = {
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
};

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  await recordAudit({ userId: user.id, action: 'USER_REGISTERED', entity: 'User', entityId: user.id, req });
  res.status(201).json({ user });
});

exports.login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
  await recordAudit({ userId: user.id, action: 'USER_LOGIN', entity: 'User', entityId: user.id, req });
  res.json({ user });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { accessToken } = await authService.refresh(req.cookies?.refreshToken);
  res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.json({ ok: true });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.refreshToken);
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  if (req.user) {
    await recordAudit({ userId: req.user.id, action: 'USER_LOGOUT', entity: 'User', entityId: req.user.id, req });
  }
  res.json({ ok: true });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
