// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  future: {
    compatibilityVersion: 4,
  },
  devServer: {
    port: 3333
  },
  nitro: {
    externals: {
      external: ['@prisma/client']
    }
  }
})
