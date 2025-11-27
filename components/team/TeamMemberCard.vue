<template>
  <div class="team-member-card" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div class="member-image-container">
      <!-- Current visible image -->
      <img
        :src="currentImage"
        :alt="$t(member.nameKey)"
        class="member-image image-visible"
        loading="lazy"
      />
      <!-- Next image for crossfade transition -->
      <img
        v-if="nextImage"
        :src="nextImage"
        :alt="$t(member.nameKey)"
        class="member-image member-image-next"
        :class="{ 'image-visible': isTransitioning }"
        loading="lazy"
      />
      <div class="member-overlay">
        <div class="member-info">
          <h3 class="member-name">{{ $t(member.nameKey) }}</h3>
          <p class="member-role">{{ $t(member.roleKey) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import type { TeamMember } from '~/data/teamMembers'
  import {
    HOVER_DEBOUNCE_MS,
    TRANSITION_DURATION_MS,
    AUTO_ROTATION_INTERVAL_MS
  } from '~/constants/teamConfig'

  interface Props {
    member: TeamMember
    index: number
    initialImage: string
  }

  const props = defineProps<Props>()
  const { resolveUrl } = useAssetUrl()

  // Configuration
  const TRANSITION_DURATION = TRANSITION_DURATION_MS

  // State
  const currentImage = ref(props.initialImage)
  const baseMainImage = ref(props.initialImage) // Track the main image to return to
  const nextImage = ref<string | null>(null)
  const isTransitioning = ref(false)
  const lastHoverImage = ref<string | null>(null)
  const isMobile = ref(false)
  const autoRotationTimer = ref<NodeJS.Timeout | null>(null)
  const debounceTimer = ref<NodeJS.Timeout | null>(null)
  const isHovering = ref(false)

  // Computed CSS value for transition duration
  const transitionDurationCss = computed(() => `${TRANSITION_DURATION}ms`)

  /**
   * Helper to select random image, avoiding the excluded one if possible
   */
  const selectRandomImage = (images: string | string[], excludeImage?: string): string => {
    if (Array.isArray(images)) {
      if (images.length > 1 && excludeImage) {
        const filtered = images.filter((img) => img !== excludeImage)
        if (filtered.length > 0) {
          const randomIndex = Math.floor(Math.random() * filtered.length)
          return filtered[randomIndex]
        }
      }
      const randomIndex = Math.floor(Math.random() * images.length)
      return images[randomIndex]
    }
    return images
  }

  /**
   * Change image with crossfade
   */
  const changeImage = async (newImage: string) => {
    if (currentImage.value === newImage) {
      return
    }

    nextImage.value = newImage

    // Wait for DOM to update so the new image is rendered with opacity 0
    await nextTick()

    // Use double requestAnimationFrame to ensure browser paints the initial state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isTransitioning.value = true
      })
    })

    setTimeout(() => {
      currentImage.value = newImage
      nextImage.value = null
      isTransitioning.value = false
    }, TRANSITION_DURATION)
  }

  /**
   * Handle mouse enter with debounce
   */
  const handleMouseEnter = () => {
    if (isMobile.value) {
      return
    }

    // Prevent repeated calls if already hovering
    if (isHovering.value) {
      return
    }

    // Clear any existing debounce timer
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }

    // Start debounce timer
    debounceTimer.value = setTimeout(() => {
      isHovering.value = true

      // Stop any auto-rotation
      if (autoRotationTimer.value) {
        clearInterval(autoRotationTimer.value)
        autoRotationTimer.value = null
      }

      if (!props.member.hoverImages) {
        return
      }

      const hoverImage = resolveUrl(
        selectRandomImage(props.member.hoverImages, lastHoverImage.value || undefined)
      )

      lastHoverImage.value = hoverImage
      changeImage(hoverImage)
    }, HOVER_DEBOUNCE_MS)
  }

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = () => {
    if (isMobile.value) {
      return
    }

    // Clear debounce timer if mouse leaves before debounce completes
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = null
    }

    // Only return to base image if we actually started hovering
    if (isHovering.value) {
      isHovering.value = false
      changeImage(baseMainImage.value)
    }
  }

  /**
   * Start auto-rotation for mobile
   */
  const startAutoRotation = (delay: number) => {
    if (!isMobile.value) {
      return
    }

    setTimeout(() => {
      const mainImages = Array.isArray(props.member.mainImages)
        ? props.member.mainImages
        : [props.member.mainImages]
      const hoverImages = props.member.hoverImages
        ? Array.isArray(props.member.hoverImages)
          ? props.member.hoverImages
          : [props.member.hoverImages]
        : []

      const allImages = [...mainImages, ...hoverImages].map((img) => resolveUrl(img))

      if (allImages.length <= 1) {
        return
      }

      let currentIndex = 0

      autoRotationTimer.value = setInterval(() => {
        if (isHovering.value) {
          return
        }

        currentIndex = (currentIndex + 1) % allImages.length
        changeImage(allImages[currentIndex])
      }, AUTO_ROTATION_INTERVAL_MS)
    }, delay)
  }

  /**
   * Detect mobile device
   */
  const detectMobile = () => {
    if (!import.meta.client) return
    isMobile.value = window.matchMedia('(hover: none) and (pointer: coarse)').matches
  }

  onMounted(() => {
    detectMobile()

    // Randomize initial image on client side (if not mobile, as mobile rotates anyway)
    // This avoids hydration mismatch by letting server/client init with same image (index 0)
    // and then randomizing after mount
    if (
      !isMobile.value &&
      Array.isArray(props.member.mainImages) &&
      props.member.mainImages.length > 1
    ) {
      const randomMain = selectRandomImage(props.member.mainImages)
      const resolvedRandom = resolveUrl(randomMain)

      if (resolvedRandom !== currentImage.value) {
        currentImage.value = resolvedRandom
        baseMainImage.value = resolvedRandom // Update base image
      }
    }
  })

  onBeforeUnmount(() => {
    if (autoRotationTimer.value) {
      clearInterval(autoRotationTimer.value)
    }
  })

  /**
   * Pause auto-rotation (when section leaves viewport)
   */
  const pauseAutoRotation = () => {
    if (autoRotationTimer.value) {
      clearInterval(autoRotationTimer.value)
      autoRotationTimer.value = null
    }
  }

  /**
   * Resume auto-rotation (when section re-enters viewport)
   */
  const resumeAutoRotation = () => {
    if (!isMobile.value) {
      return
    }

    // Restart auto-rotation immediately without delay
    startAutoRotation(0)
  }

  // Expose methods for parent to control auto-rotation
  defineExpose({
    startAutoRotation,
    pauseAutoRotation,
    resumeAutoRotation
  })
</script>

<style scoped lang="scss">
  .team-member-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    margin: 0.5rem;
  }

  /* Hover effects only for devices with hover capability (desktop) */
  @media (hover: hover) and (pointer: fine) {
    .team-member-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .team-member-card:hover .member-overlay {
      opacity: 1;
    }

    .team-member-card:hover .member-name,
    .team-member-card:hover .member-role {
      transform: translateY(0);
    }
  }

  /* Active/tap effects for touchscreen devices */
  @media (hover: none) and (pointer: coarse) {
    .team-member-card:active {
      transform: scale(0.98);
      transition-duration: 0.15s;
    }

    /* Make overlay always visible on mobile */
    .member-overlay {
      opacity: 1;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.2) 60%,
        transparent 100%
      );
    }

    .member-name,
    .member-role {
      transform: translateY(0);
    }
  }

  /* Fallback: Always show overlay on smaller screens regardless of input type */
  /* Fallback: Always show overlay on smaller screens regardless of input type */
  @media (max-width: 1024px) {
    .member-overlay {
      opacity: 1 !important;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.2) 60%,
        transparent 100%
      ) !important;
    }

    .member-name,
    .member-role {
      transform: translateY(0) !important;
    }
  }

  .member-image-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .member-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity v-bind(transitionDurationCss) ease;
    opacity: 0;
  }

  .member-image.image-visible {
    opacity: 1;
    z-index: 1;
  }

  .member-image-next {
    z-index: 2;
  }

  .member-image-next.image-visible {
    opacity: 1;
  }

  .member-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.9) 0%,
      rgba(0, 0, 0, 0.4) 50%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 1.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
  }

  .member-name {
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    transform: translateY(10px);
    transition: transform 0.3s ease 0.1s;
  }

  .member-role {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    font-weight: 500;
    transform: translateY(10px);
    transition: transform 0.3s ease 0.2s;
  }
</style>
