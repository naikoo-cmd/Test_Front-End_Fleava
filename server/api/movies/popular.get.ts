import { H3Event } from 'h3'

export default eventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  if (!config.tmdbApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'TMDB_API_KEY missing in server runtimeConfig' })
  }

  // Accept optional category and page query params
  const q = getQuery(event)
  const rawCategory = (q.category as string) || 'popular'
  const pageParam = parseInt((q.page as string) || '1', 10)
  const parsedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  // TMDb list endpoints generally cap at 500 pages
  const page = Math.min(Math.max(parsedPage, 1), 500)

  // Map allowed categories to TMDb endpoints
  const allowed: Record<string, string> = {
    popular: 'popular',
    upcoming: 'upcoming',
    top_rated: 'top_rated'
  }
  const segment = allowed[rawCategory] || 'popular'

  const data = await $fetch(`https://api.themoviedb.org/3/movie/${segment}`, {
    query: {
      api_key: config.tmdbApiKey as string,
      language: 'en-US',
      page
    }
  })

  return data
})