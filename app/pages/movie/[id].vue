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
            <img class="poster" :src="posterUrl" :alt="movie.title" />

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
                    <img :src="profileUrl(p.profile_path)" :alt="p.name" loading="lazy" />
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
    : 'https://via.placeholder.com/500x750?text=No+Image'
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
  return path ? `${pub.tmdbImageBase}${path}` : 'https://via.placeholder.com/300x450?text=No+Image'
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

<style scoped lang="scss">

.details__bg-root {
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
}
.details__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-attachment: fixed; 
  filter: blur(24px) saturate(1.05);
  transform: scale(1.12);
  opacity: 0;
  transition: opacity .6s ease;
}
.details__bg.is-visible { opacity: 1; }

/* Keep backdrop image unchanged (no theme recolor) */
.details__bg {
  background-blend-mode: normal;
  filter: blur(24px) saturate(1.05);
}

.details__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.85) 100%),
    radial-gradient(60% 60% at 20% 35%, rgba(0,0,0,0.35), rgba(0,0,0,0) 70%);
}

/* Back button */
.back {
  margin: 16px 0;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease;
}
.back:hover {
  border-color: color-mix(in oklab, var(--accent) 40%, var(--border));
}

/* Error message */
.error {
  margin: 40px 0;
  padding: 16px;
  border: 1px solid color-mix(in oklab, var(--accent) 40%, var(--border));
  border-radius: 10px;
  background: rgba(255, 0, 0, 0.1);
  color: var(--text);
  text-align: center;
}

/* Two-column layout: left (poster + genres), right (details) */
.details__content {
  display: grid;
  grid-template-columns: 340px 1fr; /* desktop */
  gap: 28px;
  align-items: start;
}

.poster-column {
  display: flex;
  flex-direction: column;
  gap: 12px; /* space between poster and genres */
  min-width: 0; /* avoid overflow */
}
.details-column {
  min-width: 0; /* allow text to wrap nicely */
}

/* Ensure the genres block sits snug under the poster */
.poster-column .details__extras {
  margin-top: 0; /* override any larger top margin */
}

/* Genre badges: compact rounded tags */
.details__extras .badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.details__extras .badge {
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--bg-elev) 85%, black);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
}

/* Poster */
.poster {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #0e141d;
}

/* New: Genres / Duration / Rating below poster */
.details__extras {
  margin-top: 14px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 10px;
}
.details__extras .badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.details__extras .badge {
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--bg-elev) 85%, black);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
}
.details__extras .extras__rows {
  display: grid;
  gap: 8px;
}
.details__extras .extra {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 8px;
}
.details__extras .label { color: var(--muted); font-size: 12px; }
.details__extras .value { color: var(--text); font-size: 14px; }
@media (max-width: 980px) {
  .details__extras { margin-top: 10px; }
  .details__extras .extra { grid-template-columns: 90px 1fr; }
}

/* Info */
.info .title {
  margin: 0 0 8px 0;
}
.info .title .original {
  color: var(--muted);
  font-weight: 400;
  margin-left: 6px;
}
.meta {
  margin: 0 0 14px 0;
  color: var(--muted);
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.overview {
  margin: 0 0 18px 0;
  color: #d2d9e6;
}

/* Facts grid */
.facts {
  display: grid;
  gap: 10px;
  margin: 18px 0 10px;
}
.fact {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  align-items: center;
}
.fact .label { color: var(--muted); }
.fact .value { color: var(--text); }
.fact .link {
  text-decoration: none;
  padding: 2px 0;
  border-bottom: 1px dashed color-mix(in oklab, var(--accent) 60%, var(--border));
}
.socials__links {
  display: inline-flex;
  gap: 10px;
}
.socials__links a {
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 10px;
  text-decoration: none;
  transition: border-color .2s ease, background .2s ease;
}
.socials__links a:hover {
  border-color: color-mix(in oklab, var(--accent) 40%, var(--border));
}

/* Cast scroller */
.cast { margin-top: 22px; }
.cast h2 { margin: 0 0 10px 0; font-size: 18px; }
.cast__scroller {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 140px;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  scroll-snap-type: x mandatory;
}
.cast__scroller::-webkit-scrollbar { height: 8px; }
.cast__scroller::-webkit-scrollbar-thumb { background: #1a2636; border-radius: 999px; }
.cast__card {
  scroll-snap-align: start;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.cast__card img {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  display: block;
  background: #0e141d;
}
.cast__card .name { margin: 8px 8px 2px 8px; font-size: 14px; color: var(--text); transition: color .5s ease-in-out; }
.cast__card .character { margin: 0 8px 10px 8px; color: var(--muted); font-size: 12px; transition: color .5s ease-in-out; }

/* Page enter/leave */
.fade-up-enter-from { opacity: 0; transform: translateY(8px); filter: blur(2px); }
.fade-up-enter-active,
.fade-up-leave-active { transition: opacity .35s ease, transform .35s ease, filter .35s ease; }
.fade-up-leave-to { opacity: 0; transform: translateY(-6px); filter: blur(2px); }

/* Responsive */
@media (max-width: 980px) {
  .details__content { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .details__content {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .poster-column { order: 1; }
  .details-column { order: 2; }
}
</style>