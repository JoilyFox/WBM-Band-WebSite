<template>
  <footer :class="['footer-section bg-surface-950 border-t border-white/10', { 'footer-minimized': minimized }]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Minimized Footer Layout -->
      <div v-if="minimized" class="py-6">
        <!-- Mobile: Centered Column Layout -->
        <div class="flex flex-col items-center space-y-4 text-center md:hidden">
          
          <!-- Logo -->
          <button @click="scrollToHero" class="footer-logo-button">
            <img 
              src="/images/wbm-logo-white.svg" 
              :alt="`${bandName} Logo`" 
              class="h-10 w-auto filter drop-shadow-lg"
              loading="lazy"
            />
          </button>
          
          <!-- Description Text -->
          <p class="text-white/70 text-sm leading-relaxed max-w-md">
            {{ bandName }} - Modern rock with classic soul. Pushing boundaries in alternative music.
          </p>
          
          <!-- Social Media Links Row -->
          <div class="flex space-x-4">
            <a 
              v-for="social in socialLinks" 
              :key="social.name"
              :href="social.url" 
              :aria-label="social.label"
              class="social-link-minimal"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i :class="social.icon" class="text-lg"></i>
            </a>
          </div>
          
          <!-- Privacy Policy Links Row -->
          <div class="flex space-x-6 text-sm">
            <button 
              v-for="legal in legalLinks" 
              :key="legal.label"
              @click="handleLegalLink(legal.action)"
              class="legal-link-minimal"
            >
              {{ legal.label }}
            </button>
          </div>
          
          <!-- Developer Credit -->
          <div class="text-white/50 text-xs pt-2">
            Made with ❤️ and 🎸 by 
            <a 
              href="https://www.instagram.com/feat.her_" 
              target="_blank" 
              rel="noopener noreferrer"
              class="developer-link"
            >
              @feat.her_
            </a>
          </div>
        </div>

        <!-- Desktop: Traditional Horizontal Layout -->
        <div class="hidden md:flex gap-8 md:items-center md:justify-between">
          
          <!-- Left Section: Logo and Description -->
          <div class="flex items-center space-x-6">
            <button @click="scrollToHero" class="footer-logo-button">
              <img 
                src="/images/wbm-logo-white.svg" 
                :alt="`${bandName} Logo`" 
                class="h-10 w-auto filter drop-shadow-lg"
                loading="lazy"
              />
            </button>
            <p class="text-white/70 text-sm leading-relaxed max-w-md">
              {{ bandName }} - Modern rock with classic soul. Pushing boundaries in alternative music.
            </p>
          </div>
          
          <!-- Center Section: Social Media Links -->
          <div class="flex space-x-4">
            <a 
              v-for="social in socialLinks" 
              :key="social.name"
              :href="social.url" 
              :aria-label="social.label"
              class="social-link-minimal"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i :class="social.icon" class="text-lg"></i>
            </a>
          </div>
          
          <!-- Right Section: Legal Links and Developer Credit -->
          <div class="flex flex-col items-end space-y-2">
            <div class="flex space-x-6 text-sm">
              <button 
                v-for="legal in legalLinks" 
                :key="legal.label"
                @click="handleLegalLink(legal.action)"
                class="legal-link-minimal"
              >
                {{ legal.label }}
              </button>
            </div>
            <div class="text-white/50 text-xs">
              Made with ❤️ and 🎸 by 
              <a 
                href="https://www.instagram.com/feat.her_" 
                target="_blank" 
                rel="noopener noreferrer"
                class="developer-link"
              >
                @feat.her_
              </a>
            </div>
          </div>
          
        </div>
      </div>

      <!-- Full Footer Layout (existing) -->
      <div v-else>
        <!-- Main Footer Content -->
      <div class="pb-12 pt-0 sm:pt-8 lg:py-16 lg:pt-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <!-- Brand Section -->
          <div class="lg:col-span-2 text-center md:text-left">
            <div class="flex items-center justify-center md:justify-start mb-6">
              <button @click="scrollToHero" class="footer-logo-button">
                <img 
                  src="/images/wbm-logo-white.svg" 
                  :alt="`${bandName} Logo`" 
                  class="h-12 w-auto filter drop-shadow-lg"
                  loading="lazy"
                />
              </button>
            </div>
            <p class="text-white/70 text-sm leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
              {{ fullBandName }} - Pushing the boundaries of rock, alternative, and indie music. 
              Join us on our musical journey and stay connected for the latest releases and tour updates.
            </p>
            
            <!-- Social Media Links -->
            <div class="flex space-x-4 justify-center md:justify-start">
              <a 
                v-for="social in socialLinks" 
                :key="social.name"
                :href="social.url" 
                :aria-label="social.label"
                class="social-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i :class="social.icon" class="text-xl"></i>
              </a>
            </div>
          </div>

          <!-- Navigation Section (Desktop Only) -->
          <div class="hidden lg:block text-center md:text-left">
            <h3 class="footer-heading">Navigation</h3>
            <ul class="space-y-3">
              <li v-for="item in navigationItems" :key="item.elementId">
                <button 
                  @click="handleNavClick(item.elementId)"
                  class="footer-link"
                >
                  {{ item.label }}
                </button>
              </li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div class="text-center md:text-left">
            <h3 class="footer-heading">Contact</h3>
            <ul class="space-y-3">
              <li class="footer-contact-item justify-center md:justify-start">
                <i class="pi pi-envelope text-white/60"></i>
                <a :href="`mailto:${contactEmail}`" class="footer-link">
                  {{ contactEmail }}
                </a>
              </li>
              <li class="footer-contact-item justify-center md:justify-start">
                <i class="pi pi-map-marker text-white/60"></i>
                <span class="text-white/70 text-sm">
                  {{ contactLocationShort }}
                </span>
              </li>
              <li class="footer-contact-item justify-center md:justify-start">
                <i class="pi pi-phone text-white/60"></i>
                <a :href="`tel:${contactPhoneNumber}`" class="footer-link">
                  {{ contactPhone }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Streaming Platforms -->
      <div class="py-8 border-t border-white/10">
        <div class="text-center">
          <h4 class="text-white/80 text-sm font-medium mb-4">Listen on your favorite platform</h4>
          <div class="flex justify-center items-center space-x-8 flex-wrap gap-y-6">
            <a 
              v-for="platform in streamingPlatforms" 
              :key="platform.name"
              :href="platform.url" 
              :aria-label="`Listen on ${platform.name}`"
              class="streaming-icon-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                :src="platform.icon" 
                :alt="`${platform.name} icon`"
                class="streaming-icon"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="py-6 border-t border-white/10">
        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div class="text-center md:text-left">
            <p class="text-white/50 text-xs">
              © {{ currentYear }} {{ fullBandName }}. All rights reserved.
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-3 sm:space-y-0">
            <div class="flex items-center space-x-6">
              <button 
                v-for="legal in legalLinks" 
                :key="legal.label"
                @click="handleLegalLink(legal.action)"
                class="legal-link"
              >
                {{ legal.label }}
              </button>
            </div>
            <div class="text-white/50 sm:text-white/30 text-xs !mt-[26px] sm:!mt-0">
                Made with ❤️ and 🎸 by 
                <a 
                  href="https://www.instagram.com/feat.her_" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="developer-link"
                >
                  @feat.her_
                </a>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'
import { useScrollTo } from '~/composables/useScrollTo'
import { getConfig } from '~/utils/configHelpers'
import { footerNavigation } from '~/config/navigation'

// Props
interface Props {
  minimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minimized: false
})

// Composables
const snackbar = useSnackbar()
const { scrollToElementWithNavigation } = useScrollTo()

// Navigation items from config
const navigationItems = footerNavigation

// Navigation handler
const handleNavClick = (elementId: string) => {
  scrollToElementWithNavigation(elementId)
}

// Helper function to resolve asset paths correctly for GitHub Pages
const resolveAssetPath = (path: string) => {
  // In development, use the path as-is
  if (process.dev) return path
  
  // For production GitHub Pages, use the base URL from nuxt config
  // The baseURL is '/WBM-Band-WebSite/' for this deployment
  return `/WBM-Band-WebSite${path}`
}

// Computed properties for config values
const bandName = computed(() => getConfig('general.bandName'))
const fullBandName = computed(() => getConfig('general.fullBandName'))
const contactEmail = computed(() => getConfig('general.contact.email'))
const contactLocationShort = computed(() => getConfig('general.contact.location.short'))
const contactPhone = computed(() => getConfig('general.contact.phone'))
const contactPhoneNumber = computed(() => getConfig('general.contact.phoneNumber'))

// Current year for copyright
const currentYear = computed(() => new Date().getFullYear())

// Social media links
const socialLinks = ref([
  {
    name: 'instagram',
    icon: 'pi pi-instagram',
    url: 'https://instagram.com/wbmband',
    label: 'Follow us on Instagram'
  },
  {
    name: 'twitter',
    icon: 'pi pi-twitter',
    url: 'https://twitter.com/wbmband',
    label: 'Follow us on Twitter'
  },
  {
    name: 'youtube',
    icon: 'pi pi-youtube',
    url: 'https://youtube.com/@wbmband',
    label: 'Subscribe to our YouTube channel'
  },
  {
    name: 'facebook',
    icon: 'pi pi-facebook',
    url: 'https://facebook.com/wbmband',
    label: 'Like us on Facebook'
  }
])

// Streaming platforms - using computed to ensure proper path resolution
const streamingPlatforms = computed(() => [
  {
    name: 'Spotify',
    icon: resolveAssetPath('/assets/images/icons/spotify-icon.svg'),
    url: 'https://open.spotify.com/artist/wbmband'
  },
  {
    name: 'Apple Music',
    icon: resolveAssetPath('/assets/images/icons/apple-music-icon.svg'),
    url: 'https://music.apple.com/artist/wbmband'
  },
  {
    name: 'YouTube Music',
    icon: resolveAssetPath('/assets/images/icons/youtube-music-icon.svg'),
    url: 'https://music.youtube.com/channel/wbmband'
  }
])

// Legal links
const legalLinks = ref([
  {
    label: 'Privacy Policy',
    action: 'privacy'
  },
  {
    label: 'Terms of Service',
    action: 'terms'
  },
  {
    label: 'Cookies',
    action: 'cookies'
  }
])

// Legal link handler
const handleLegalLink = (action: string) => {
  switch (action) {
    case 'privacy':
      navigateTo('/privacy-policy')
      break
    case 'terms':
      navigateTo('/terms-of-service')
      break
    case 'cookies':
      navigateTo('/cookies-policy')
      break
    default:
      console.warn('Unknown legal link action:', action)
  }
}

// Logo click handler for smooth scrolling to hero section
const scrollToHero = () => {
  scrollToElementWithNavigation('hero')
}
</script>

<style scoped>
/* Footer section base */
.footer-section {
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%),
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%);
  position: relative;
  overflow: hidden;
}

/* Remove default focus rings for all interactive elements */
.footer-section button,
.footer-section a {
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

/* Only show focus outline for keyboard navigation */
.footer-section button:focus-visible,
.footer-section a:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 2px;
}

.footer-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.015'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* Footer headings */
.footer-heading {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Footer logo button */
.footer-logo-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0.5rem;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .footer-logo-button:hover {
    transform: translateY(-2px) scale(1.03);
    filter: drop-shadow(0 4px 15px rgba(255, 255, 255, 0.1));
  }
  
  .footer-logo-button:hover img {
    filter: brightness(1.1) drop-shadow(0 4px 15px rgba(255, 255, 255, 0.2));
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .footer-logo-button:active {
    transform: scale(0.97);
    transition-duration: 0.15s;
  }
  
  .footer-logo-button:active img {
    filter: brightness(1.1);
    transition-duration: 0.15s;
  }
}

/* Fallback for devices that support both hover and touch */
@media (hover: hover) and (pointer: coarse) {
  .footer-logo-button:hover {
    transform: none;
    filter: none;
  }
  
  .footer-logo-button:hover img {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }
  
  .footer-logo-button:active {
    transform: scale(0.97);
    transition-duration: 0.15s;
  }
  
  .footer-logo-button:active img {
    filter: brightness(1.1);
    transition-duration: 0.15s;
  }
}

/* Footer links */
.footer-link {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  transition: all 0.3s ease;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .footer-link:hover {
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    transform: translateX(2px);
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .footer-link:active {
    color: rgba(255, 255, 255, 0.9);
    transform: scale(0.98);
    transition-duration: 0.15s;
  }
}

/* Social media links */
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .social-link:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .social-link:active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    transform: scale(0.95);
    transition-duration: 0.15s;
  }
}

/* Contact items */
.footer-contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Legal links */
.legal-link {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.75rem;
  transition: all 0.3s ease;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .legal-link:hover {
    color: rgba(255, 255, 255, 0.7);
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .legal-link:active {
    color: rgba(255, 255, 255, 0.7);
    transform: scale(0.98);
    transition-duration: 0.15s;
  }
}

/* Fallback for devices that support both hover and touch */
@media (hover: hover) and (pointer: coarse) {
  .legal-link:hover {
    color: rgba(255, 255, 255, 0.3); /* Disable hover */
  }
  
  .legal-link:active {
    color: rgba(255, 255, 255, 0.7);
    transform: scale(0.98);
    transition-duration: 0.15s;
  }
}

/* Developer link styles */
.developer-link {
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .developer-link:hover {
    color: rgba(255, 255, 255, 0.668);
    text-decoration: underline;
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .developer-link:active {
    color: rgba(255, 255, 255, 0.668);
    transform: scale(0.98);
    transition-duration: 0.15s;
  }
}

/* Focus state for accessibility */
.developer-link:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 1px;
    color: rgba(255, 255, 255, 0.668);
}

/* Streaming platform icon links */
.streaming-icon-link {
  display: inline-block;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.streaming-icon {
  height: 2rem;
  width: 2rem;
  filter: brightness(0.85) saturate(0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .streaming-icon-link:hover {
    transform: translateY(-3px) scale(1.15);
  }
  
  .streaming-icon-link:hover .streaming-icon {
    filter: brightness(1.2) saturate(1.3);
  }
  
  /* Platform-specific glow effects - clean glows without borders */
  .streaming-icon-link:nth-child(1):hover .streaming-icon {
    filter: brightness(1.2) saturate(1.3) drop-shadow(0 0 15px rgba(29, 185, 84, 0.4));
  }
  
  .streaming-icon-link:nth-child(2):hover .streaming-icon {
    filter: brightness(1.2) saturate(1.3) drop-shadow(0 0 15px rgba(255, 45, 85, 0.4));
  }
  
  .streaming-icon-link:nth-child(3):hover .streaming-icon {
    filter: brightness(1.2) saturate(1.3) drop-shadow(0 0 15px rgba(255, 0, 0, 0.4));
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .streaming-icon-link:active {
    transform: scale(0.9);
    transition-duration: 0.15s;
  }
  
  .streaming-icon-link:active .streaming-icon {
    filter: brightness(1.2) saturate(1.3);
    transition-duration: 0.15s;
  }
}

/* Fallback for devices that support both hover and touch */
@media (hover: hover) and (pointer: coarse) {
  .streaming-icon-link:hover {
    transform: none;
  }
  
  .streaming-icon-link:hover .streaming-icon {
    filter: brightness(0.85) saturate(0.9);
  }
  
  .streaming-icon-link:active {
    transform: scale(0.9);
    transition-duration: 0.15s;
  }
  
  .streaming-icon-link:active .streaming-icon {
    filter: brightness(1.2) saturate(1.3);
    transition-duration: 0.15s;
  }
}

/* Focus states for accessibility */
.footer-link:focus-visible,
.social-link:focus-visible,
.streaming-icon-link:focus-visible,
.legal-link:focus-visible,
.footer-logo-button:focus-visible,
.developer-link:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 2px;
}

/* Remove default focus outlines on click */
.footer-link:focus:not(:focus-visible),
.social-link:focus:not(:focus-visible),
.streaming-icon-link:focus:not(:focus-visible),
.legal-link:focus:not(:focus-visible),
.footer-logo-button:focus:not(:focus-visible),
.developer-link:focus:not(:focus-visible) {
  outline: none;
}

.streaming-icon-link:focus-visible .streaming-icon {
  filter: brightness(1.2) saturate(1.3);
}

.legal-link:focus-visible {
  color: rgba(255, 255, 255, 0.7);
}

.footer-logo-button:focus-visible img {
  filter: brightness(1.1) drop-shadow(0 4px 15px rgba(255, 255, 255, 0.2));
}

/* Mobile responsive adjustments */
@media (max-width: 767px) {
  .footer-section {
    padding-top: 1.5rem;

    &.footer-minimized {
      padding-top: 0;
    }
  }
  
  .footer-heading {
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }
  
  .footer-link {
    font-size: 0.8rem;
  }
  
  .social-link {
    width: 2.25rem;
    height: 2.25rem;
  }
  
  .legal-link {
    font-size: 0.7rem;
  }
  
  /* Smaller streaming icons on mobile */
  .streaming-icon {
    height: 1.75rem;
    width: 1.75rem;
  }
  
  /* Reduce spacing between streaming icons on mobile */
  .streaming-icon-link + .streaming-icon-link {
    margin-left: 1.5rem;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .footer-link,
  .social-link,
  .streaming-icon-link,
  .legal-link,
  .footer-logo-button,
  .developer-link {
    transition: none;
  }
  
  .streaming-icon {
    transition: none;
  }
  
  .footer-link:hover,
  .social-link:hover,
  .streaming-icon-link:hover,
  .legal-link:hover,
  .footer-logo-button:hover,
  .developer-link:hover {
    transform: none;
  }
  
  .streaming-icon-link:hover .streaming-icon {
    transform: none;
  }
  
  .footer-logo-button:hover img {
    transform: none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }
  
  .footer-link:active,
  .social-link:active,
  .streaming-icon-link:active,
  .legal-link:active,
  .footer-logo-button:active,
  .developer-link:active {
    transform: none;
  }
}

/* Minimized Footer Styles */
.footer-minimized {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-logo-link-minimal {
  display: inline-block;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0.5rem;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .footer-logo-link-minimal:hover {
    transform: translateY(-1px) scale(1.03);
    filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1));
  }
  
  .footer-logo-link-minimal:hover img {
    filter: brightness(1.1) drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .footer-logo-link-minimal:active {
    transform: scale(0.97);
    transition-duration: 0.15s;
  }
  
  .footer-logo-link-minimal:active img {
    filter: brightness(1.1);
    transition-duration: 0.15s;
  }
}

/* Focus state for accessibility */
.footer-logo-link-minimal:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 2px;
}

.footer-logo-link-minimal:focus-visible img {
  filter: brightness(1.1) drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
}

.social-link-minimal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-decoration: none;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .social-link-minimal:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .social-link-minimal:active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    transform: scale(0.95);
    transition-duration: 0.15s;
  }
}

/* Focus state for accessibility */
.social-link-minimal:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 2px;
}

.legal-link-minimal {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.75rem;
  transition: all 0.3s ease;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .legal-link-minimal:hover {
    color: rgba(255, 255, 255, 0.7);
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .legal-link-minimal:active {
    color: rgba(255, 255, 255, 0.7);
    transform: scale(0.98);
    transition-duration: 0.15s;
  }
}

/* Fallback for devices that support both hover and touch */
@media (hover: hover) and (pointer: coarse) {
  .legal-link-minimal:hover {
    color: rgba(255, 255, 255, 0.3); /* Disable hover */
  }
  
  .legal-link-minimal:active {
    color: rgba(255, 255, 255, 0.7);
    transform: scale(0.98);
    transition-duration: 0.15s;
  }
}

/* Focus state for accessibility */
.legal-link-minimal:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 1px;
  color: rgba(255, 255, 255, 0.7);
}

/* Reduced motion support for minimized footer */
@media (prefers-reduced-motion: reduce) {
  .footer-logo-link-minimal,
  .social-link-minimal,
  .legal-link-minimal {
    transition: none;
  }
  
  .footer-logo-link-minimal:hover,
  .social-link-minimal:hover,
  .legal-link-minimal:hover {
    transform: none;
  }
  
  .footer-logo-link-minimal:active,
  .social-link-minimal:active,
  .legal-link-minimal:active {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .footer-section {
    background: #000000;
    border-top: 2px solid #ffffff;
  }
  
  .footer-link,
  .social-link,
  .legal-link,
  .developer-link {
    color: #ffffff;
    border-color: #ffffff;
  }
  
  .footer-link:hover,
  .footer-link:focus,
  .social-link:hover,
  .social-link:focus,
  .legal-link:hover,
  .legal-link:focus,
  .developer-link:hover,
  .developer-link:focus {
    background: #ffffff;
    color: #000000;
  }
  
  .footer-logo-button:focus {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
  
  .footer-logo-button:focus img,
  .footer-logo-button:hover img {
    filter: brightness(1.2) contrast(1.3);
  }
  
  .streaming-icon {
    filter: brightness(1.2) contrast(1.3);
  }
  
  .streaming-icon-link:focus .streaming-icon {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }

  .footer-nav-link {
    color: theme('colors.gray.300');
    text-decoration: none;
    transition: color 0.3s ease;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 0.875rem;
    
    @media (hover: hover) {
      &:hover {
        color: white;
      }
    }
  }

  /* High contrast overrides for minimized footer */
  .footer-minimized .footer-logo-link-minimal,
  .footer-minimized .social-link-minimal,
  .footer-minimized .legal-link-minimal {
    color: #ffffff;
    border-color: #ffffff;
  }
  
  .footer-minimized .footer-logo-link-minimal:hover,
  .footer-minimized .footer-logo-link-minimal:focus,
  .footer-minimized .social-link-minimal:hover,
  .footer-minimized .social-link-minimal:focus,
  .footer-minimized .legal-link-minimal:hover,
  .footer-minimized .legal-link-minimal:focus {
    background: #ffffff;
    color: #000000;
  }
}
</style>
