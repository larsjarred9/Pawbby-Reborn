module.exports = {
  apps: [
    {
      name: 'pawbby',
      cwd: './web',
      script: './.output/server/index.mjs',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
