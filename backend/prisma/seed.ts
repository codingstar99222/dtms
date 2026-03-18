// backend/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Get database URL from environment
const databaseUrl =
  process.env.DATABASE_URL?.replace('file:', '') || './dev.db';

// Create adapter with URL string (not database instance)
const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

// Initialize PrismaClient with adapter
const prisma = new PrismaClient({
  adapter,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n🌱 Database Seeding\n');

  // Check if any admin exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:');
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Name: ${existingAdmin.name}`);
    rl.close();
    return;
  }

  console.log("👤 No admin found. Let's create one.\n");

  const email = await askQuestion('Enter admin email: ');
  const password = await askQuestion('Enter admin password (min 6 chars): ');
  const name = await askQuestion('Enter admin name: ');

  // Validate inputs
  if (!email || !password || !name) {
    console.error('❌ All fields are required!');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters!');
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log('\n✅ Admin user created successfully!');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${admin.name}`);
  console.log(`   Role: ${admin.role}`);

  rl.close();
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
