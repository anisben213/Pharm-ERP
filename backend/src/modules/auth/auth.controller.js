const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const env = require('../../config/env');

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

function setAuthCookies(res, accessToken, refreshToken) {
  const baseOpts = { httpOnly: true, sameSite: env.cookie.sameSite, secure: env.cookie.secure, path: '/' };
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseOpts, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

function publicUser(u) {
  return { id: u.id, username: u.username, fullName: u.fullName, email: u.email, role: u.role, isActive: u.isActive, lastLogin: u.lastLogin };
}

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) throw new ApiError(400, 'Username and password required');
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ApiError(401, 'Invalid credentials');

    const payload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: publicUser(user), accessToken });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) throw new ApiError(401, 'No refresh token');
    const decoded = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) throw new ApiError(401, 'Refresh token invalid');
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.isActive) throw new ApiError(401, 'User inactive');
    const payload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.refreshToken.update({ where: { token }, data: { revoked: true } });
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: publicUser(user), accessToken });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
};

// Forgot password: user provides username + email; if matched, returns a
// one-time temporary password to use on next login. (Demo: returned in API
// response since no email service is configured.)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { username, email } = req.body || {};
    if (!username || !email) throw new ApiError(400, 'Username and email required');
    const user = await prisma.user.findUnique({ where: { username } });
    // Generic response so we don't disclose user existence
    if (!user || user.email.toLowerCase() !== email.toLowerCase() || !user.isActive) {
      return res.json({ ok: true, message: 'If credentials match, a temporary password has been generated.' });
    }
    const tempPassword = crypto.randomBytes(6).toString('base64').replace(/[+/=]/g, '').slice(0, 10) + '!9';
    const hash = await bcrypt.hash(tempPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tempHash: hash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    // In production this would be emailed. For demo, return it in the response.
    res.json({ ok: true, tempPassword, message: 'Temporary password issued.' });
  } catch (e) { next(e); }
};

// Reset password using current credentials (lets user replace temp password)
exports.resetPassword = async (req, res, next) => {
  try {
    const { username, currentPassword, newPassword } = req.body || {};
    if (!username || !currentPassword || !newPassword) throw new ApiError(400, 'Missing fields');
    if (newPassword.length < 8) throw new ApiError(400, 'New password must be at least 8 characters');
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(401, 'Invalid credentials');
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
