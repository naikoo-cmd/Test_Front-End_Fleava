<template>
  <div>
    <!-- Full-width Hero Slideshow -->
    <section class="hero" v-if="!error">
      <!-- Animate hero skeleton for smoother loading feedback -->
      <div v-if="pending" class="hero__skeleton skeleton animate-pulse"></div>

      <div
        v-else
        class="hero__inner"
        role="region"
        aria-label="Popular movies slideshow"
        @mouseenter="pause"
        @mouseleave="resume"
      >
        <transition name="hero-fade" mode="out-in" appear v-if="currentMovie">
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
            <button class="link" :class="tabClass('popular')" @click="setCategory('popular')">
              Popular
            </button>
            <button class="link" :class="tabClass('upcoming')" @click="setCategory('upcoming')">
              Upcoming
            </button>
            <button class="link" :class="tabClass('top_rated')" @click="setCategory('top_rated')">
              Top Rated
            </button>
          </div>
        </div>

        <!-- NEW: per-page selector aligned with tabs -->
        <div class="perpage">
          <label class="perpage__label" for="perpage-select">Per page</label>
          <select
            id="perpage-select"
            name="per_page"
            v-model.number="perPage"
            class="perpage__select link"
            aria-label="Items per page"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="30">30</option>
          </select>
        </div>
      </header>

      <!-- Movie grid states -->
      <transition name="list-fade" mode="out-in">
        <template v-if="pending">
          <div class="grid">
            <!-- Add Tailwind pulse animation to skeleton cards -->
            <div v-for="n in 8" :key="n" class="card skeleton animate-pulse"></div>
          </div>
        </template>
        <template v-else-if="error">
          <div class="error" v-animate>
            <p>Failed to load movies. Please try again.</p>
          </div>
        </template>
        <template v-else>
          <div class="grid" :key="`${selectedCategory}-${perPage}-${page}`">
            <MovieCard
              v-for="movie in displayedMovies"
              :key="movie.id"
              :movie="movie"
              v-animate
            />
          </div>
        </template>
      </transition>

      <!-- Skeleton placeholders shown only during incremental fetch (outside Transition to keep single child) -->
      <div v-if="loadingMore" class="grid">
        <div v-for="n in 5" :key="'load-skel-'+n" class="card">
          <div class="card__media rounded-lg bg-gray-800 animate-pulse"></div>
        </div>
      </div>

      <!-- numbered pagination controls -->
      <nav v-if="!pending && !error && totalPagesVirtual > 1" class="pager" v-animate aria-label="Pagination">
        <button class="link pager__btn" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">Prev</button>

        <ul class="pager__list" role="list">
          <li v-for="p in pageButtons" :key="p.key">
            <button
              v-if="p.type === 'page'"
              class="link pager__page"
              :class="{ 'is-active': page === p.num }"
              @click="p.num !== undefined && (page = p.num)"
              :aria-current="page === p.num ? 'page' : undefined"
            >
              {{ p.num }}
            </button>
            <span v-else class="pager__dots" aria-hidden="true">…</span>
          </li>
        </ul>

        <button class="link pager__btn" :disabled="page >= totalPagesVirtual" @click="page = Math.min(totalPagesVirtual, page + 1)">Next</button>
      </nav>
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

// Hoisted state (must exist before top-level await for SSR/Suspense safety)
const perPage = ref(20)       // 10 | 20 | 30
const page = ref(1)           // current virtual page (based on perPage)
const loadingMore = ref(false) // loading indicator for virtual page fetches

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

// Data shown in the grid
const displayedMovies = ref<Movie[]>([])

const { data, pending, error } = await useAsyncData('popular', () =>
  $fetch<PopularResponse>('/api/movies/popular', { query: { page: 1 } })
)

/**
 * NEW: pagination state (continued)
 */
const totalResults = ref(0)   // from TMDb API (first response)
const totalTmdbPages = ref(1) // TMDb total pages (20 items per page)


watch(
  () => data.value,
  async (val) => {
    if (!val) return
    const res = val as PopularResponse
    displayedMovies.value = [...(res.results || [])]
    totalResults.value = res.total_results
    totalTmdbPages.value = res.total_pages
  },
  { immediate: true }
)

// Helper: fetch a TMDb page (20 results) 
async function fetchCategoryPage(pageNum: number) {
  const cap = (totalTmdbPages.value && totalTmdbPages.value > 0) ? totalTmdbPages.value : 500
  const safe = Math.max(1, Math.min(pageNum, cap))
  return await $fetch<PopularResponse>('/api/movies/popular', {
    query: { page: safe, category: selectedCategory.value }
  })
}

//  size perPage by aggregating TMDb pages (20 per page)
async function fetchVirtualPage() {
  loadingMore.value = true
  try {
    const start = (page.value - 1) * perPage.value
    const tmdbPageStart = Math.floor(start / 20) + 1
    const offset = start % 20
    const need = perPage.value
    const neededTmdbPages = Math.ceil((offset + need) / 20)

    const pagesToFetch = Array.from({ length: neededTmdbPages }, (_, i) => tmdbPageStart + i)
  // Clamp to TMDb available page range (TMDb caps pages at 500 for list endpoints)
  const maxTmdb = (totalTmdbPages.value && totalTmdbPages.value > 0) ? totalTmdbPages.value : 500
    const safePages = pagesToFetch
      .map(p => Math.min(Math.max(1, p), maxTmdb))
      .filter((p, idx, arr) => arr.indexOf(p) === idx) // dedupe after clamping

    const responses = await Promise.all(safePages.map(p => fetchCategoryPage(p)))
    // Update totals from the first response (accurate for the category)
    if (responses[0]) {
      totalResults.value = responses[0].total_results
      totalTmdbPages.value = responses[0].total_pages
    }

    const combined = responses.flatMap(r => r.results || [])
    displayedMovies.value = combined.slice(offset, offset + need)
  } finally {
    loadingMore.value = false
  }
}

// total virtual pages based on perPage, capped to TMDb retrievable results (totalTmdbPages * 20)
const totalPagesVirtual = computed(() => {
  const retrievable = Math.max(0, Math.min(totalResults.value || 0, (totalTmdbPages.value || 1) * 20))
  return Math.max(1, Math.ceil(retrievable / perPage.value))
})

// Keep current page within bounds when totals or perPage change
watch(totalPagesVirtual, (tp) => {
  if (page.value > tp) page.value = tp
  if (page.value < 1) page.value = 1
})

// limited page buttons with ellipsis for large totals
const pageButtons = computed(() => {
  const tp = totalPagesVirtual.value
  const cur = page.value
  const max = 5
  let start = Math.max(1, cur - 2)
  let end = Math.min(tp, start + max - 1)
  start = Math.max(1, end - max + 1)
  const out: Array<{ type: 'page' | 'dots'; key: string; num?: number }> = []

  if (start > 1) {
    out.push({ type: 'page', key: 'p1', num: 1 })
    if (start > 2) out.push({ type: 'dots', key: 'd1' })
  }
  for (let i = start; i <= end; i++) out.push({ type: 'page', key: `p${i}`, num: i })
  if (end < tp) {
    if (end < tp - 1) out.push({ type: 'dots', key: 'd2' })
    out.push({ type: 'page', key: `p${tp}`, num: tp })
  }
  return out
})

// when category or perPage changes, reset to page 1 and fetch
watch([selectedCategory, perPage], () => {
  page.value = 1
  fetchVirtualPage()
}, { immediate: true })

//  when page changes, fetch that virtual page
watch(page, () => { fetchVirtualPage() })

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

// Tailwind-powered active state helper for category tabs
function tabClass(cat: 'popular' | 'upcoming' | 'top_rated') {
  return selectedCategory.value === cat
    ? 'text-white font-semibold border-b-2 border-cyan-400'
    : 'text-gray-300 hover:text-white';
}

onMounted(start)
onBeforeUnmount(stop)
watch(slides, (val) => {
  if (!val.length) return stop()
  if (current.value >= val.length) current.value = 0
  start()
})
</script>

<style scoped lang="scss" src="@/assets/styles/index.scss"></style>