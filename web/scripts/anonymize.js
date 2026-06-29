import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const src = path.resolve('prisma/dev.db');
const dest = path.resolve('prisma/share.db');

if (!fs.existsSync(src)) {
  console.error('❌ Error: Database not found at prisma/dev.db');
  process.exit(1);
}

// Create a copy of the database
fs.copyFileSync(src, dest);
console.log('✅ Created a copy of the database: prisma/share.db');

// Connect Prisma to the copied database by overriding the datasource URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./share.db' // Paths are relative to the prisma folder when overriding like this
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
      avatarUrl: ''
    }
  });

  console.log('🎉 Success! Your database is now anonymized and completely safe to share.');
  console.log('👉 You can find the safe file here: web/prisma/share.db');
}

run()
  .catch((e) => {
    console.error('❌ Failed to anonymize:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
