<template>
  <div class="min-h-screen bg-surface-950">
    <NuxtRouteAnnouncer />
    
    <!-- Header with glassy background -->
    <header class="fixed top-0 left-0 right-0 z-40 bg-black/5 backdrop-blur-performance">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-start justify-between h-16 relative pt-1">
          
          <!-- Mobile Logo (centered when big, left when scrolled) -->
          <div class="flex items-start md:hidden z-50 transition-all duration-300" :class="mobileLogoPositionClass">
            <NuxtLink to="/" class="block">
              <img 
                src="/images/wbm-logo-white.svg" 
                alt="WBM Band Logo" 
                class="w-auto filter drop-shadow-2xl transition-transform duration-300"
                :class="mobileLogoSizeClass"
                loading="eager"
                fetchpriority="high"
              />
            </NuxtLink>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center justify-between h-full w-full">
            <!-- Left navigation links -->
            <div class="flex items-center gap-8 flex-1 justify-end transition-all duration-300" :class="leftNavSpacing">
              <template v-for="(link, index) in leftNavLinks" :key="`left-${index}`">
                <button 
                  :class="navLinkClass"
                  @click="() => handleNavClick(link)"
                >
                  {{ link.label }}
                </button>
              </template>
            </div>

            <!-- Right navigation links -->
            <div class="flex items-center gap-8 flex-1 justify-start transition-all duration-300" :class="rightNavSpacing">
              <template v-for="(link, index) in rightNavLinks" :key="`right-${index}`">
                <button 
                  :class="navLinkClass"
                  @click="() => handleNavClick(link)"
                >
                  {{ link.label }}
                </button>
              </template>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <div class="md:hidden ml-auto flex items-start pt-2">
            <button
              @click="toggleMobileMenu"
              :class="mobileMenuButtonClass"
              aria-label="Toggle navigation menu"
            >
              <i :class="mobileMenuIcon" class="text-xl transition-transform duration-200 ease-out"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Desktop Logo (absolute positioned) -->
      <div class="hidden md:block absolute top-[14px] left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300" :class="logoPositionClass">
        <NuxtLink to="/" class="block">
          <img 
            src="/images/wbm-logo-white.svg" 
            alt="WBM Band Logo" 
            class="w-auto filter drop-shadow-2xl transition-transform duration-500 ease-out"
            :class="logoSizeClass"
            loading="eager"
            fetchpriority="high"
          />
        </NuxtLink>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <Transition name="mobile-menu">
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 md:hidden"
        @click="closeMobileMenu"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
        
        <!-- Menu Content -->
        <div 
          class="relative flex flex-col items-center justify-center h-full"
          @click.stop
        >
          <!-- Close Button -->
          <button
            @click="closeMobileMenu"
            class="absolute top-6 right-6 text-white/90 hover:text-white transition-colors duration-300 p-2"
            aria-label="Close menu"
          >
            <i class="pi pi-times text-2xl"></i>
          </button>

          <!-- Logo in mobile menu -->
          <div class="mb-12">
            <NuxtLink to="/" class="block" @click="closeMobileMenu">
              <img 
                src="/images/wbm-logo-white.svg" 
                alt="WBM Band Logo" 
                class="h-24 mt-[-44px] w-auto filter drop-shadow-2xl"
                loading="eager"
              />
            </NuxtLink>
          </div>

          <!-- Mobile Navigation Links -->
          <nav class="flex flex-col items-center space-y-8">
            <template v-for="(link, index) in allNavLinks" :key="`mobile-${index}`">
              <button 
                :class="mobileNavLinkClass"
                @click="() => handleMobileNavClick(link)"
              >
                {{ link.label }}
              </button>
            </template>
          </nav>
        </div>
      </div>
    </Transition>

    <!-- Main Content with top padding to account for fixed header -->
    <main class="">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'
import { useScrollTo } from '~/composables/useScrollTo'
import { useScrollAnimation } from '~/composables/useScrollAnimation'
import { createWelcomeMessage } from '~/constants/app'

// Composables
const snackbar = useSnackbar()
const { scrollToElement } = useScrollTo()

// Optimized scroll animation composable with performance enhancements
const {
  logoSizeClass,
  logoPositionClass,
  leftNavSpacing,
  rightNavSpacing,
  mobileLogoSizeClass,
  mobileLogoPositionClass,
  isLowPerformanceDevice,
  prefersReducedMotion,
  currentThrottleMs
} = useScrollAnimation({
  threshold: 50, // Same threshold as before
  throttleMs: 16, // Base 60fps, will adapt automatically
  useRAF: true, // Use requestAnimationFrame for better performance
  enableAdaptiveThrottling: true, // Automatically adjust based on device performance
  enableIntersectionObserver: true, // Optimize when header is not visible
  reducedMotionRespect: true, // Respect user's accessibility preferences
  performanceMode: 'auto' // Let the composable decide the best performance mode
})

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Navigation link type
interface NavLink {
  label: string
  action?: string // Use string instead of function
}

// Navigation links configuration
const leftNavLinks = ref<NavLink[]>([
  {
    label: 'Music',
    action: 'scroll-to-music'
  },
  {
    label: 'Tour',
    action: 'show-tour-info'
  }
])

const rightNavLinks = ref<NavLink[]>([
  {
    label: 'About',
    action: 'show-about-info'
  },
  {
    label: 'Contact',
    action: 'show-contact-info'
  }
])

// Combined nav links for mobile menu
const allNavLinks = computed(() => [
  ...leftNavLinks.value,
  ...rightNavLinks.value
])

// Dynamic styling for desktop nav links with proper mobile touch handling
const navLinkClass = 'nav-link-desktop'

// Mobile navigation link styles
const mobileNavLinkClass = 'nav-link-mobile'

// Mobile menu button styles
const mobileMenuButtonClass = 'mobile-menu-button'

// Mobile menu icon
const mobileMenuIcon = computed(() => 
  isMobileMenuOpen.value ? 'pi pi-times' : 'pi pi-bars'
)

// Mobile menu methods
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  
  // Prevent body scroll when menu is open
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

// Handle navigation clicks with proper mobile behavior
const handleNavClick = (link: NavLink) => {
  // Remove any stuck hover states by forcing a blur
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  
  // Execute the action based on string identifier
  executeNavAction(link.action)
}

const handleMobileNavClick = (link: NavLink) => {
  // Close mobile menu first
  closeMobileMenu()
  
  // Then handle the navigation with reduced delay for faster UX
  setTimeout(() => {
    executeNavAction(link.action)
  }, 200) // Reduced from 300ms to match faster animation
}

// Execute navigation actions
const executeNavAction = (action?: string) => {
  switch (action) {
    case 'scroll-to-music':
      scrollToElement('music')
      break
    case 'show-tour-info':
      snackbar.info('Tour', 'Tour dates coming soon!', 3000)
      break
    case 'show-about-info':
      snackbar.info('About', 'About section coming soon!', 3000)
      break
    case 'show-contact-info':
      snackbar.info('Contact', 'Contact section coming soon!', 3000)
      break
    default:
      console.warn('Unknown navigation action:', action)
  }
}

// Handle escape key to close mobile menu
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // Clean up body overflow on unmount
  document.body.style.overflow = ''
})

// Methods
const showWelcome = () => {
  snackbar.success(
    createWelcomeMessage(),
    'Your modern Nuxt 3 application is ready to rock! 🎸',
    5000
  )
}
</script>

<style scoped>
/* Custom component classes */
.nav-link-desktop {
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s;
  padding: 0.5rem 0.25rem;
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transform-origin: bottom;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  background: none;
  border: none;
  font-family: inherit;
}

.nav-link-desktop:hover {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.nav-link-desktop:focus {
  outline: none;
  box-shadow: none;
}

.nav-link-desktop::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  width: 0;
  height: 0.125rem;
  background-color: white;
  transition: all 0.3s;
}

.nav-link-desktop:hover::after {
  width: 100%;
}

@media (min-width: 768px) {
  .nav-link-desktop:hover {
    transform: scale(1.05);
  }
}

.nav-link-mobile {
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease-out;
  padding: 1rem 1.5rem;
  font-weight: 600;
  font-size: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  text-align: center;
  display: block;
  width: 100%;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: none;
  border: none;
  font-family: inherit;
}

.nav-link-mobile:active {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
}

.nav-link-mobile:focus {
  outline: none;
  box-shadow: none;
}

.nav-link-mobile::after {
  content: '';
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  width: 0;
  height: 0.125rem;
  background-color: white;
  transition: all 0.3s ease-out;
  transform: translateX(-50%);
}

.nav-link-mobile:active::after {
  width: 75%;
}

.mobile-menu-button {
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease-out;
  padding: 0.5rem;
  cursor: pointer;
  outline: none;
  user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  border-radius: 0.5rem;
}

.mobile-menu-button:hover {
  color: white;
}

.mobile-menu-button:active {
  color: white;
  transform: scale(0.95);
  background-color: rgba(255, 255, 255, 0.1);
}

.mobile-menu-button:focus {
  outline: none;
  box-shadow: none;
}

.text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.text-shadow-md {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Remove all focus rings and outlines */
a, button, *:focus {
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
}

/* Mobile-specific touch handling */
.tap-highlight-transparent {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.touch-manipulation {
  touch-action: manipulation;
}

/* Enhanced underline animation for desktop */
.group:hover::after {
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* Mobile menu transitions */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.mobile-menu-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.mobile-menu-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

/* Mobile menu content animation - removed conflicting animations */
.mobile-menu-enter-active .relative {
  animation: slideInUp 0.25s cubic-bezier(0.4, 0.0, 0.2, 1) both;
}

.mobile-menu-leave-active .relative {
  animation: slideOutDown 0.2s cubic-bezier(0.4, 0.0, 0.2, 1) both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
  }
}

/* Smooth backdrop blur effect for better glass morphism */
header {
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}

/* Mobile menu backdrop blur */
.mobile-menu-enter-active .absolute,
.mobile-menu-leave-active .absolute {
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition: backdrop-filter 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Ensure navigation links don't get too close to logo area on desktop */
@media (min-width: 768px) {
  .flex-1 {
    max-width: calc(50% - 80px); /* Increased from 60px to accommodate larger logo */
  }
}

/* Mobile navigation link hover effects */
@media (max-width: 767px) {
  .group:active::after {
    animation: mobileSlideIn 0.2s ease-out forwards;
  }
}

@keyframes mobileSlideIn {
  from {
    width: 0;
  }
  to {
    width: 75%;
  }
}

/* Prevent text selection on navigation elements */
.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Enhanced mobile button feedback */
@media (max-width: 767px) {
  .cursor-pointer:active {
    transform: scale(0.95);
    transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  /* Burger menu button specific styles */
  button:active {
    transform: scale(0.95);
    transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
}

/* Smooth transitions for mobile logo */
@media (max-width: 767px) {
  .h-20, .h-34 {
    transition: all 0.3s ease-out;
  }
  
  .h-20:active, .h-34:active {
    transform: scale(0.95);
  }
  
  /* Mobile logo container transitions */
  .md\\:hidden {
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  /* Ensure mobile logo extends properly beyond header */
  .relative.z-50, .absolute.z-50 {
    overflow: visible;
  }
}

/* Custom logo sizes for scroll animation */
.h-30 {
  height: 7.5rem; /* 120px - 1.5x of h-20 (80px) */
}

.h-34 {
  height: 8.5rem; /* 136px - 1.7x of h-20 (80px) for mobile */
}

.h-36 {
  height: 9rem; /* 144px - 1.8x of h-20 (80px) */
}

.h-40 {
  height: 10rem; /* 160px - 2x of h-20 (80px) for desktop */
}

/* Smooth logo size transitions */
.h-20, .h-30, .h-34, .h-36, .h-40 {
  transition: height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}
</style>
