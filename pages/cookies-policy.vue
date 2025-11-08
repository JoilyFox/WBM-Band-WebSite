<template>
  <div class="cookies-policy-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background"></div>
      <div class="hero-content">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="hero-glassmorphic-card">
            <h1 class="hero-title">{{ t('pages.cookies.title') }}</h1>
            <p class="hero-subtitle">
              {{ t('pages.cookies.subtitle') }}
            </p>
            <div class="hero-meta">
              <span class="last-updated">{{ t('pages.cookies.last_updated', { date: lastUpdated }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="content-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Introduction -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.cookies.what_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.cookies.what_text_1') }}
            </p>
            <p class="text-content">
              {{ t('pages.cookies.what_text_2', { fullBandName, bandName }) }}
            </p>
          </div>
        </div>

        <!-- Types of Cookies -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.cookies.types_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.cookies.types_intro') }}
            </p>
            <div class="cookie-types-grid">
              <div class="cookie-type-item">
                <div class="cookie-icon essential">
                  <i class="pi pi-cog"></i>
                </div>
                <h3 class="cookie-type-title">{{ t('pages.cookies.essential_title') }}</h3>
                <p class="cookie-type-description">
                  {{ t('pages.cookies.essential_desc') }}
                </p>
                <div class="cookie-examples">
                  {{ t('pages.cookies.essential_examples') }}
                </div>
              </div>
              
              <div class="cookie-type-item">
                <div class="cookie-icon analytics">
                  <i class="pi pi-chart-line"></i>
                </div>
                <h3 class="cookie-type-title">{{ t('pages.cookies.nonessential_title') }}</h3>
                <p class="cookie-type-description">
                  {{ t('pages.cookies.nonessential_desc') }}
                </p>
                <div class="cookie-examples">
                  {{ t('pages.cookies.nonessential_examples') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Managing Cookies -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.cookies.manage_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.cookies.manage_text_1') }}
            </p>
            <p class="text-content">
              {{ t('pages.cookies.manage_text_2') }}
            </p>
          </div>
        </div>

        <!-- Cookie Consent -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.cookies.consent_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.cookies.consent_text') }}
            </p>
            
            <div class="consent-options">
              <div class="consent-item">
                <div class="consent-icon accept">
                  <i class="pi pi-check"></i>
                </div>
                <div class="consent-content">
                  <h4 class="consent-title">{{ t('pages.cookies.consent_accept_title') }}</h4>
                  <p class="consent-description">
                    {{ t('pages.cookies.consent_accept_desc') }}
                  </p>
                </div>
              </div>
              
              <div class="consent-item">
                <div class="consent-icon reject">
                  <i class="pi pi-times"></i>
                </div>
                <div class="consent-content">
                  <h4 class="consent-title">{{ t('pages.cookies.consent_essential_title') }}</h4>
                  <p class="consent-description">
                    {{ t('pages.cookies.consent_essential_desc') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Updates to Policy -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.cookies.updates_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.cookies.updates_text_1') }}
            </p>
            <p class="text-content">
              {{ t('pages.cookies.updates_text_2') }}
            </p>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.cookies.contact_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.cookies.contact_text') }}
            </p>
            
            <div class="contact-info">
              <div class="contact-item">
                <i class="pi pi-envelope"></i>
                <a :href="`mailto:${contactEmail}`" class="contact-link">{{ contactEmail }}</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Back to Top Button -->
    <button 
      @click="scrollToTop" 
      class="back-to-top"
      :class="{ 'visible': showBackToTop }"
      :aria-label="t('pages.privacy.back_to_top')"
    >
      <i class="pi pi-chevron-up"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getConfig } from '~/utils/configHelpers'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// Meta tags for SEO
useHead({
  title: `${t('pages.cookies.title')} - ${getConfig('general.bandName')}`,
  meta: [
    { name: 'description', content: `${t('pages.cookies.title')} - ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}).` },
    { name: 'keywords', content: `cookies policy, ${getConfig('general.bandName')}, ${getConfig('general.fullBandName')}, website cookies, tracking, privacy` },
    { property: 'og:title', content: `${t('pages.cookies.title')} - ${getConfig('general.bandName')}` },
    { property: 'og:description', content: `${t('pages.cookies.title')} - ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}).` },
    { property: 'og:type', content: 'website' }
  ]
})

// Reactive data
const showBackToTop = ref(false)

// Computed properties for config values
const bandName = computed(() => getConfig('general.bandName'))
const fullBandName = computed(() => getConfig('general.fullBandName'))
const contactEmail = computed(() => getConfig('general.contact.email'))
const contactPhone = computed(() => getConfig('general.contact.phone'))
const contactPhoneNumber = computed(() => getConfig('general.contact.phoneNumber'))
const dataResponseTime = computed(() => getConfig('general.legal.dataResponseTime'))

// Computed
const lastUpdated = computed(() => {
  return new Date(getConfig('general.legal.cookiesPolicyLastUpdated')).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Methods
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Variables for consistent theming */
:root {
  --glassmorphic-bg: rgba(255, 255, 255, 0.05);
  --glassmorphic-border: rgba(255, 255, 255, 0.1);
  --glassmorphic-hover: rgba(255, 255, 255, 0.08);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --accent-gradient: linear-gradient(135deg, #7877c6 0%, #ff77c6 100%);
  --blur-amount: 20px;
  
  /* Cookie category colors */
  --essential-color: rgba(46, 160, 67, 0.8);
  --analytics-color: rgba(52, 152, 219, 0.8);
  --functional-color: rgba(155, 89, 182, 0.8);
  --marketing-color: rgba(231, 76, 60, 0.8);
}

.cookies-policy-page {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%),
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%);
  position: relative;
  overflow-x: hidden;
}

.cookies-policy-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.015'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: -1;
}

/* Hero Section */
.hero-section {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.2) 0%, transparent 60%),
    radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.15) 0%, transparent 60%);
  filter: blur(40px);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 4rem 0;
}

.hero-glassmorphic-card {
  background: var(--glassmorphic-bg);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid var(--glassmorphic-border);
  border-radius: 24px;
  padding: 3rem 2rem;
  position: relative;
  overflow: hidden;
}

.hero-glassmorphic-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--accent-gradient);
  opacity: 0.05;
  border-radius: 24px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
}

.hero-subtitle {
  color: var(--text-secondary);
  font-size: 1.25rem;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.hero-meta {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.last-updated {
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

/* Content Section */
.content-section {
  padding: 4rem 0;
  position: relative;
  z-index: 2;
}

.content-card {
  background: var(--glassmorphic-bg);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid var(--glassmorphic-border);
  border-radius: 20px;
  margin-bottom: 2rem;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

/* Only apply hover effects on devices that support hovering (not touch devices) */
@media (hover: hover) {
  .content-card:hover {
    background: var(--glassmorphic-hover);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
}

.card-header {
  padding: 2rem 2rem 0 2rem;
  position: relative;
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  width: 3rem;
  height: 2px;
  background: var(--accent-gradient);
  border-radius: 1px;
}

.card-content {
  padding: 1rem 2rem 2rem 2rem;
}

.text-content {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.text-content:last-child {
  margin-bottom: 0;
}

/* Cookie Types Grid */
.cookie-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.cookie-type-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
}

@media (hover: hover) {
  .cookie-type-item:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
}

.cookie-icon {
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.cookie-icon.essential {
  background: var(--essential-color);
}

.cookie-icon.analytics {
  background: var(--analytics-color);
}

.cookie-icon.functional {
  background: var(--functional-color);
}

.cookie-icon.marketing {
  background: var(--marketing-color);
}

.cookie-type-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.cookie-type-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.cookie-examples {
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

/* Cookie List */
.cookie-list {
  margin-top: 1.5rem;
}

.cookie-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.cookie-item:last-child {
  margin-bottom: 0;
}

.cookie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cookie-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.cookie-category {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.cookie-category.essential {
  background: var(--essential-color);
  color: white;
}

.cookie-category.analytics {
  background: var(--analytics-color);
  color: white;
}

.cookie-category.functional {
  background: var(--functional-color);
  color: white;
}

.cookie-category.marketing {
  background: var(--marketing-color);
  color: white;
}

.cookie-purpose {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.cookie-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.cookie-duration,
.cookie-provider {
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
}

/* Third Party Grid */
.third-party-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.third-party-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.third-party-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  background: rgba(120, 119, 198, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(120, 119, 198, 0.9);
  font-size: 1.1rem;
}

.third-party-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.third-party-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.third-party-link {
  color: rgba(120, 119, 198, 0.9);
  text-decoration: none;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.25rem 0.5rem;
  transition: color 0.3s ease;
}

@media (hover: hover) {
  .third-party-link:hover {
    color: rgba(120, 119, 198, 1);
    text-decoration: underline;
  }
}

.streaming-links,
.social-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

/* Management Options */
.management-options {
  margin-top: 1.5rem;
}

.management-section {
  margin-bottom: 2rem;
}

.management-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.management-description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.management-list {
  list-style: none;
  padding: 0;
}

.management-list li {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
}

.management-list li::before {
  content: '•';
  color: rgba(120, 119, 198, 0.8);
  font-weight: bold;
  position: absolute;
  left: 0.5rem;
}

.browser-guides {
  margin-top: 1.5rem;
}

.browser-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.browser-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: rgba(120, 119, 198, 0.9);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

@media (hover: hover) {
  .browser-link:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(120, 119, 198, 1);
  }
}

/* Consent Options */
.consent-options {
  margin-top: 1.5rem;
}

.consent-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.consent-item:last-child {
  margin-bottom: 0;
}

.consent-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.consent-icon.accept {
  background: var(--essential-color);
}

.consent-icon.customize {
  background: var(--functional-color);
}

.consent-icon.reject {
  background: var(--marketing-color);
}

.consent-content {
  flex: 1;
}

.consent-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.consent-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Legal Basis */
.legal-basis {
  margin-top: 1.5rem;
}

.legal-item {
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid rgba(120, 119, 198, 0.5);
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border-radius: 0 8px 8px 0;
}

.legal-item:last-child {
  margin-bottom: 0;
}

.legal-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.legal-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Contact Information */
.contact-info {
  margin: 1.5rem 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.contact-item i {
  color: rgba(120, 119, 198, 0.8);
  width: 1.25rem;
  text-align: center;
}

.contact-link {
  color: rgba(120, 119, 198, 0.9);
  text-decoration: none;
  transition: color 0.3s ease;
}

@media (hover: hover) {
  .contact-link:hover {
    color: rgba(120, 119, 198, 1);
    text-decoration: underline;
  }
}

.response-time {
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(120, 119, 198, 0.1);
  border: 1px solid rgba(120, 119, 198, 0.2);
  border-radius: 12px;
}

.response-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.response-text i {
  color: rgba(120, 119, 198, 0.8);
}

/* Back to Top Button */
.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3rem;
  height: 3rem;
  background: var(--glassmorphic-bg);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid var(--glassmorphic-border);
  border-radius: 50%;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.back-to-top.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (hover: hover) {
  .back-to-top:hover {
    background: var(--glassmorphic-hover);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-glassmorphic-card {
    padding: 2rem 1.5rem;
  }
  
  .card-header {
    padding: 1.5rem 1.5rem 0 1.5rem;
  }
  
  .card-content {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
  }
  
  .section-title {
    font-size: 1.75rem;
  }
  
  .cookie-types-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .third-party-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .browser-links {
    grid-template-columns: 1fr;
  }
  
  .cookie-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .cookie-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .back-to-top {
    bottom: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .content-section {
    padding: 2rem 0;
  }
  
  .cookie-type-item,
  .third-party-item {
    padding: 1rem;
  }
  
  .consent-item {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .content-card,
  .cookie-type-item,
  .browser-link,
  .back-to-top,
  .contact-link,
  .third-party-link {
    transition: none;
  }
  
  /* Disable transforms even on hover for reduced motion */
  @media (hover: hover) {
    .content-card:hover,
    .cookie-type-item:hover,
    .back-to-top:hover {
      transform: none;
    }
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .cookies-policy-page {
    background: #000000;
  }
  
  .hero-glassmorphic-card,
  .content-card {
    background: #111111;
    border-color: #ffffff;
  }
  
  .hero-title {
    background: #ffffff;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .text-content,
  .cookie-type-description,
  .cookie-purpose,
  .third-party-description,
  .management-description {
    color: #ffffff;
  }
}
</style>
