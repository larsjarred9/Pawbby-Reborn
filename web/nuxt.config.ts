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
      { code: 'nl', name: 'Nederlands', file: 'nl.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'it', name: 'Italiano', file: 'it.json' }
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
  vite: {
    optimizeDeps: {
      include: ['spark-md5']
    },
    resolve: {
      dedupe: ['vue', 'vue-router']
    }
  },
  nitro: {
    externals: {
      external: ['@prisma/client']
    }
  }
})