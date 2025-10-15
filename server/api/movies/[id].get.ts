import { H3Event, getRouterParam } from 'h3'

export default eventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  if (!config.tmdbApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'TMDB_API_KEY missing in server runtimeConfig' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Movie id is required' })
  }

  const data = await $fetch(`https://api.themoviedb.org/3/movie/${id}`, {
    query: {
      api_key: config.tmdbApiKey as string,
      language: 'en-US',
      append_to_response: 'credits,external_ids' // added to return full data in one response
    }
  })

  return data
})