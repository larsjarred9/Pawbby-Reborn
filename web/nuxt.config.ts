// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n'
  ],
  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'nl', name: 'Nederlands', file: 'nl.json' }
    ],
    lazy: false,
    defaultLocale: 'en',
    strategy: 'no_prefix'
  },
  tailwindcss: {
    viewer: false
  },
  future: {
    compatibilityVersion: 4,
  },
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/litterbox.png',
        },
      ],
    },
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