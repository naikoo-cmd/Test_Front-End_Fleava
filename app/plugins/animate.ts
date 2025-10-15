export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('animate', {
    mounted(el: HTMLElement, binding: { value?: { rootMargin?: string; class?: string } }) {
      const animateClass = binding?.value?.class ?? 'aos-in'
      const rootMargin = binding?.value?.rootMargin ?? '0px 0px -10% 0px'
      if (process.client) el.classList.add('aos-init')
      if (process.server) return

      const observer = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.classList.add(animateClass)
              el.classList.remove('aos-init')
              obs.unobserve(entry.target)
            }
          }
        },
        { rootMargin, threshold: 0.2 }
      )
      observer.observe(el)
    }
  })
})