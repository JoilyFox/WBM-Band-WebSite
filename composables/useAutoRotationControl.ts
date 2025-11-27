import { ref, type Ref } from 'vue'
import { AUTO_ROTATION_STAGGER_MS, VIEWPORT_THRESHOLD } from '~/constants/teamConfig'

/**
 * Type for TeamMemberCard component instance
 */
export interface TeamMemberCardInstance {
  startAutoRotation: (delay: number) => void
  pauseAutoRotation: () => void
  resumeAutoRotation: () => void
}

/**
 * Composable for controlling auto-rotation based on viewport visibility
 *
 * @param sectionRef - Reference to the section element to observe
 * @param cardRefs - References to team member card components
 * @returns Object with isInViewport state and setupObserver function
 */
export function useAutoRotationControl(
  sectionRef: Ref<HTMLElement | null>,
  cardRefs: Ref<TeamMemberCardInstance[]>
) {
  const isInViewport = ref(false)

  /**
   * Start auto-rotation for all cards with staggered delays
   */
  const startRotation = () => {
    cardRefs.value.forEach((cardRef, index) => {
      if (cardRef && cardRef.startAutoRotation) {
        const delay = index * AUTO_ROTATION_STAGGER_MS
        cardRef.startAutoRotation(delay)
      }
    })
  }

  /**
   * Pause auto-rotation for all cards
   */
  const pauseRotation = () => {
    cardRefs.value.forEach((cardRef) => {
      if (cardRef && cardRef.pauseAutoRotation) {
        cardRef.pauseAutoRotation()
      }
    })
  }

  /**
   * Resume auto-rotation for all cards
   */
  const resumeRotation = () => {
    cardRefs.value.forEach((cardRef) => {
      if (cardRef && cardRef.resumeAutoRotation) {
        cardRef.resumeAutoRotation()
      }
    })
  }

  /**
   * Setup intersection observer to control auto-rotation based on viewport visibility
   */
  const setupObserver = () => {
    if (!import.meta.client || !sectionRef.value) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section entered viewport
            if (!isInViewport.value) {
              isInViewport.value = true
              startRotation()
            } else {
              // Section re-entered viewport, resume auto-rotation
              resumeRotation()
            }
          } else {
            // Section left viewport, pause auto-rotation
            pauseRotation()
          }
        })
      },
      { threshold: VIEWPORT_THRESHOLD }
    )

    observer.observe(sectionRef.value)
  }

  return {
    isInViewport,
    setupObserver
  }
}
