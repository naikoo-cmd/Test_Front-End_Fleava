<template>
  <nav :class="['navbar', { 'navbar--transparent': isScrolled }]">
    <div class="navbar__inner">
      <NuxtLink class="brand" to="/" style="font-size: 2rem;">Movies Media</NuxtLink>
      <div class="spacer" />
      <!-- removed theme toggle button -->
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const route = useRoute()
const router = useRouter()
const isHome = computed(() => route.path === '/')

// Add isScrolled reactive property
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style>
/* Removed: html transition for theme switching and .theme-toggle styles */
</style>