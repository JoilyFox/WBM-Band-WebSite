<template>
  <div class="privacy-policy-page legal-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background"></div>
      <div class="hero-content">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="hero-glassmorphic-card">
            <h1 class="hero-title">{{ t('pages.privacy.title') }}</h1>
            <p class="hero-subtitle">
              {{ t('pages.privacy.subtitle') }}
            </p>
            <div class="hero-meta">
              <span class="last-updated">{{
                t('pages.privacy.last_updated', { date: lastUpdated })
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
            <h2 class="section-title">{{ t('pages.privacy.intro_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.intro_text_1', { fullBandName, bandName }) }}
            </p>
            <p class="text-content">
              {{ t('pages.privacy.intro_text_2') }}
            </p>
            <p class="text-content">
              {{ t('pages.privacy.intro_text_3') }}
            </p>
          </div>
        </div>

        <!-- Information We Collect -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.collect_title') }}</h2>
          </div>
          <div class="card-content">
            <div class="subsection">
              <h3 class="subsection-title">{{ t('pages.privacy.collect_personal_title') }}</h3>
              <p class="text-content">{{ t('pages.privacy.collect_personal_desc') }}</p>
              <ul class="info-list">
                <li>{{ t('pages.privacy.collect_personal_1') }}</li>
                <li>{{ t('pages.privacy.collect_personal_2') }}</li>
                <li>{{ t('pages.privacy.collect_personal_3') }}</li>
                <li>{{ t('pages.privacy.collect_personal_4') }}</li>
              </ul>
            </div>

            <div class="subsection">
              <h3 class="subsection-title">{{ t('pages.privacy.collect_technical_title') }}</h3>
              <p class="text-content">{{ t('pages.privacy.collect_technical_desc') }}</p>
              <ul class="info-list">
                <li>{{ t('pages.privacy.collect_technical_1') }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- How We Use Your Information -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.use_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">{{ t('pages.privacy.use_intro') }}</p>
            <div class="usage-grid">
              <div class="usage-item">
                <div class="usage-icon">
                  <i class="pi pi-envelope"></i>
                </div>
                <h3 class="usage-title">{{ t('pages.privacy.use_communication_title') }}</h3>
                <p class="usage-description">
                  {{ t('pages.privacy.use_communication_desc') }}
                </p>
              </div>

              <div class="usage-item">
                <div class="usage-icon">
                  <i class="pi pi-shield"></i>
                </div>
                <h3 class="usage-title">{{ t('pages.privacy.use_security_title') }}</h3>
                <p class="usage-description">
                  {{ t('pages.privacy.use_security_desc') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Sharing -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.share_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.share_intro') }}
            </p>

            <div class="sharing-list">
              <div class="sharing-item">
                <h3 class="sharing-title">{{ t('pages.privacy.share_providers_title') }}</h3>
                <p class="sharing-description">
                  {{ t('pages.privacy.share_providers_desc') }}
                </p>
              </div>

              <div class="sharing-item">
                <h3 class="sharing-title">{{ t('pages.privacy.share_legal_title') }}</h3>
                <p class="sharing-description">
                  {{ t('pages.privacy.share_legal_desc') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Your Rights -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.rights_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.rights_intro') }}
            </p>

            <div class="rights-grid">
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-eye"></i>
                </div>
                <h3 class="rights-title">{{ t('pages.privacy.rights_access_title') }}</h3>
                <p class="rights-description">{{ t('pages.privacy.rights_access_desc') }}</p>
              </div>

              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-pencil"></i>
                </div>
                <h3 class="rights-title">{{ t('pages.privacy.rights_rectification_title') }}</h3>
                <p class="rights-description">{{ t('pages.privacy.rights_rectification_desc') }}</p>
              </div>

              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-trash"></i>
                </div>
                <h3 class="rights-title">{{ t('pages.privacy.rights_erasure_title') }}</h3>
                <p class="rights-description">{{ t('pages.privacy.rights_erasure_desc') }}</p>
              </div>

              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-times-circle"></i>
                </div>
                <h3 class="rights-title">{{ t('pages.privacy.rights_objection_title') }}</h3>
                <p class="rights-description">{{ t('pages.privacy.rights_objection_desc') }}</p>
              </div>
            </div>

            <div class="subsection" style="margin-top: 2rem">
              <h3 class="subsection-title">{{ t('pages.privacy.rights_exercise_title') }}</h3>
              <p class="text-content">
                {{
                  t('pages.privacy.rights_exercise_desc', { email: privacyEmail, dataResponseTime })
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Cookies -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.cookies_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{
                t('pages.privacy.cookies_text_1', {
                  cookiesPolicy: t('pages.privacy.cookies_policy_link')
                })
              }}
            </p>
            <p class="text-content">
              {{ t('pages.privacy.cookies_text_2') }}
            </p>
            <p class="text-content">
              <NuxtLink :to="localePath('/cookies-policy')" class="contact-link">{{
                t('pages.privacy.cookies_policy_link')
              }}</NuxtLink>
            </p>
          </div>
        </div>

        <!-- Data Security -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.security_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.security_intro') }}
            </p>

            <div class="security-measures">
              <div class="security-item">
                <i class="pi pi-lock"></i>
                <span>{{ t('pages.privacy.security_1') }}</span>
              </div>
              <div class="security-item">
                <i class="pi pi-server"></i>
                <span>{{ t('pages.privacy.security_2') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Retention -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.retention_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.retention_text') }}
            </p>
          </div>
        </div>

        <!-- Children's Privacy -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.children_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.children_text') }}
            </p>
          </div>
        </div>

        <!-- Updates -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.changes_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.changes_text_1') }}
            </p>
            <p class="text-content">
              {{ t('pages.privacy.changes_text_2') }}
            </p>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">{{ t('pages.privacy.contact_title') }}</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              {{ t('pages.privacy.contact_text') }}
            </p>

            <div class="contact-info">
              <div class="contact-item">
                <i class="pi pi-envelope"></i>
                <a :href="`mailto:${privacyEmail}`" class="contact-link">{{ privacyEmail }}</a>
              </div>
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
  import { formatLegalDate } from '~/utils/legalDate'
  import '~/assets/css/legal.scss'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'
  import { SITE_URL } from '~/constants/app'
  const { t, locale } = useI18n()
  const localePath = useLocalePath()

  // Meta tags for SEO
  useHead({
    title: `${t('pages.privacy.title')} - ${getConfig('general.bandName')}`,
    meta: [
      {
        name: 'description',
        content: `${t('pages.privacy.subtitle')} ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}).`
      },
      {
        property: 'og:title',
        content: `${t('pages.privacy.title')} - ${getConfig('general.bandName')}`
      },
      {
        property: 'og:description',
        content: `${t('pages.privacy.subtitle')} ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}).`
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: locale.value === 'ua' ? 'uk_UA' : 'en_US' },
      { property: 'og:locale:alternate', content: locale.value === 'ua' ? 'en_US' : 'uk_UA' }
    ],
    link: [
      // Ukrainian is the unprefixed default locale, so its URL is the clean
      // `/privacy-policy` — never `/ua/privacy-policy`, which is not a route.
      { rel: 'canonical', href: `${SITE_URL}${locale.value === 'en' ? '/en' : ''}/privacy-policy` },
      { rel: 'alternate', hreflang: 'uk-UA', href: `${SITE_URL}/privacy-policy` },
      { rel: 'alternate', hreflang: 'en-US', href: `${SITE_URL}/en/privacy-policy` },
      { rel: 'alternate', hreflang: 'x-default', href: `${SITE_URL}/privacy-policy` }
    ]
  })

  // Reactive data
  const showBackToTop = ref(false)

  // Computed properties for config values
  const bandName = computed(() => getConfig('general.bandName'))
  const fullBandName = computed(() => getConfig('general.fullBandName'))
  const privacyEmail = computed(() => getConfig('general.contact.privacyEmail'))
  const contactPhone = computed(() => getConfig('general.contact.phone'))
  const contactPhoneNumber = computed(() => getConfig('general.contact.phoneNumber'))
  const dataResponseTime = computed(() => getConfig('general.legal.dataResponseTime'))

  // Computed
  const lastUpdated = computed(() =>
    formatLegalDate(getConfig('general.legal.privacyPolicyLastUpdated'), locale.value)
  )

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
    window.addEventListener('scroll', handleScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<style scoped>
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

  /* Usage Grid */
  .usage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .usage-item {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  @media (hover: hover) {
    .usage-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
  }

  .usage-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    background: var(--accent-gradient);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
  }

  .usage-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .usage-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  /* Sharing List */
  .sharing-list {
    margin-top: 1.5rem;
  }

  .sharing-item {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .sharing-item:last-child {
    margin-bottom: 0;
  }

  .sharing-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .sharing-description {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  /* Rights Grid */
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

  /* Cookie Types */
  .cookie-types {
    margin-top: 1.5rem;
  }

  .cookie-type {
    background: rgba(255, 255, 255, 0.02);
    border-left: 3px solid rgba(120, 119, 198, 0.5);
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    border-radius: 0 8px 8px 0;
  }

  .cookie-type:last-child {
    margin-bottom: 0;
  }

  .cookie-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .cookie-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  /* Security Measures */
  .security-measures {
    margin-top: 1.5rem;
  }

  .security-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .security-item:last-child {
    margin-bottom: 0;
  }

  .security-item i {
    color: rgba(120, 119, 198, 0.8);
    width: 1.25rem;
    text-align: center;
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

    .usage-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
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

    .usage-item,
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
    .usage-item,
    .rights-item,
    .back-to-top,
    .contact-link {
      transition: none;
    }

    /* Disable transforms even on hover for reduced motion */
    @media (hover: hover) {
      .content-card:hover,
      .usage-item:hover,
      .rights-item:hover,
      .back-to-top:hover {
        transform: none;
      }
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .privacy-policy-page {
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
    .usage-description,
    .sharing-description,
    .rights-description,
    .cookie-description {
      color: #ffffff;
    }
  }
</style>
