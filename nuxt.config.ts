export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@/assets/styles/main.scss'],
  app: {
    head: {
      script: [] // removed theme bootstrap script
    }
  },
  runtimeConfig: {
    tmdbApiKey: process.env.TMDB_API_KEY,
    public: {
      tmdbImageBase: 'https://image.tmdb.org/t/p/w500'
    }
  }
})