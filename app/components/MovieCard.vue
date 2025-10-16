<template>
  <NuxtLink class="card" :to="`/movie/${movie.id}`" :aria-label="movie.title">
    <div class="card__media">
      <img :src="posterUrl" :alt="movie.title" loading="lazy" @error="onImgError" />
    </div>
    <div class="card__body">
      <h3 class="title" :title="movie.title">{{ movie.title }}</h3>
      <p class="meta">
        <span>{{ year }}</span>
        <span>⭐ {{ rating }}</span>
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
type Movie = {
  id: number
  title: string
  poster_path?: string | null
  release_date?: string
  vote_average?: number
}

const props = defineProps<{ movie: Movie }>()
const { public: pub } = useRuntimeConfig()

const posterUrl = computed(() =>
  props.movie.poster_path
    ? `${pub.tmdbImageBase}${props.movie.poster_path}`
    : '/placeholder-poster.svg'
)

const year = computed(() =>
  props.movie.release_date ? new Date(props.movie.release_date).getFullYear() : '—'
)
const rating = computed(() => (props.movie.vote_average ? props.movie.vote_average.toFixed(1) : '—'))
// Replace broken poster URLs with a local placeholder; guard to avoid loops
const FALLBACK_POSTER = '/placeholder-poster.svg'
function onImgError(e: Event) {
  const el = e.target as HTMLImageElement | null
  if (!el || el.src === FALLBACK_POSTER) return
  el.src = FALLBACK_POSTER
}
</script>