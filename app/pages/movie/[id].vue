<template>
  <section class="details">
    <!-- Full-page blurred background -->
    <div class="details__bg-root" aria-hidden="true">
      <div class="details__bg" :class="{ 'is-visible': !!movie }" :style="bgStyle" />
      <div class="details__overlay" />
    </div>

    <div class="container">
      <!-- Back -->
      <button class="back" @click="goBack" aria-label="Go back" v-animate>← Back</button>

      <div v-if="error" class="error" v-animate>
        <p>Failed to load movie details.</p>
      </div>

      <!-- Content -->
      <transition name="fade-up" mode="out-in">
        <article v-if="movie" :key="movie.id" class="details__content" v-animate>
          <!-- New two-column layout -->
          <div class="poster-column">
            <!-- Poster (left column) -->
            <img class="poster" :src="posterUrl" :alt="movie.title" @error="onPosterError" />

            <!-- Genres/Duration/Rating directly UNDER the poster -->
            <section class="details__extras" v-if="movie">
              <div class="badges" v-if="movie.genres?.length">
                <span v-for="g in movie.genres" :key="g.id" class="badge">{{ g.name }}</span>
              </div>
              <div class="extras__rows">
                <div class="extra">
                  <span class="label">Duration</span>
                  <span class="value">{{ runtimeFormatted }}</span>
                </div>
                <div class="extra">
                  <span class="label">Rated</span>
                  <span class="value">{{ certification || 'NR' }}</span>
                </div>
              </div>
            </section>
          </div>

          <!-- Details (right column) -->
          <section class="details-column">
            <div class="info">
              <h1 class="title">
                {{ movie.title }}
                <span
                  v-if="movie.original_title && movie.original_title !== movie.title"
                  class="original"
                >({{ movie.original_title }})</span>
              </h1>

              <p class="meta">
                <span>Released: {{ movie.release_date || '—' }}</span>
                <span>Status: {{ movie.status || '—' }}</span>
                <span v-if="movie.vote_average">Rating: ⭐ {{ movie.vote_average.toFixed(1) }}</span>
                <span>Language: {{ movie.original_language?.toUpperCase?.() || '—' }}</span>
              </p>

              <p class="overview">
                {{ movie.overview || 'No overview available.' }}
              </p>

              <div class="facts">
                <div class="fact">
                  <span class="label">Director</span>
                  <span class="value">{{ director || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="label">Budget</span>
                  <span class="value">{{ formatMoney(movie.budget) }}</span>
                </div>
                <div class="fact">
                  <span class="label">Revenue</span>
                  <span class="value">{{ formatMoney(movie.revenue) }}</span>
                </div>
                <div class="fact" v-if="movie.homepage">
                  <span class="label">Homepage</span>
                  <a class="value link" :href="movie.homepage" target="_blank" rel="noopener">Visit site ↗</a>
                </div>
                <div class="fact socials" v-if="hasSocials">
                  <span class="label">Social</span>
                  <div class="value socials__links">
                    <a
                      v-if="social.twitter"
                      :href="`https://twitter.com/${social.twitter}`"
                      target="_blank" rel="noopener" aria-label="Twitter"
                    >Twitter</a>
                    <a
                      v-if="social.instagram"
                      :href="`https://instagram.com/${social.instagram}`"
                      target="_blank" rel="noopener" aria-label="Instagram"
                    >Instagram</a>
                    <a
                      v-if="social.facebook"
                      :href="`https://facebook.com/${social.facebook}`"
                      target="_blank" rel="noopener" aria-label="Facebook"
                    >Facebook</a>
                  </div>
                </div>
              </div>

              <!-- Top billed cast -->
              <section class="cast" v-if="topCast.length" v-animate>
                <h2>Top Billed Cast</h2>
                <div class="cast__scroller">
                  <div v-for="p in topCast" :key="p.id" class="cast__card">
                    <img :src="profileUrl(p.profile_path)" :alt="p.name" loading="lazy" @error="onProfileError" />
                    <p class="name">{{ p.name }}</p>
                    <p class="character" v-if="p.character">{{ p.character }}</p>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </article>
      </transition>
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const id = computed(() => route.params.id as string)
const router = useRouter()
const { public: pub } = useRuntimeConfig()

type Cast = { id: number; name: string; character?: string; profile_path?: string | null }
type MovieDetails = {
  id: number
  title: string
  original_title?: string
  overview?: string
  status?: string
  original_language?: string
  release_date?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  budget?: number
  revenue?: number
  homepage?: string | null
  credits?: { cast?: Cast[]; crew?: Array<{ job?: string; name?: string }> } | null
  external_ids?: { twitter_id?: string | null; instagram_id?: string | null; facebook_id?: string | null } | null
  runtime?: number
  genres?: Array<{ id: number; name: string }>
  release_dates?: {
    results?: Array<{
      iso_3166_1: string
      release_dates?: Array<{ certification?: string; type?: number }>
    }>
  } | null
}

const { data, error } = await useAsyncData(
  () => `movie-${id.value}`,                // unique
  () => $fetch(`/api/movies/${id.value}`),  
  { watch: [id], server: true }             
)

const movie = computed(() => data.value as MovieDetails | null)

// Display helpers
const posterUrl = computed(() =>
  movie.value?.poster_path
    ? `${pub.tmdbImageBase}${movie.value.poster_path}`
    : '/placeholder-poster.svg'
)

// Background: choose backdrop or poster;
const backdropBase = 'https://image.tmdb.org/t/p/w780'
const bgUrl = computed(() => {
  const path = movie.value?.backdrop_path || movie.value?.poster_path
  return path ? `${backdropBase}${path}` : ''
})
const bgStyle = computed(() => (bgUrl.value ? { backgroundImage: `url('${bgUrl.value}')` } : {}))

const director = computed(() =>
  movie.value?.credits?.crew?.find((c: { job?: string; name?: string }) => c?.job === 'Director')?.name || ''
)
const topCast = computed<Cast[]>(() => (movie.value?.credits?.cast || []).slice(0, 5))
const social = computed(() => ({
  twitter: movie.value?.external_ids?.twitter_id || null,
  instagram: movie.value?.external_ids?.instagram_id || null,
  facebook: movie.value?.external_ids?.facebook_id || null
}))
const hasSocials = computed(() => !!(social.value.twitter || social.value.instagram || social.value.facebook))

const runtimeFormatted = computed(() => {
  const mins = movie.value?.runtime
  if (!mins || mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
})

const certification = computed(() => {
  const rd = movie.value?.release_dates?.results || []
  const us = rd.find(r => r.iso_3166_1 === 'US')
  const pick = us?.release_dates?.find(d => d.certification) ||
    rd.flatMap(r => r.release_dates || []).find(d => d?.certification)
  return pick?.certification || ''
})

function profileUrl(path?: string | null) {
  return path ? `${pub.tmdbImageBase}${path}` : '/placeholder-profile.svg'
}
const FALLBACK_POSTER = '/placeholder-poster.svg'
const FALLBACK_PROFILE = '/placeholder-profile.svg'
function onPosterError(e: Event) {
  const el = e.target as HTMLImageElement | null
  if (!el || el.src.endsWith(FALLBACK_POSTER)) return
  el.src = FALLBACK_POSTER
}
function onProfileError(e: Event) {
  const el = e.target as HTMLImageElement | null
  if (!el || el.src.endsWith(FALLBACK_PROFILE)) return
  el.src = FALLBACK_PROFILE
}
function formatMoney(n?: number) {
  if (!n || n <= 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function goBack() {
  if (process.client && window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped lang="scss" src="@/assets/styles/details.scss"></style>
