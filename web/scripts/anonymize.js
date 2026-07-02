import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL="(.*)"$/m) || envContent.match(/^DATABASE_URL=(.*)$/m);
  if (match) {
    dbUrl = match[1].replace(/['"]/g, '');
  }
}

if (!dbUrl) {
  dbUrl = 'file:./dev.db';
}

let dbPath;
if (dbUrl.startsWith('file:')) {
  const rawPath = dbUrl.substring(5);
  // In Prisma, "file:./..." is relative to the prisma/ directory
  if (rawPath.startsWith('./')) {
    dbPath = path.resolve('prisma', rawPath);
  } else {
    dbPath = path.resolve(rawPath);
  }
} else {
  console.error('❌ Error: DATABASE_URL must be a local file path.');
  process.exit(1);
}

const src = dbPath;
const dest = path.join(path.dirname(src), 'share.db');

if (!fs.existsSync(src)) {
  console.error(`❌ Error: Database not found at ${src}`);
  process.exit(1);
}

// Create a copy of the database
fs.copyFileSync(src, dest);
console.log(`✅ Created a copy of the database: ${dest}`);

// Connect Prisma to the copied database by overriding the datasource URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(path.dirname(src), 'share.db')}`
    }
  }
});

async function run() {
  console.log('🔒 Redacting sensitive information...');
  
  // Redact Device Keys
  await prisma.device.updateMany({
    data: {
      localKey: 'REDACTED',
      ipAddress: 'REDACTED',
      tuyaClientId: '',
      tuyaClientSecret: ''
    }
  });

  // Redact User Information
  await prisma.user.updateMany({
    data: {
      name: 'Anonymous User',
      email: 'anon@example.com',
      avatarUrl: '',
      passwordHash: null
    }
  });

  // Redact Pet Names
  const pets = await prisma.pet.findMany({
    orderBy: { id: 'asc' }
  });
  for (let i = 0; i < pets.length; i++) {
    await prisma.pet.update({
      where: { id: pets[i].id },
      data: { name: `Pet ${i + 1}` }
    });
  }

  console.log('🎉 Success! Your database is now anonymized and completely safe to share.');
  console.log(`👉 You can find the safe file here: ${dest}`);
}

run()
  .catch((e) => {
    console.error('❌ Failed to anonymize:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
