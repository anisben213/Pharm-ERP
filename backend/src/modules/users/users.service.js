const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const ApiError = require('../../utils/ApiError');

const publicSelect = {
  id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true,
};

async function list() {
  return prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: 'desc' } });
}

async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicSelect });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function create(data) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new ApiError(409, 'Email already used');
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { email: data.email, fullName: data.fullName, role: data.role, passwordHash },
    select: publicSelect,
  });
}

async function update(id, data) {
  const updateData = { fullName: data.fullName, role: data.role, isActive: data.isActive };
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.update({ where: { id }, data: updateData, select: publicSelect });
}

async function remove(id) {
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}

module.exports = { list, getById, create, update, remove };
