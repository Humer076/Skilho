const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.log('Usage: node scripts/create-admin.js EMAIL PASSWORD');
    process.exit(1);
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@')) {
    console.log('Please give a valid email address.');
    process.exit(1);
  }
  if (password.length < 12) {
    console.log('Password must be at least 12 characters.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      console.log(`A user with email "${cleanEmail}" already exists (role: ${existing.role}).`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email: cleanEmail, passwordHash, role: 'ADMIN' },
    });
    console.log('Admin created: ' + cleanEmail);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});