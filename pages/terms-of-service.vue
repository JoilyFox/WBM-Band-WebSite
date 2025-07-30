<template>
  <div class="terms-of-service-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background"></div>
      <div class="hero-content">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="hero-glassmorphic-card">
            <h1 class="hero-title">Terms of Service</h1>
            <p class="hero-subtitle">
              Please read these terms carefully before using our website, music, and services.
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
            <h2 class="section-title">Agreement to Terms</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              These Terms of Service ("Terms") govern your use of the {{ fullBandName }} ({{ bandName }}) website, 
              music, services, and any related content. By accessing or using our services, you agree to be bound by these Terms.
            </p>
            <p class="text-content">
              If you disagree with any part of these terms, then you may not access the service. 
              These Terms apply to all visitors, users, and others who access or use the service.
            </p>
          </div>
        </div>

        <!-- Use of Services -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Use of Our Services</h2>
          </div>
          <div class="card-content">
            <div class="subsection">
              <h3 class="subsection-title">Permitted Uses</h3>
              <ul class="info-list">
                <li>Personal, non-commercial enjoyment of our music and content</li>
                <li>Sharing our official releases through authorized platforms</li>
                <li>Attending concerts and purchasing official merchandise</li>
                <li>Engaging with our social media and fan community</li>
                <li>Using our website for information about tours, releases, and band updates</li>
              </ul>
            </div>
            
            <div class="subsection">
              <h3 class="subsection-title">Prohibited Uses</h3>
              <ul class="info-list">
                <li>Unauthorized reproduction, distribution, or modification of our music</li>
                <li>Commercial use of our content without explicit written permission</li>
                <li>Attempting to reverse engineer, hack, or exploit our website</li>
                <li>Using our services for illegal or harmful activities</li>
                <li>Impersonating {{ bandName }} or its members</li>
                <li>Uploading malicious code, viruses, or harmful content</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Intellectual Property Rights -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Intellectual Property Rights</h2>
          </div>
          <div class="card-content">
            <div class="rights-grid">
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-volume-up"></i>
                </div>
                <h4 class="rights-title">Music & Recordings</h4>
                <p class="rights-description">
                  All music, recordings, and compositions are owned by {{ bandName }} and protected by copyright law.
                </p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-image"></i>
                </div>
                <h4 class="rights-title">Visual Content</h4>
                <p class="rights-description">
                  Photos, videos, artwork, and graphics are our exclusive property and may not be used without permission.
                </p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-globe"></i>
                </div>
                <h4 class="rights-title">Website & Brand</h4>
                <p class="rights-description">
                  Website design, logos, and band name are trademarks of {{ fullBandName }}.
                </p>
              </div>
              
              <div class="rights-item">
                <div class="rights-icon">
                  <i class="pi pi-shield"></i>
                </div>
                <h4 class="rights-title">User Content</h4>
                <p class="rights-description">
                  Content you submit may be used by us for promotional purposes while respecting your rights.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- User Accounts and Conduct -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">User Accounts and Conduct</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              When creating an account or interacting with our services, you agree to:
            </p>
            
            <div class="conduct-list">
              <div class="conduct-item">
                <h4 class="conduct-title">Account Security</h4>
                <p class="conduct-description">
                  Maintain the confidentiality of your account credentials and notify us immediately of any unauthorized access.
                </p>
              </div>
              
              <div class="conduct-item">
                <h4 class="conduct-title">Accurate Information</h4>
                <p class="conduct-description">
                  Provide truthful and current information when creating accounts or making purchases.
                </p>
              </div>
              
              <div class="conduct-item">
                <h4 class="conduct-title">Respectful Behavior</h4>
                <p class="conduct-description">
                  Treat other fans, band members, and staff with respect in all interactions and communications.
                </p>
              </div>
              
              <div class="conduct-item">
                <h4 class="conduct-title">Content Guidelines</h4>
                <p class="conduct-description">
                  Any content you submit must be appropriate, legal, and not infringe on others' rights.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Purchases and Payments -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Purchases and Payments</h2>
          </div>
          <div class="card-content">
            <div class="subsection">
              <h3 class="subsection-title">Concert Tickets</h3>
              <p class="text-content">
                Ticket purchases are subject to availability and the terms of the specific venue or ticketing platform. 
                Refund policies vary by event and will be clearly stated at the time of purchase.
              </p>
            </div>
            
            <div class="subsection">
              <h3 class="subsection-title">Merchandise</h3>
              <p class="text-content">
                All merchandise sales are final unless items arrive damaged or defective. 
                We reserve the right to limit quantities and refuse orders at our discretion.
              </p>
            </div>
            
            <div class="subsection">
              <h3 class="subsection-title">Digital Content</h3>
              <p class="text-content">
                Digital music and content purchases are for personal use only and may not be resold, 
                redistributed, or used for commercial purposes.
              </p>
            </div>
          </div>
        </div>

        <!-- Disclaimers and Limitations -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Disclaimers and Limitations</h2>
          </div>
          <div class="card-content">
            <div class="disclaimer-types">
              <div class="disclaimer-type">
                <h4 class="disclaimer-title">Service Availability</h4>
                <p class="disclaimer-description">
                  We do not guarantee uninterrupted access to our website or services. 
                  Maintenance, updates, or technical issues may cause temporary unavailability.
                </p>
              </div>
              
              <div class="disclaimer-type">
                <h4 class="disclaimer-title">Content Accuracy</h4>
                <p class="disclaimer-description">
                  While we strive for accuracy, we cannot guarantee that all information on our website is current or error-free.
                </p>
              </div>
              
              <div class="disclaimer-type">
                <h4 class="disclaimer-title">Third-Party Links</h4>
                <p class="disclaimer-description">
                  Our website may contain links to third-party sites. We are not responsible for their content or privacy practices.
                </p>
              </div>
              
              <div class="disclaimer-type">
                <h4 class="disclaimer-title">Limitation of Liability</h4>
                <p class="disclaimer-description">
                  {{ bandName }} shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Termination -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Termination</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              We may terminate or suspend your access to our services immediately, without prior notice or liability, 
              for any reason, including breach of these Terms.
            </p>
            
            <div class="termination-reasons">
              <div class="termination-item">
                <i class="pi pi-exclamation-triangle"></i>
                <span>Violation of these Terms of Service</span>
              </div>
              <div class="termination-item">
                <i class="pi pi-ban"></i>
                <span>Abuse of our services or harassment of other users</span>
              </div>
              <div class="termination-item">
                <i class="pi pi-shield"></i>
                <span>Suspected fraudulent or illegal activity</span>
              </div>
              <div class="termination-item">
                <i class="pi pi-times-circle"></i>
                <span>Extended period of account inactivity</span>
              </div>
            </div>
            
            <p class="text-content">
              Upon termination, your right to use the service will cease immediately. 
              You may also terminate your account at any time by contacting us.
            </p>
          </div>
        </div>

        <!-- Governing Law -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Governing Law</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              These Terms shall be interpreted and governed by the laws of {{ contactState }}, {{ contactCountry }}, 
              without regard to its conflict of law provisions.
            </p>
            <p class="text-content">
              Any disputes arising from these Terms or your use of our services will be resolved through binding arbitration 
              in {{ contactCity }}, {{ contactState }}, rather than in court, 
              except that you may assert claims in small claims court if your claims qualify.
            </p>
          </div>
        </div>

        <!-- Changes to Terms -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Changes to Terms</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, 
              we will try to provide at least {{ dataResponseTime }} notice prior to any new terms taking effect.
            </p>
            <p class="text-content">
              What constitutes a material change will be determined at our sole discretion. 
              By continuing to access or use our services after those revisions become effective, 
              you agree to be bound by the revised terms.
            </p>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="section-title">Contact Us</h2>
          </div>
          <div class="card-content">
            <p class="text-content">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            
            <div class="contact-info">
              <div class="contact-item">
                <i class="pi pi-envelope"></i>
                <a :href="`mailto:${contactEmail}`" class="contact-link">{{ contactEmail }}</a>
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
                We will respond to your inquiries within {{ dataResponseTime }}.
              </p>
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
  title: `Terms of Service - ${getConfig('general.bandName')}`,
  meta: [
    { name: 'description', content: `Terms of Service for ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}). Please read our terms carefully before using our website and services.` },
    { name: 'keywords', content: `terms of service, ${getConfig('general.bandName')}, ${getConfig('general.fullBandName')}, user agreement, legal terms` },
    { property: 'og:title', content: `Terms of Service - ${getConfig('general.bandName')}` },
    { property: 'og:description', content: `Terms of Service for ${getConfig('general.fullBandName')} (${getConfig('general.bandName')}). Please read our terms carefully before using our website and services.` },
    { property: 'og:type', content: 'website' }
  ]
})

// Reactive data
const showBackToTop = ref(false)

// Computed properties for config values
const bandName = computed(() => getConfig('general.bandName'))
const fullBandName = computed(() => getConfig('general.fullBandName'))
const contactEmail = computed(() => getConfig('general.contact.email'))
const contactLocation = computed(() => getConfig('general.contact.location.full'))
const contactPhone = computed(() => getConfig('general.contact.phone'))
const contactPhoneNumber = computed(() => getConfig('general.contact.phoneNumber'))
const contactState = computed(() => getConfig('general.contact.location.state'))
const contactCountry = computed(() => getConfig('general.contact.location.country'))
const contactCity = computed(() => getConfig('general.contact.location.city'))
const dataResponseTime = computed(() => getConfig('general.legal.dataResponseTime'))

// Computed
const lastUpdated = computed(() => {
  return new Date(getConfig('general.legal.termsOfServiceLastUpdated')).toLocaleDateString('en-US', {
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

.content-card:hover {
  background: var(--glassmorphic-hover);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
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

.rights-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
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

.contact-link:hover {
  color: rgba(120, 119, 198, 1);
  text-decoration: underline;
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

.back-to-top:hover {
  background: var(--glassmorphic-hover);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
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
  
  .content-card:hover,
  .rights-item:hover,
  .back-to-top:hover {
    transform: none;
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
