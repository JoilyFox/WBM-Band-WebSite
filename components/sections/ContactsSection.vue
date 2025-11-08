<template>
  <section id="contacts" class="contacts-bg-section relative overflow-hidden">
    <CommonContainer size="xl" padding="md">
      <!-- Header -->
      <div class="relative z-10 mt-20 mb-8 md:mb-10 text-center">
        <CommonSectionTitle :level="2" size="xl" align="center" class="mb-6">
          {{ t('contacts.section_title') }}
        </CommonSectionTitle>
        <CommonSectionSubtitle align="center" max-width="md" size="base">
          {{ t('contacts.section_subtitle') }}
        </CommonSectionSubtitle>
      </div>

      <div class="relative z-10 max-w-6xl mx-auto mb-4 md:mb-14">
        <div class="grid md:grid-cols-2 gap-y-2 gap-x-8 lg:gap-12">
          <!-- Left Side: Contact Form (order-2 on mobile, order-1 on desktop) -->
          <div class="contact-form-wrapper order-2 md:order-1 gap-y-4 flex flex-col">
            <div class="form-card">
              <h3 class="section-heading">
                {{ t('contacts.form_title') }}
              </h3>
              
              <form @submit.prevent="handleSubmit" class="space-y-5">
                <div class="form-group">
                  <label for="name" class="form-label">
                    {{ t('contacts.name_label') }}
                  </label>
                  <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    class="form-input"
                    :placeholder="t('contacts.name_placeholder')"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="email" class="form-label">
                    {{ t('contacts.email_label') }}
                  </label>
                  <input
                    id="email"
                    v-model="formData.email"
                    type="email"
                    class="form-input"
                    :placeholder="t('contacts.email_placeholder')"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="message" class="form-label">
                    {{ t('contacts.message_label') }}
                  </label>
                  <textarea
                    id="message"
                    v-model="formData.message"
                    rows="5"
                    class="form-input resize-none"
                    :placeholder="t('contacts.message_placeholder')"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  class="submit-button"
                  :disabled="isSubmitting"
                >
                  <span v-if="!isSubmitting">{{ t('contacts.submit_button') }}</span>
                  <span v-else>{{ t('contacts.sending_button') }}</span>
                </button>

                <!-- Success Message -->
                <div v-if="submitSuccess" class="form-message form-message-success">
                  <i class="pi pi-check-circle"></i>
                  <span>{{ t('contacts.success_message') }}</span>
                </div>

                <!-- Error Message -->
                <div v-if="submitError" class="form-message form-message-error">
                  <i class="pi pi-times-circle"></i>
                  <span>{{ t('contacts.error_message') }}</span>
                </div>
              </form>
            </div>

            <!-- Email Contact -->
            <a 
              :href="`mailto:${contactEmail}`" 
              class="info-card info-card-clickable"
            >
              <div class="info-card-content">
                <div class="info-icon">
                  <i class="pi pi-envelope"></i>
                </div>
                <div>
                  <p class="info-label">{{ t('contacts.email_us') }}</p>
                  <span class="info-link">
                    {{ contactEmail }}
                  </span>
                </div>
              </div>
            </a>
          </div>

          <!-- Right Side: Social Media & Info (order-1 on mobile, order-2 on desktop) -->
          <div class="social-info-wrapper order-1 md:order-2">
            <!-- Social Media Links -->
            <div class="social-links-section">
              <h3 class="section-heading">{{ t('contacts.follow_us') }}</h3>
              <div class="social-links-list">
                <a
                  v-for="social in socialLinks"
                  :key="social.name"
                  :href="social.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="social-link-item"
                  :style="{ '--brand-color': social.color }"
                >
                  <div class="social-icon-wrapper">
                    <i :class="social.icon"></i>
                  </div>
                  <div class="social-text">
                    <span class="social-name">{{ social.name }}</span>
                    <span class="social-handle">{{ social.handle }}</span>
                  </div>
                </a>
              </div>
            </div>

            <!-- Media Materials -->
            <div class="info-card media-card md:!pt-7">
              <h3 class="section-heading">{{ t('contacts.media_materials') }}</h3>
              <div class="media-buttons-container">
                <a 
                  v-for="mediaItem in mediaButtons"
                  :key="mediaItem.id"
                  :href="mediaItem.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="media-button"
                >
                  <div class="info-icon">
                    <i :class="mediaItem.icon"></i>
                  </div>
                  <span class="info-link">
                    {{ t(mediaItem.label) }}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommonContainer>

    <!-- Background Grain Layer -->
    <div class="grain-layer" aria-hidden="true"></div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getConfig } from '~/utils/configHelpers'

const { t } = useI18n({ useScope: 'global' })

const contactEmail = computed(() => getConfig('general.contact.email'))

// Get social media links from config
const configSocialMedia = computed(() => ({
  instagram: getConfig('general.socialMedia.instagram'),
  tiktok: getConfig('general.socialMedia.tiktok'),
  youtube: getConfig('general.socialMedia.youtube')
}))

const configSocialHandles = computed(() => ({
  instagram: getConfig('general.socialHandles.instagram'),
  tiktok: getConfig('general.socialHandles.tiktok'),
  youtube: getConfig('general.socialHandles.youtube')
}))

const socialLinks = computed(() => {
  const links = []
  
  if (configSocialMedia.value.instagram) {
    links.push({
      name: 'Instagram',
      handle: configSocialHandles.value.instagram || '@wbmband',
      url: configSocialMedia.value.instagram,
      icon: 'pi pi-instagram',
      color: 'rgba(225, 48, 108, 0.4)' // Instagram gradient pink
    })
  }
  
  if (configSocialMedia.value.tiktok) {
    links.push({
      name: 'TikTok',
      handle: configSocialHandles.value.tiktok || '@wbmband',
      url: configSocialMedia.value.tiktok,
      icon: 'pi pi-tiktok',
      color: 'rgba(0, 242, 234, 0.4)' // TikTok cyan
    })
  }
  
  if (configSocialMedia.value.youtube) {
    links.push({
      name: 'YouTube',
      handle: configSocialHandles.value.youtube || '@WBMBand',
      url: configSocialMedia.value.youtube,
      icon: 'pi pi-youtube',
      color: 'rgba(255, 0, 0, 0.4)' // YouTube red
    })
  }
  
  return links
})

// Media materials buttons
const mediaButtons = [
  // {
  //   id: 'press-kit',
  //   label: 'contacts.download_press_kit',
  //   url: 'https://docs.google.com/document/d/1BevwPXBAW2BBHeWpxRouOsJwR-CQCx2F/edit?usp=drive_link&ouid=102349361282053889906&rtpof=true&sd=true',
  //   icon: 'pi pi-file-pdf'
  // },
  {
    id: 'media-materials',
    label: 'contacts.media_materials_button',
    url: 'https://drive.google.com/drive/folders/1qXD2N1WQe2JMUt2SUpkgJrOaOF1qSddY?usp=drive_link',
    icon: 'pi pi-images'
  }
]

const formData = reactive({
  name: '',
  email: '',
  message: ''
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref(false)

const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  isSubmitting.value = true
  submitSuccess.value = false
  submitError.value = false
  
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: getConfig('general.web3formsApiKey'), // We'll add this to config
        name: formData.name,
        email: formData.email,
        message: formData.message,
        subject: `New Contact Form Submission from ${formData.name}`
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      submitSuccess.value = true
      // Reset form
      formData.name = ''
      formData.email = ''
      formData.message = ''
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        submitSuccess.value = false
      }, 5000)
    } else {
      submitError.value = true
      setTimeout(() => {
        submitError.value = false
      }, 5000)
    }
  } catch (error) {
    console.error('Form submission error:', error)
    submitError.value = true
    setTimeout(() => {
      submitError.value = false
    }, 5000)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
/* Background styles similar to other sections */
.contacts-bg-section {
  min-height: 85vh;
  display: block;
  position: relative;
  isolation: isolate;
  background:
    linear-gradient(to bottom,
      rgba(38,38,42,0.50) 0%,
      rgba(32,32,35,0.58) 280px,
      rgba(24,24,26,0.68) 480px,
      rgba(16,16,17,0.78) 680px,
      rgba(8,8,9,0.88) 880px,
      rgba(0,0,0,0.95) 100%), /* reversed vertical fade - lighter to darker */
    linear-gradient(140deg, rgba(14,14,15,0.95) 0%, rgba(18,18,20,0.85) 40%, rgba(24,24,26,0.78) 75%, rgba(30,30,32,0.72) 100%),
    radial-gradient(circle at 24% 30%, rgba(255,255,255,0.07), transparent 62%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.055), transparent 68%),
    #070707;
  background-blend-mode: normal, overlay, overlay, overlay, normal;
  overflow: hidden;
}

.contacts-bg-section::before {
  content: '';
  position: absolute;
  top: -160px;
  left: 0;
  right: 0;
  height: 160px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.97));
  pointer-events: none;
  z-index: -1;
}

.grain-layer {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.028'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: overlay;
  z-index: 1;
}

/* Form Card */
.form-card {
  background: 
    linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%),
    linear-gradient(225deg, rgba(147, 51, 234, 0.03) 0%, transparent 60%);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 1.5rem;
  padding-top: 1.75rem;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.form-card:hover {
  border-color: rgba(255,255,255,0.15);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  color: rgba(255,255,255,0.9);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 0.875rem 1.25rem;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-input::placeholder {
  color: rgba(255,255,255,0.4);
}

.form-input:focus {
  background: rgba(0,0,0,0.4);
  border-color: rgba(255,255,255,0.3);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
}

.submit-button {
  width: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 1rem 2rem;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .submit-button:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%);
    border-color: rgba(255,255,255,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

/* Mobile and touch device active effects */
@media (hover: none) and (pointer: coarse) {
  .submit-button:active:not(:disabled) {
    background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%);
    border-color: rgba(255,255,255,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    transition-duration: 0.15s;
  }
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Form Messages */
.form-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-message-success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: rgb(134, 239, 172);
}

.form-message-success i {
  color: rgb(74, 222, 128);
  font-size: 1.25rem;
}

.form-message-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgb(252, 165, 165);
}

.form-message-error i {
  color: rgb(248, 113, 113);
  font-size: 1.25rem;
}

/* Social Links Section */
.section-heading {
  color: rgba(255,255,255,0.95);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: relative;
  padding-bottom: 0.75rem;
}

.section-heading::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 280px;
  max-width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1), transparent);
  border-radius: 2px;
}

.social-links-section {
  background: 
    linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%),
    linear-gradient(180deg, rgba(147, 51, 234, 0.02) 0%, transparent 100%);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 1.5rem;
  padding-top: 1.75rem;
  backdrop-filter: blur(20px);
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.social-links-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.04) 0%, transparent 70%);
  pointer-events: none;
}

.social-links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.social-link-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem;
  background: 
    linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%),
    rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.social-link-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--brand-color, rgba(147, 51, 234, 0.15)), transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .social-link-item:hover {
    background: 
      linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%),
      rgba(0,0,0,0.3);
    border-color: rgba(255,255,255,0.2);
    transform: translateX(6px);
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .social-link-item:hover::before {
    opacity: 1;
  }

  .social-link-item:hover .social-icon-wrapper {
    background: var(--brand-color, linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(79, 70, 229, 0.3)));
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 
      0 8px 20px var(--brand-color, rgba(147, 51, 234, 0.4)),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .social-link-item:hover .social-handle {
    color: rgba(255,255,255,0.8);
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .social-link-item:active {
    background: 
      linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%),
      rgba(0,0,0,0.3);
    border-color: rgba(255,255,255,0.2);
    transform: translateX(6px);
    transition-duration: 0.15s;
  }

  .social-link-item:active::before {
    opacity: 1;
  }

  .social-link-item:active .social-icon-wrapper {
    background: var(--brand-color, linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(79, 70, 229, 0.3)));
    transform: scale(1.1) rotate(-5deg);
    transition-duration: 0.15s;
  }

  .social-link-item:active .social-handle {
    color: rgba(255,255,255,0.8);
  }
}

.social-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: 
    linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.social-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: relative;
  z-index: 1;
}

.social-name {
  color: white;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.social-handle {
  color: rgba(255,255,255,0.6);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: color 0.25s ease;
}

/* Info Cards */
.info-card {
  background: 
    linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%),
    rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.info-card-clickable {
  display: block;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-card-clickable::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
}

/* Desktop hover effects only for clickable cards */
@media (hover: hover) and (pointer: fine) {
  .info-card-clickable:hover {
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-2px);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .info-card-clickable:hover::before {
    opacity: 1;
  }

  .info-card-clickable:hover .info-icon {
    transform: scale(1.08);
    box-shadow: 
      0 6px 16px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

/* Mobile and touch device specific styles for clickable cards */
@media (hover: none) and (pointer: coarse) {
  .info-card-clickable:active {
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-2px);
    transition-duration: 0.15s;
  }

  .info-card-clickable:active::before {
    opacity: 1;
  }

  .info-card-clickable:active .info-icon {
    transform: scale(1.08);
    transition-duration: 0.15s;
  }
}

.info-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.125rem;
  flex-shrink: 0;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.25s ease;
}

.info-label {
  color: rgba(255,255,255,0.65);
  font-size: 0.75rem;
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.info-link {
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s ease;
  display: block;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: none; /* Prevent nested link behavior */
}

.media-card {
  display: flex;
  flex-direction: column;
}

.media-card .section-heading {
  margin-bottom: 1rem;
}

.media-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.media-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: 
    linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%),
    rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 1rem;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.media-button .info-link {
  pointer-events: auto;
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .media-button:hover {
    background: 
      linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%),
      rgba(0,0,0,0.3);
    border-color: rgba(255,255,255,0.2);
    transform: translateX(4px);
    box-shadow: 
      0 6px 24px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .media-button:hover .info-icon {
    transform: scale(1.05);
    box-shadow: 
      0 6px 18px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
}

/* Mobile and touch device specific styles */
@media (hover: none) and (pointer: coarse) {
  .media-button:active {
    background: 
      linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%),
      rgba(0,0,0,0.3);
    border-color: rgba(255,255,255,0.2);
    transform: translateX(4px);
    transition-duration: 0.15s;
  }

  .media-button:active .info-icon {
    transform: scale(1.05);
    transition-duration: 0.15s;
  }
}

/* Remove old styles */
.social-cards-grid,
.social-card,
.social-icon,
.social-info,
.email-card,
.email-icon,
.email-link {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .form-card {
    padding: 1.5rem;
  }

  .social-links-section,
  .info-card {
    padding: 1.25rem;
  }

  .social-link-item {
    padding: 0.625rem;
  }

  .social-icon-wrapper,
  .info-icon {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .grain-layer { animation: none; }
  
  .social-link-item,
  .info-card,
  .form-card,
  .submit-button,
  .social-icon-wrapper,
  .info-icon,
  .info-link,
  .social-handle,
  .social-link-item::before,
  .info-card::before {
    transition: none;
  }
  
  .social-link-item:hover,
  .social-link-item:active,
  .info-card:hover,
  .info-card:active,
  .info-link:hover,
  .info-link:active,
  .social-icon-wrapper,
  .info-icon {
    transform: none;
  }
}

</style>
