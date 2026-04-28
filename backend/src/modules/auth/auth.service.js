const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const ApiError = require('../../utils/ApiError');

async function register({ email, password, fullName, role }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role: role || 'SALES_AGENT' },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  });
  return user;
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  };
}

async function refresh(oldToken) {
  if (!oldToken) throw new ApiError(401, 'Missing refresh token');
  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Invalid refresh token');
  }
  let decoded;
  try {
    decoded = verifyRefreshToken(oldToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
  const payload = { sub: decoded.sub, role: decoded.role, email: decoded.email };
  const accessToken = signAccessToken(payload);
  return { accessToken };
}

async function logout(token) {
  if (!token) return;
  await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
}

module.exports = { register, login, refresh, logout };
