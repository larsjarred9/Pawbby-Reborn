module.exports = {
  apps: [
    {
      name: 'pawbby',
      port: '3000',
      exec_mode: 'cluster',
      instances: 'max',
      script: './web/.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
}
