module.exports = {
  apps: [
    {
      name: 'pawbby',
      port: '3000',
      cwd: './web',
      script: './.output/server/index.mjs',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
}
