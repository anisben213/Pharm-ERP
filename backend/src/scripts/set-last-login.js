const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, createdAt: true } });
  for (const u of users) {
    const created = u.createdAt.getTime();
    const now = Date.now();
    const loginAt = new Date(created + Math.random() * (now - created));
    await prisma.user.update({ where: { id: u.id }, data: { lastLoginAt: loginAt } });
  }
  console.log('Updated', users.length, 'users with lastLoginAt');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
