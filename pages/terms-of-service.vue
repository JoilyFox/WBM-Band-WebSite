<template>
  <div class="terms-of-service-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background"></div>
      <div class="hero-content">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="hero-glassmorphic-card">
            <h1 class="hero-title">{{ t('pages.terms.title') }}</h1>
            <p class="hero-subtitle">
              {{ t('pages.terms.subtitle') }}
            </p>
            <div class="hero-meta">
              <span class="last-updated">{{
                t('pages.terms.last_updated', { date: lastUpdated })
              }}</span>
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
            <h2 class="section-title">{{ t('pages.terms.intro_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.terms.intro_text_1', { fullBandName, bandName }) }}
            </p>
            <p class="text-content">
              {{ t('pages.terms.intro_text_2') }}
            </p>
          </div>
        </div>

        <!-- Use of Services -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.terms.use_title') }}</h2>
          </div>
          <div class="card-content">
            <div class="subsection">
              <h3 class="subsection-title">{{ t('pages.terms.permitted_title') }}</h3>
              <ul class="info-list">
                <li>{{ t('pages.terms.permitted_1') }}</li>
                <li>{{ t('pages.terms.permitted_2') }}</li>
                <li>{{ t('pages.terms.permitted_3') }}</li>
                <li>{{ t('pages.terms.permitted_4') }}</li>
              </ul>
            </div>

            <div class="subsection">
              <h3 class="subsection-title">{{ t('pages.terms.prohibited_title') }}</h3>
              <ul class="info-list">
                <li>{{ t('pages.terms.prohibited_1') }}</li>
                <li>{{ t('pages.terms.prohibited_2') }}</li>
                <li>{{ t('pages.terms.prohibited_3') }}</li>
                <li>{{ t('pages.terms.prohibited_4') }}</li>
                <li>{{ t('pages.terms.prohibited_5', { bandName }) }}</li>
                <li>{{ t('pages.terms.prohibited_6') }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Intellectual Property Rights -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.terms.ip_title') }}</h2>
          </div>
          <div class="card-content">
            <div class="rights-grid">
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-volume-up"></i>
                </div>
                <h4 class="rights-title">{{ t('pages.terms.ip_music_title') }}</h4>
                <p class="rights-description">
                  {{ t('pages.terms.ip_music_desc', { bandName }) }}
                </p>
              </div>

              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-image"></i>
                </div>
                <h4 class="rights-title">{{ t('pages.terms.ip_visual_title') }}</h4>
                <p class="rights-description">
                  {{ t('pages.terms.ip_visual_desc') }}
                </p>
              </div>

              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-globe"></i>
                </div>
                <h4 class="rights-title">{{ t('pages.terms.ip_brand_title') }}</h4>
                <p class="rights-description">
                  {{ t('pages.terms.ip_brand_desc') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Disclaimers and Limitations -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.terms.disclaimer_title') }}</h2>
          </div>
          <div class="card-content">
            <div class="disclaimer-types">
              <div class="disclaimer-type">
                <h4 class="disclaimer-title">
                  {{ t('pages.terms.disclaimer_availability_title') }}
                </h4>
                <p class="disclaimer-description">
                  {{ t('pages.terms.disclaimer_availability_desc') }}
                </p>
              </div>

              <div class="disclaimer-type">
                <h4 class="disclaimer-title">{{ t('pages.terms.disclaimer_links_title') }}</h4>
                <p class="disclaimer-description">
                  {{ t('pages.terms.disclaimer_links_desc') }}
                </p>
              </div>

              <div class="disclaimer-type">
                <h4 class="disclaimer-title">{{ t('pages.terms.disclaimer_liability_title') }}</h4>
                <p class="disclaimer-description">
                  {{ t('pages.terms.disclaimer_liability_desc', { bandName }) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Limitation of Access -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.terms.limitation_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.terms.limitation_desc') }}
            </p>
          </div>
        </div>

        <!-- Governing Law -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.terms.law_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.terms.law_text_1') }}
            </p>
            <p class="text-content">
              {{ t('pages.terms.law_text_2') }}
            </p>
          </div>
        </div>

        <!-- Changes to Terms -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.terms.changes_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.terms.changes_text_1', { dataResponseTime }) }}
            </p>
            <p class="text-content">
              {{ t('pages.terms.changes_text_2') }}
            </p>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.terms.contact_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.terms.contact_text') }}
            </p>

            <div class="contact-info">
              <div class="contact-item">
                <i class="pi pi-envelope"></i>
                <a :href="`mailto:${contactEmail}`" class="contact-link">{{ contactEmail }}</a>
              </div>
            </div>

            <div class="response-time">
              <p class="response-text">
                <i class="pi pi-clock"></i>
                {{ t('pages.terms.contact_response', { dataResponseTime }) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Back to Top Button -->
    <button
      class="back-to-top"
      :class="{ visible: showBackToTop }"
      :aria-label="t('pages.privacy.back_to_top')"
      @click="scrollToTop"
    >
      <i class="pi pi-chevron-up"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { getConfig } from '~/utils/configHelpers'
  import { useI18n } from 'vue-i18n'
  import { SITE_URL } from '~/constants/app'
  const { t, locale } = useI18n()

  // Meta tags for SEO
  useHead({
    title: `${t('pages.terms.title')} - ${getConfig('general.bandName')}`,
    meta: [
      {
        name: 'description',
        content: `${t('pages.terms.title')} - ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}).`
      },
      {
        property: 'og:title',
        content: `${t('pages.terms.title')} - ${getConfig('general.bandName')}`
      },
      {
        property: 'og:description',
        content: `${t('pages.terms.title')} - ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}).`
      },
      { property: 'og:type', content: 'website' }
    ],
    link: [
      { rel: 'canonical', href: `${SITE_URL}/${locale.value}/terms-of-service` },
      { rel: 'alternate', hreflang: 'uk-UA', href: `${SITE_URL}/ua/terms-of-service` },
      { rel: 'alternate', hreflang: 'en-US', href: `${SITE_URL}/en/terms-of-service` },
      { rel: 'alternate', hreflang: 'x-default', href: `${SITE_URL}/ua/terms-of-service` }
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
    return new Date(getConfig('general.legal.termsOfServiceLastUpdated')).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    )
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
  /* Reuse the same styles as privacy policy with minor adjustments */
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
  }

  .terms-of-service-page {
    min-height: 100vh;
    background:
      linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%),
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%);
    position: relative;
    overflow-x: hidden;
  }

  .terms-of-service-page::before {
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

  /* Hero Section - same as privacy policy */
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

  /* Content Section - same base styles as privacy policy */
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

  /* Subsections */
  .subsection {
    margin-bottom: 2rem;
  }

  .subsection:last-child {
    margin-bottom: 0;
  }

  .subsection-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .info-list {
    list-style: none;
    padding: 0;
  }

  .info-list li {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
    position: relative;
  }

  .info-list li::before {
    content: '•';
    color: rgba(120, 119, 198, 0.8);
    font-weight: bold;
    position: absolute;
    left: 0.5rem;
  }

  /* Rights Grid - reuse from privacy policy */
  .rights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .rights-item {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.25rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  @media (hover: hover) {
    .rights-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
  }

  .rights-icon {
    width: 2.5rem;
    height: 2.5rem;
    margin: 0 auto 0.75rem;
    background: rgba(120, 119, 198, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(120, 119, 198, 0.9);
    font-size: 1rem;
  }

  .rights-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .rights-description {
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.4;
  }

  /* Conduct List */
  .conduct-list {
    margin-top: 1.5rem;
  }

  .conduct-item {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .conduct-item:last-child {
    margin-bottom: 0;
  }

  .conduct-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .conduct-description {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  /* Disclaimer Types */
  .disclaimer-types {
    margin-top: 1.5rem;
  }

  .disclaimer-type {
    background: rgba(255, 255, 255, 0.02);
    border-left: 3px solid rgba(255, 119, 198, 0.5);
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    border-radius: 0 8px 8px 0;
  }

  .disclaimer-type:last-child {
    margin-bottom: 0;
  }

  .disclaimer-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .disclaimer-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  /* Termination Reasons */
  .termination-reasons {
    margin: 1.5rem 0;
  }

  .termination-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .termination-item:last-child {
    margin-bottom: 0;
  }

  .termination-item i {
    color: rgba(255, 119, 198, 0.8);
    width: 1.25rem;
    text-align: center;
  }

  /* Contact Information - same as privacy policy */
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

  /* Back to Top Button - same as privacy policy */
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

    .rights-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
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

    .rights-item {
      padding: 1rem;
    }

    .rights-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .content-card,
    .rights-item,
    .back-to-top,
    .contact-link {
      transition: none;
    }

    /* Disable transforms even on hover for reduced motion */
    @media (hover: hover) {
      .content-card:hover,
      .rights-item:hover,
      .back-to-top:hover {
        transform: none;
      }
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .terms-of-service-page {
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
    .conduct-description,
    .rights-description,
    .disclaimer-description {
      color: #ffffff;
    }
  }
</style>
