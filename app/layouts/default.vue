<template>
  <div class="app">
    <Navbar />
    <main class="container" :class="{ 'container--flush': route.path === '/' }">
      <slot />
    </main>
    <footer class="footer">
      <p>&copy; {{ new Date().getFullYear() }} | All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">

const route = useRoute()
</script>