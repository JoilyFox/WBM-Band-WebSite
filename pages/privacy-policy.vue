<template>
  <div class="privacy-policy-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background"></div>
      <div class="hero-content">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="hero-glassmorphic-card">
            <h1 class="hero-title">Privacy Policy</h1>
            <p class="hero-subtitle">
              Your privacy is important to us. Learn how we protect and handle your personal information.
            </p>
            <div class="hero-meta">
              <span class="last-updated">Last updated: {{ lastUpdated }}</span>
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
            <h2 class="section-title">Introduction</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              Welcome to {{ fullBandName }} ({{ bandName }}). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you visit our website, 
              interact with our music, or engage with our services.
            </p>
            <p class="text-content">
              This policy applies to all information collected through our website, social media channels, 
              streaming platforms, and any related services, sales, marketing, or events.
            </p>
          </div>
        </div>

        <!-- Information We Collect -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Information We Collect</h2>
          </div>
          <div class="card-content">
            <div class="subsection">
              <h3 class="subsection-title">Personal Information</h3>
              <ul class="info-list">
                <li>Contact information (name, email address, phone number)</li>
                <li>Demographic information (age, location, music preferences)</li>
                <li>Social media profile information when you connect with us</li>
                <li>Communication preferences and consent records</li>
              </ul>
            </div>
            
            <div class="subsection">
              <h3 class="subsection-title">Technical Information</h3>
              <ul class="info-list">
                <li>IP address and geolocation data</li>
                <li>Browser type, version, and settings</li>
                <li>Device information and operating system</li>
                <li>Website usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div class="subsection">
              <h3 class="subsection-title">Music and Engagement Data</h3>
              <ul class="info-list">
                <li>Streaming history and music preferences</li>
                <li>Concert attendance and ticket purchases</li>
                <li>Merchandise orders and transaction history</li>
                <li>Fan club membership and engagement metrics</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- How We Use Your Information -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">How We Use Your Information</h2>
          </div>
          <div class="card-content">
            <div class="usage-grid">
              <div class="usage-item">
                <div class="usage-icon">
                  <i class="pi pi-play"></i>
                </div>
                <h4 class="usage-title">Music & Content</h4>
                <p class="usage-description">
                  To provide and improve our music content, recommend songs, and personalize your listening experience.
                </p>
              </div>
              
              <div class="usage-item">
                <div class="usage-icon">
                  <i class="pi pi-envelope"></i>
                </div>
                <h4 class="usage-title">Communication</h4>
                <p class="usage-description">
                  To send you updates about new releases, concerts, and band news that you've subscribed to receive.
                </p>
              </div>
              
              <div class="usage-item">
                <div class="usage-icon">
                  <i class="pi pi-chart-line"></i>
                </div>
                <h4 class="usage-title">Analytics</h4>
                <p class="usage-description">
                  To analyze website usage, understand fan preferences, and improve our services and content.
                </p>
              </div>
              
              <div class="usage-item">
                <div class="usage-icon">
                  <i class="pi pi-shield"></i>
                </div>
                <h4 class="usage-title">Security</h4>
                <p class="usage-description">
                  To protect our website, prevent fraud, and ensure the security of our platform and users.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Sharing -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Data Sharing and Disclosure</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            
            <div class="sharing-list">
              <div class="sharing-item">
                <h4 class="sharing-title">Service Providers</h4>
                <p class="sharing-description">
                  With trusted third-party services that help us operate our website, conduct business, or serve our fans, 
                  such as email marketing platforms, analytics services, and payment processors.
                </p>
              </div>
              
              <div class="sharing-item">
                <h4 class="sharing-title">Legal Requirements</h4>
                <p class="sharing-description">
                  When required by law, court order, or government regulation, or to protect the rights, 
                  property, and safety of {{ bandName }}, our users, or others.
                </p>
              </div>
              
              <div class="sharing-item">
                <h4 class="sharing-title">Business Transfers</h4>
                <p class="sharing-description">
                  In connection with any merger, sale of assets, financing, or acquisition of all or 
                  a portion of our business to another company.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Your Rights -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Your Privacy Rights</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              You have several rights regarding your personal information:
            </p>
            
            <div class="rights-grid">
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-eye"></i>
                </div>
                <h4 class="rights-title">Access</h4>
                <p class="rights-description">Request access to your personal data we hold</p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-pencil"></i>
                </div>
                <h4 class="rights-title">Correction</h4>
                <p class="rights-description">Request correction of inaccurate personal data</p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-trash"></i>
                </div>
                <h4 class="rights-title">Deletion</h4>
                <p class="rights-description">Request deletion of your personal data</p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-ban"></i>
                </div>
                <h4 class="rights-title">Restriction</h4>
                <p class="rights-description">Request restriction of processing your data</p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-download"></i>
                </div>
                <h4 class="rights-title">Portability</h4>
                <p class="rights-description">Request transfer of your data to another service</p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-times-circle"></i>
                </div>
                <h4 class="rights-title">Opt-out</h4>
                <p class="rights-description">Opt-out of marketing communications</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cookies -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Cookies and Tracking</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              We use cookies and similar tracking technologies to enhance your browsing experience, 
              analyze site traffic, and understand where our visitors are coming from.
            </p>
            
            <div class="cookie-types">
              <div class="cookie-type">
                <h4 class="cookie-title">Essential Cookies</h4>
                <p class="cookie-description">
                  Required for the website to function properly. These cannot be disabled.
                </p>
              </div>
              
              <div class="cookie-type">
                <h4 class="cookie-title">Analytics Cookies</h4>
                <p class="cookie-description">
                  Help us understand how visitors interact with our website by collecting and reporting information.
                </p>
              </div>
              
              <div class="cookie-type">
                <h4 class="cookie-title">Marketing Cookies</h4>
                <p class="cookie-description">
                  Used to track visitors across websites to display relevant and engaging advertisements.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Security -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Data Security</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              We implement appropriate technical and organizational security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
            
            <div class="security-measures">
              <div class="security-item">
                <i class="pi pi-lock"></i>
                <span>SSL/TLS encryption for data transmission</span>
              </div>
              <div class="security-item">
                <i class="pi pi-server"></i>
                <span>Secure server infrastructure and hosting</span>
              </div>
              <div class="security-item">
                <i class="pi pi-key"></i>
                <span>Access controls and authentication systems</span>
              </div>
              <div class="security-item">
                <i class="pi pi-refresh"></i>
                <span>Regular security updates and monitoring</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Contact Us</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div class="contact-info">
              <div class="contact-item">
                <i class="pi pi-envelope"></i>
                <a :href="`mailto:${privacyEmail}`" class="contact-link">{{ privacyEmail }}</a>
              </div>
              <div class="contact-item">
                <i class="pi pi-map-marker"></i>
                <span>{{ contactLocation }}</span>
              </div>
              <div class="contact-item">
                <i class="pi pi-phone"></i>
                <a :href="`tel:${contactPhoneNumber}`" class="contact-link">{{ contactPhone }}</a>
              </div>
            </div>
            
            <div class="response-time">
              <p class="response-text">
                <i class="pi pi-clock"></i>
                We will respond to your privacy-related inquiries within {{ dataResponseTime }}.
              </p>
            </div>
          </div>
        </div>

        <!-- Updates -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Policy Updates</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, 
              legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page 
              and updating the "Last updated" date.
            </p>
            <p class="text-content">
              We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- Back to Top Button -->
    <button 
      @click="scrollToTop" 
      class="back-to-top"
      :class="{ 'visible': showBackToTop }"
      aria-label="Back to top"
    >
      <i class="pi pi-chevron-up"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getConfig } from '~/utils/configHelpers'

// Meta tags for SEO
useHead({
  title: `Privacy Policy - ${getConfig('general.bandName')}`,
  meta: [
    { name: 'description', content: `Privacy Policy for ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}). Learn how we protect and handle your personal information.` },
    { name: 'keywords', content: `privacy policy, ${getConfig('general.bandName')}, ${getConfig('general.fullBandName')}, data protection, privacy rights` },
    { property: 'og:title', content: `Privacy Policy - ${getConfig('general.bandName')}` },
    { property: 'og:description', content: `Privacy Policy for ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}). Learn how we protect and handle your personal information.` },
    { property: 'og:type', content: 'website' }
  ]
})

// Reactive data
const showBackToTop = ref(false)

// Computed properties for config values
const bandName = computed(() => getConfig('general.bandName'))
const fullBandName = computed(() => getConfig('general.fullBandName'))
const privacyEmail = computed(() => getConfig('general.contact.privacyEmail'))
const contactLocation = computed(() => getConfig('general.contact.location.full'))
const contactPhone = computed(() => getConfig('general.contact.phone'))
const contactPhoneNumber = computed(() => getConfig('general.contact.phoneNumber'))
const dataResponseTime = computed(() => getConfig('general.legal.dataResponseTime'))

// Computed
const lastUpdated = computed(() => {
  return new Date(getConfig('general.legal.privacyPolicyLastUpdated')).toLocaleDateString('en-US', {
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
}

.privacy-policy-page {
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%),
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%);
  position: relative;
  overflow-x: hidden;
}

.privacy-policy-page::before {
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
