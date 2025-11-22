import { useLocalePath } from '#i18n'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/') return
  // Ensure we only run this redirect on client to avoid SSR macro warnings
  if (import.meta.server) return
  const localePath = useLocalePath()
  return navigateTo(localePath('/'), { replace: true })
})
