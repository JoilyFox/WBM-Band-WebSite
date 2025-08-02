<template>
  <div class="error-page">
    <!-- Animated Background Elements -->
    <div class="bg-elements">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>

    <!-- Main Error Container -->
    <div class="error-container">
      <!-- Error Code Display -->
      <div class="error-code">
        <span class="code-number">{{ errorCode }}</span>
        <div class="glitch-effect" :data-text="errorCode">{{ errorCode }}</div>
      </div>
      
      <!-- Error Content -->
      <div class="error-content">
        <h1 class="error-title">{{ title }}</h1>
        <div class="error-divider"></div>
        <p class="error-message">{{ message }}</p>
        
        <!-- Action Button -->
        <button 
          @click="handleButtonClick"
          class="error-button"
          type="button"
        >
          <span class="button-bg"></span>
          <span class="button-content">
            <i v-if="buttonIcon" :class="buttonIcon" class="button-icon"></i>
            <span class="button-text">{{ buttonText }}</span>
          </span>
          <div class="button-ripple"></div>
        </button>
        
        <!-- Additional Info -->
        <div class="error-info">
          <p class="info-text">
            <i class="pi pi-info-circle"></i>
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>

    <!-- Decorative Grid -->
    <div class="grid-overlay"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  buttonText?: string
  buttonLink?: string
  buttonIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Oops! Something went wrong',
  message: 'We encountered an unexpected error. Please try again or return to the homepage.',
  buttonText: 'Go to Home',
  buttonLink: '/',
  buttonIcon: 'pi pi-home'
})

// Use router with proper error handling for SSR
const router = process.client ? useRouter() : null

// Get the current route
const route = useRoute()

// Handle query parameters for custom error messages
const title = computed(() => {
  if (route?.query?.title) {
    return route.query.title as string
  }
  return props.title
})

const message = computed(() => {
  if (route?.query?.message) {
    return route.query.message as string
  }
  return props.message
})

const buttonText = computed(() => {
  if (route?.query?.buttonText) {
    return route.query.buttonText as string
  }
  return props.buttonText
})

const buttonLink = computed(() => {
  if (route?.query?.buttonLink) {
    return route.query.buttonLink as string
  }
  return props.buttonLink
})

const buttonIcon = computed(() => {
  if (route?.query?.buttonIcon) {
    return route.query.buttonIcon as string
  }
  return props.buttonIcon
})

// Determine error code based on title or URL
const errorCode = computed(() => {
  const titleValue = title.value.toLowerCase()
  const routePath = route ? route.path : ''
  
  if (titleValue.includes('not found') || routePath === '/404') {
    return '404'
  }
  if (titleValue.includes('server error')) {
    return '500'
  }
  if (titleValue.includes('access denied')) {
    return '403'
  }
  return 'ERR'
})

const handleButtonClick = () => {
  if (process.client && router) {
    const link = buttonLink.value
    
    // Handle special case for music section scrolling
    if (link === '/#music') {
      // Navigate to home page and then scroll to music section
      router.push('/').then(() => {
        // Use a small delay to ensure the page has loaded
        setTimeout(() => {
          const musicElement = document.getElementById('music')
          if (musicElement) {
            musicElement.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            })
          }
        }, 100)
      })
    } else {
      router.push(link)
    }
  } else {
    // Fallback for SSR - use window location
    if (process.client) {
      window.location.href = buttonLink.value
    }
  }
}
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

// Animated Background Elements
.bg-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
  
  &.shape-1 {
    width: 100px;
    height: 100px;
    top: 10%;
    left: 10%;
    border-radius: 50%;
    animation-delay: 0s;
  }
  
  &.shape-2 {
    width: 80px;
    height: 80px;
    top: 20%;
    right: 15%;
    transform: rotate(45deg);
    animation-delay: 1s;
  }
  
  &.shape-3 {
    width: 120px;
    height: 60px;
    bottom: 15%;
    left: 20%;
    border-radius: 30px;
    animation-delay: 2s;
  }
  
  &.shape-4 {
    width: 60px;
    height: 60px;
    bottom: 25%;
    right: 10%;
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    animation-delay: 3s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

// Grid Overlay
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 1;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

// Main Container
.error-container {
  background: rgba(15, 15, 15, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
  position: relative;
  z-index: 10;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

// Error Code Display
.error-code {
  position: relative;
  margin-bottom: 2rem;
}

.code-number {
  font-size: 8rem;
  font-weight: 900;
  color: transparent;
  background: linear-gradient(45deg, #ffffff, #888888);
  background-clip: text;
  -webkit-background-clip: text;
  line-height: 1;
  position: relative;
  z-index: 2;
}

.glitch-effect {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8rem;
  font-weight: 900;
  color: #ff0080;
  opacity: 0.3;
  animation: glitch 2s infinite;
  z-index: 1;
}

@keyframes glitch {
  0%, 100% {
    transform: translateX(-50%);
    filter: hue-rotate(0deg);
  }
  20% {
    transform: translateX(-50%) translateX(-5px);
    filter: hue-rotate(90deg);
  }
  40% {
    transform: translateX(-50%) translateX(5px);
    filter: hue-rotate(180deg);
  }
  60% {
    transform: translateX(-50%) translateX(-3px);
    filter: hue-rotate(270deg);
  }
  80% {
    transform: translateX(-50%) translateX(3px);
    filter: hue-rotate(360deg);
  }
}

// Content Styling
.error-content {
  > * + * {
    margin-top: 1.5rem;
  }
}

.error-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.error-divider {
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ffffff, transparent);
  margin: 0 auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 4px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  }
}

.error-message {
  color: #cccccc;
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
}

// Button Styling
.error-button {
  position: relative;
  padding: 1rem 2rem;
  border: 2px solid #ffffff;
  border-radius: 50px;
  background: transparent;
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  margin-top: 2rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
    
    .button-bg {
      transform: scale(1);
      opacity: 1;
    }
    
    .button-content {
      color: #000000;
    }
  }
  
  &:active {
    transform: translateY(0);
    
    .button-ripple {
      animation: ripple 0.6s ease-out;
    }
  }
}

.button-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 50px;
  transform: scale(0);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1;
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
}

.button-icon {
  font-size: 1.2rem;
}

.button-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}

@keyframes ripple {
  to {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

// Additional Info
.error-info {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.info-text {
  color: #888888;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  i {
    opacity: 0.7;
  }
}

// Mobile Responsiveness
@media (max-width: 768px) {
  .error-page {
    padding: 1rem;
  }
  
  .error-container {
    padding: 2rem 1.5rem;
  }
  
  .code-number, .glitch-effect {
    font-size: 5rem;
  }
  
  .error-title {
    font-size: 1.875rem;
  }
  
  .error-message {
    font-size: 1rem;
  }
  
  .floating-shape {
    display: none; // Hide floating shapes on mobile for better performance
  }
}

@media (max-width: 480px) {
  .code-number, .glitch-effect {
    font-size: 4rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .error-button {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
  }
}

// Reduced motion accessibility
@media (prefers-reduced-motion: reduce) {
  .floating-shape,
  .grid-overlay,
  .glitch-effect {
    animation: none;
  }
  
  .error-button:hover {
    transform: none;
  }
}
</style>
