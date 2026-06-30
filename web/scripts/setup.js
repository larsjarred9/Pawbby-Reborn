import { input, confirm } from '@inquirer/prompts';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function run() {
  console.log('\n🐾 Welcome to the PAWBBY REBORN setup wizard!\n');

  const checkUpdates = await confirm({
    message: 'Would you like the dashboard to notify you when new updates are available?',
    default: true
  });

  const disableUpdates = checkUpdates ? 'false' : 'true';

  const defaultDbUrl = 'file:./dev.db';
  const customDbUrl = await input({
    message: 'Where would you like to store the SQLite database?',
    default: defaultDbUrl,
    validate: (value) => {
      if (!value.startsWith('file:')) {
        return 'The database path must start with "file:" (e.g. file:./dev.db)';
      }
      return true;
    }
  });

  const envPath = path.resolve('.env');

  if (fs.existsSync(envPath)) {
    const overwrite = await confirm({
      message: 'A .env file already exists. Overwrite it?',
      default: false
    });
    if (!overwrite) {
      console.log('\nℹ️  Setup cancelled (existing .env preserved).');
      return;
    }
  }
  
  const envContent = `# ---------------------------------------------------------
# PAWBBY REBORN - ENVIRONMENT CONFIGURATION
# ---------------------------------------------------------

# Set to "true" if you are developing or if you do not want
# the built-in update checker to notify you of updates.
DISABLE_UPDATES="${disableUpdates}"

# SQLite Database Location
# By default, Prisma creates this file in the \`prisma\` folder (i.e. prisma/dev.db).
# You can change this path if you are running in Docker or
# prefer the database to be stored elsewhere (e.g. "file:/mnt/data/dev.db")
DATABASE_URL="${customDbUrl}"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Successfully generated .env file!');

  console.log('🗄️  Initializing the database schema...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database synchronized successfully!');
  } catch (error) {
    console.error('❌ Failed to synchronize the database. Please run "npx prisma db push" manually.');
  }

  console.log('\n🎉 Setup complete! You are ready to go.');
  console.log('👉 To run the application in development mode: npm run dev');
  console.log('👉 To compile for production: npm run build\n');
}

run().catch(console.error);
