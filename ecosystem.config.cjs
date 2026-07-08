const fs = require('fs');
const path = require('path');

const env = {
  NODE_ENV: 'production',
  PORT: 3333
};

try {
  const envFile = fs.readFileSync(path.join(__dirname, 'web', '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim().replace(/^["']|["']$/g, '');
      if (match[1].trim() === 'DATABASE_URL' && val.startsWith('file:./')) {
        val = 'file:' + path.join(__dirname, 'web', val.replace('file:./', ''));
      }
      env[match[1].trim()] = val;
    }
  });
} catch (e) {
  console.log('No .env file found in web directory, using defaults');
}

module.exports = {
  apps: [
    {
      name: 'pawbby',
      cwd: './web',
      script: './.output/server/index.mjs',
      exec_mode: 'fork',
      instances: 1,
      env: env
    }
  ]
}
