<template>
  <footer class="footer-section bg-surface-950 border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Main Footer Content -->
      <div class="pb-12 pt-0 sm:pt-12 lg:py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <!-- Brand Section -->
          <div class="lg:col-span-2 text-center md:text-left">
            <div class="flex items-center justify-center md:justify-start mb-6">
              <button @click="scrollToHero" class="footer-logo-button">
                <img 
                  src="/images/wbm-logo-white.svg" 
                  :alt="`${generalConfig.bandName} Logo`" 
                  class="h-12 w-auto filter drop-shadow-lg"
                  loading="lazy"
                />
              </button>
            </div>
            <p class="text-white/70 text-sm leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
              {{ generalConfig.fullBandName }} - Pushing the boundaries of rock, alternative, and indie music. 
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

          <!-- Contact Info -->
          <div class="text-center md:text-left">
            <h3 class="footer-heading">Contact</h3>
            <ul class="space-y-3">
              <li class="footer-contact-item justify-center md:justify-start">
                <i class="pi pi-envelope text-white/60"></i>
                <a :href="`mailto:${generalConfig.contact.email}`" class="footer-link">
                  {{ generalConfig.contact.email }}
                </a>
              </li>
              <li class="footer-contact-item justify-center md:justify-start">
                <i class="pi pi-map-marker text-white/60"></i>
                <span class="text-white/70 text-sm">
                  {{ generalConfig.contact.location.short }}
                </span>
              </li>
              <li class="footer-contact-item justify-center md:justify-start">
                <i class="pi pi-phone text-white/60"></i>
                <a :href="`tel:${generalConfig.contact.phoneNumber}`" class="footer-link">
                  {{ generalConfig.contact.phone }}
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
              © {{ currentYear }} {{ generalConfig.fullBandName }}. All rights reserved.
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
                Made with ❤️ and 🎸
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
import { generalConfig } from '~/config/general'

// Composables
const snackbar = useSnackbar()
const { scrollToElementWithNavigation } = useScrollTo()

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

// Streaming platforms
const streamingPlatforms = ref([
  {
    name: 'Spotify',
    icon: '/assets/images/icons/spotify-icon.svg',
    url: 'https://open.spotify.com/artist/wbmband'
  },
  {
    name: 'Apple Music',
    icon: '/assets/images/icons/apple-music-icon.svg',
    url: 'https://music.apple.com/artist/wbmband'
  },
  {
    name: 'YouTube Music',
    icon: '/assets/images/icons/youtube-music-icon.svg',
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
      snackbar.info('Terms of Service', 'Terms of service page coming soon!', 3000)
      break
    case 'cookies':
      snackbar.info('Cookie Policy', 'Cookie policy page coming soon!', 3000)
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
.footer-logo-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.3);
  outline-offset: 2px;
}

/* Remove default focus outlines on click */
.footer-link:focus:not(:focus-visible),
.social-link:focus:not(:focus-visible),
.streaming-icon-link:focus:not(:focus-visible),
.legal-link:focus:not(:focus-visible),
.footer-logo-button:focus:not(:focus-visible) {
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
    padding-top: 2rem;
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
  .footer-logo-button {
    transition: none;
  }
  
  .streaming-icon {
    transition: none;
  }
  
  .footer-link:hover,
  .social-link:hover,
  .streaming-icon-link:hover,
  .legal-link:hover,
  .footer-logo-button:hover {
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
  .footer-logo-button:active {
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
  .legal-link {
    color: #ffffff;
    border-color: #ffffff;
  }
  
  .footer-link:hover,
  .footer-link:focus,
  .social-link:hover,
  .social-link:focus,
  .legal-link:hover,
  .legal-link:focus {
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
}
</style>
