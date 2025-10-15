<template>
  <div>
    <!-- Full-width Hero Slideshow -->
    <section class="hero" v-if="!error">
      <div v-if="pending" class="hero__skeleton skeleton"></div>

      <div
        v-else
        class="hero__inner"
        role="region"
        aria-label="Popular movies slideshow"
        @mouseenter="pause"
        @mouseleave="resume"
      >
        <transition name="hero-fade" mode="out-in" v-if="currentMovie">
          <div
            class="hero__slide"
            :key="currentMovie?.id"
            :style="slideStyle"
          >
            <div class="hero__overlay"></div>
            <div class="hero__content">
              <h1 class="hero__title">{{ currentMovie.title }}</h1>
              <p class="hero__meta">
                <span>{{ year(currentMovie.release_date) }}</span>
                <span v-if="currentMovie.vote_average">⭐ {{ currentMovie.vote_average.toFixed(1) }}</span>
              </p>
              <p class="hero__overview">
                {{ currentMovie.overview }}
              </p>
              <NuxtLink class="link hero__cta" :to="`/movie/${currentMovie.id}`">
                View details →
              </NuxtLink>
            </div>
          </div>
        </transition>

        <button v-if="currentMovie" class="hero__nav prev" @click="prev" aria-label="Previous slide">←</button>
        <button v-if="currentMovie" class="hero__nav next" @click="next" aria-label="Next slide">→</button>
      </div>
    </section>

    <!-- Movie grid -->
    <section class="below">
      <header class="section-header" v-animate>
        <div class="header-row">
          <div>
            <h2>{{ categoryLabel }}</h2>
            <p>Browse the latest trending picks</p>
          </div>
          <div class="category-tabs">
            <button class="link" :class="{ 'is-active': selectedCategory === 'popular' }" @click="setCategory('popular')">
              Popular
            </button>
            <button class="link" :class="{ 'is-active': selectedCategory === 'upcoming' }" @click="setCategory('upcoming')">
              Upcoming
            </button>
            <button class="link" :class="{ 'is-active': selectedCategory === 'top_rated' }" @click="setCategory('top_rated')">
              Top Rated
            </button>
          </div>
        </div>
      </header>

      <!-- Movie grid states -->
      <transition name="list-fade" mode="out-in">
        <template v-if="pending">
          <div class="grid">
            <div v-for="n in 8" :key="n" class="card skeleton"></div>
          </div>
        </template>
        <template v-else-if="error">
          <div class="error" v-animate>
            <p>Failed to load movies. Please try again.</p>
          </div>
        </template>
        <template v-else>
          <div class="grid" :key="selectedCategory">
            <MovieCard
              v-for="movie in displayedMovies"
              :key="movie.id"
              :movie="movie"
              v-animate
            />
          </div>
        </template>
      </transition>

      <div v-if="!pending && !error" class="load-more" v-animate>
        <div v-show="!noMore" ref="infiniteSentinel" class="infinite-sentinel" aria-hidden="true"></div>
        <p v-if="noMore" class="end-hint">No more movies</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * DATA FETCHING 
 */
type Movie = {
  id: number
  title: string
  backdrop_path?: string | null
  poster_path?: string | null
  overview?: string
  release_date?: string
  vote_average?: number
}
type PopularResponse = {
  page: number
  total_pages: number
  total_results: number
  results: Movie[]
}

const { data, pending, error } = await useAsyncData('popular', () =>
  $fetch<PopularResponse>('/api/movies/popular', { query: { page: 1 } })
)

/**
 * PAGINATION STATE FOR GRID (5-at-a-time), 
 */
const CHUNK = 5
const MAX = Infinity 

const fetchedMovies = ref<Movie[]>([])
const displayedMovies = ref<Movie[]>([])
const nextIndex = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const loadingMore = ref(false)
const ids = ref<Set<number>>(new Set())

/**
 * Category state (grid only; hero remains Popular
 */
type Category = 'popular' | 'upcoming' | 'top_rated'
const selectedCategory = ref<Category>('popular')
const categoryLabel = computed(() => {
  switch (selectedCategory.value) {
    case 'upcoming': return 'Upcoming Movies'
    case 'top_rated': return 'Top Rated Movies'
    default: return 'Popular Movies'
  }
})
function setCategory(cat: Category) {
  if (selectedCategory.value === cat) return
  selectedCategory.value = cat
}

/**
 * Initialize from first response:
 * - Seed buffer with results from page 1
 * - Append first up-to-5 (respecting MAX)
 */
watch(
  () => data.value,
  async (val) => {
    if (!val) return
    const res = val as PopularResponse
    fetchedMovies.value = [...(res.results || [])]
    currentPage.value = res.page
    totalPages.value = res.total_pages

    displayedMovies.value = []
    ids.value.clear()
    nextIndex.value = 0
    await appendChunk(CHUNK)
  },
  { immediate: true }
)

// Fetch one page for the current category (server route should proxy category/page)
async function fetchCategoryPage(page: number) {
  return await $fetch<PopularResponse>('/api/movies/popular', {
    query: { page, category: selectedCategory.value }
  })
}

// Reset and load first chunk for current category
async function initCategory() {
  displayedMovies.value = []
  fetchedMovies.value = []
  ids.value.clear()
  nextIndex.value = 0
  loadingMore.value = false
  // page 1
  const res = await fetchCategoryPage(1)
  currentPage.value = res.page
  totalPages.value = res.total_pages
  if (Array.isArray(res.results)) fetchedMovies.value.push(...res.results)
  await appendChunk(CHUNK)
}
// Run on category change (and once on mount)
watch(selectedCategory, () => { initCategory() }, { immediate: true })


const noMore = computed(() => {
  if (displayedMovies.value.length >= MAX) return true
  const bufferExhausted = nextIndex.value >= fetchedMovies.value.length
  const pagesExhausted = currentPage.value >= totalPages.value
  return bufferExhausted && pagesExhausted
})


function appendFromBuffer(limit: number): number {
  if (displayedMovies.value.length >= MAX) return 0
  let capacity = MAX - displayedMovies.value.length
  let toTake = Math.min(limit, capacity)

  let added = 0
  while (added < toTake && nextIndex.value < fetchedMovies.value.length) {
    const m = fetchedMovies.value[nextIndex.value++]
    if (!m) continue
    if (ids.value.has(m.id)) continue // avoid duplicates across pages
    ids.value.add(m.id)
    displayedMovies.value.push(m)
    added++
  }
  return added
}


async function fetchNextPage() {
  if (displayedMovies.value.length >= MAX) return 0
  if (currentPage.value >= totalPages.value) return 0

  const next = currentPage.value + 1
  const before = fetchedMovies.value.length
  const res = await fetchCategoryPage(next)

  currentPage.value = res.page
  totalPages.value = res.total_pages
  if (Array.isArray(res.results) && res.results.length) {
    fetchedMovies.value.push(...res.results)
  }

  return fetchedMovies.value.length - before
}


async function appendChunk(count: number) {
  if (displayedMovies.value.length >= MAX) return

  let need = Math.min(count, MAX - displayedMovies.value.length)

  while (need > 0) {
    const added = appendFromBuffer(need)
    need -= added

    if (need <= 0) break

    if (currentPage.value < totalPages.value && displayedMovies.value.length < MAX) {
      const grown = await fetchNextPage()
      if (!grown) break
      continue
    }

    break
  }
}


async function onLoadMore() {
  if (loadingMore.value || noMore.value || displayedMovies.value.length >= MAX) return
  loadingMore.value = true
  try {
    await appendChunk(CHUNK)
  } finally {
    loadingMore.value = false
  }
}

const infiniteSentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function setupInfiniteScroll() {
  if (!infiniteSentinel.value) return
  io = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (!entry?.isIntersecting) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (loadingMore.value || pending.value || noMore.value) return
      loadingMore.value = true
      try {
        await appendChunk(CHUNK)
      } finally {
        loadingMore.value = false
      }
    }, 150)
  }, { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0 })
  io.observe(infiniteSentinel.value)
}

onMounted(setupInfiniteScroll)
onBeforeUnmount(() => { io?.disconnect(); io = null; if (debounceTimer) clearTimeout(debounceTimer) })


const firstPageMovies = computed(() => (data.value?.results || []).slice(0, 10))
const slides = computed(() => firstPageMovies.value.filter(m => m.backdrop_path || m.poster_path))

const current = ref(0)
const intervalMs = 4500 // auto-advance duration (ms)
let timer: ReturnType<typeof setInterval> | null = null

const backdropBase = 'https://image.tmdb.org/t/p/w1280'

const currentMovie = computed(() => slides.value[current.value] || null)
const slideStyle = computed(() => {
  const m = currentMovie.value
  const path = m?.backdrop_path || m?.poster_path
  const url = path ? `${backdropBase}${path}` : 'https://via.placeholder.com/1280x720?text=No+Image'
  return { backgroundImage: `url('${url}')` }
})

function next() {
  if (!slides.value.length) return
  current.value = (current.value + 1) % slides.value.length
}
function prev() {
  if (!slides.value.length) return
  current.value = (current.value - 1 + slides.value.length) % slides.value.length
}

function start() {
  stop()
  if (slides.value.length > 1) {
    timer = setInterval(next, intervalMs)
  }
}
function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function pause() { stop() }
function resume() { start() }

function year(d?: string) {
  return d ? new Date(d).getFullYear() : '—'
}

onMounted(start)
onBeforeUnmount(stop)
watch(slides, (val) => {
  if (!val.length) return stop()
  if (current.value >= val.length) current.value = 0
  start()
})
</script>

<style scoped lang="scss">
.hero {
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  width: 100vw;

  position: relative;
  min-height: 100svh; 
  height: 100svh;

  // fallback for older browsers
  @supports not (height: 100svh) {
    min-height: 100vh;
    height: 100vh;
  }
}

.hero__skeleton { height: 100%; width: 100%; }
.hero__inner { position: relative; height: 100%; }
.hero__slide {
  position: relative;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.0) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.75) 100%),
    radial-gradient(60% 60% at 20% 35%, rgba(0,0,0,0.45), rgba(0,0,0,0) 70%);
  pointer-events: none;
}

.hero__content {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
  color: var(--text);
  text-shadow: 0 2px 14px rgba(0,0,0,.45);
}

.hero__title {
  margin: 0 0 6px 0;
  font-size: clamp(22px, 4.5vw, 40px);
  font-weight: 800;
}

.hero__meta {
  margin: 0 0 12px 0;
  color: var(--muted);
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.hero__overview {
  margin: 0 0 16px 0;
  max-width: 70ch;
  color: #d2d9e6;
  font-size: clamp(14px, 2vw, 16px);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4; 
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero__cta {
  display: inline-block;
  background: color-mix(in oklab, var(--bg-elev) 85%, black);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
}

/* Nav arrows */
.hero__nav {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  z-index: 2;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--bg-elev) 88%, black);
  color: var(--text);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, transform .1s ease;
}
.hero__nav:hover { border-color: color-mix(in oklab, var(--accent) 40%, var(--border)); }
.hero__nav.prev { left: 18px; }
.hero__nav.next { right: 18px; }

/* Slide transition */
.hero-fade-enter-from,
.hero-fade-leave-to { opacity: 0; filter: saturate(0.7) blur(2px); transform: scale(1.01); }
.hero-fade-enter-active,
.hero-fade-leave-active { transition: opacity .6s ease, filter .6s ease, transform .6s ease; }

/* Spacing for section below */
.below { margin-top: 28px; }

/* Load More styles (dark, rounded, responsive) */
.load-more {
  display: grid;
  place-items: center;
  margin: 20px 0 8px;
}

.btn-load {
  appearance: none;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--bg-elev) 90%, black);
  color: var(--text);
  padding: 12px 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color .2s ease, box-shadow .2s ease, transform .1s ease, background .2s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,.25);
}
.btn-load:hover:not(:disabled) {
  border-color: color-mix(in oklab, var(--accent) 40%, var(--border));
  box-shadow: 0 10px 24px rgba(0,0,0,.35);
}
.btn-load:disabled { opacity: .65; cursor: default; }

/* Minimal spinner */
.spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid color-mix(in oklab, var(--muted) 60%, transparent);
  border-top-color: var(--accent);
  animation: spin .7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Completion message */
.end-hint {
  margin-top: 10px;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}

/* Mobile */
@media (max-width: 640px) {
  .hero__overview { -webkit-line-clamp: 5; line-clamp: 5; }
}

.infinite-sentinel {
  width: 100%;
  height: 1px; /* minimal footprint */
}
</style>