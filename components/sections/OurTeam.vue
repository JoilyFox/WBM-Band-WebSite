<template>
  <section id="our-team" class="relative overflow-hidden">
    <CommonContainer size="xl" padding="md" :overflow-visible="true">
      <!-- Header -->
      <div class="relative z-10 max-md:mt-4 text-center">
        <CommonSmallSectionTitle :level="3" align="center">
          {{ t('team.section_title') }}
        </CommonSmallSectionTitle>
      </div>

      <!-- Team Members Slider -->
      <div class="relative z-10 slider-bleed-wrapper">
        <Swiper
          :modules="modules"
          :slides-per-view="2"
          :space-between="12"
          :centered-slides="shouldCenterSlides"
          :navigation="{
            prevEl: '.swiper-button-prev-custom',
            nextEl: '.swiper-button-next-custom'
          }"
          :breakpoints="{
            0: {
              slidesPerView: 2,
              spaceBetween: -2
            },
            640: {
              slidesPerView: 3,
              spaceBetween: 10
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 20
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 10
            },
            1580: {
              slidesPerView: 5,
              spaceBetween: 24
            }
          }"
          class="team-swiper"
        >
          <SwiperSlide v-for="(member, index) in teamMembers" :key="member.id">
            <TeamMemberCard
              :ref="
                (el: any) => {
                  if (el) memberCardRefs[index] = el as TeamMemberCardInstance
                }
              "
              :member="member"
              :index="index"
              :initial-image="member.image"
              :data-index="index"
              class="team-card-animate"
            />
          </SwiperSlide>
        </Swiper>

        <!-- Custom Navigation Buttons (only show if slider is needed) -->
        <div v-if="showNavigation" class="swiper-button-prev-custom">
          <i class="pi pi-chevron-left"></i>
        </div>
        <div v-if="showNavigation" class="swiper-button-next-custom">
          <i class="pi pi-chevron-right"></i>
        </div>
      </div>
    </CommonContainer>
  </section>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { Swiper, SwiperSlide } from 'swiper/vue'
  import { Navigation } from 'swiper/modules'
  import CommonContainer from '~/components/common/Container.vue'
  import CommonSmallSectionTitle from '~/components/common/SmallSectionTitle.vue'
  import TeamMemberCard from '~/components/team/TeamMemberCard.vue'
  import { teamMembers as teamMembersData } from '~/data/teamMembers'
  import {
    useAutoRotationControl,
    type TeamMemberCardInstance
  } from '~/composables/useAutoRotationControl'

  // Import Swiper styles
  import 'swiper/css'
  import 'swiper/css/navigation'

  // i18n global scope
  const { t } = useI18n({ useScope: 'global' })

  const modules = [Navigation]
  const { resolveUrl } = useAssetUrl()

  // Refs for member card components with proper typing
  const memberCardRefs = ref<TeamMemberCardInstance[]>([])
  const sectionRef = ref<HTMLElement | null>(null)

  /**
   * Helper function to get the first image from array or return single image
   */
  const getFirstImage = (images: string | string[]): string => {
    return Array.isArray(images) ? images[0] : images
  }

  // Process team members with resolved URLs and first image selection
  const teamMembers = computed(() => {
    return teamMembersData.map((member) => ({
      ...member,
      image: resolveUrl(getFirstImage(member.mainImages))
    }))
  })

  // Determine if we should center slides (when there are few items)
  const shouldCenterSlides = computed(() => {
    return teamMembers.value.length <= 3
  })

  // Determine if navigation buttons should be shown
  const showNavigation = computed(() => {
    return teamMembers.value.length > 5
  })

  // Use auto-rotation control composable
  const { setupObserver } = useAutoRotationControl(sectionRef, memberCardRefs)

  /**
   * Setup animation observer for scroll-based fade-in effects
   */
  const setupAnimationObserver = () => {
    if (!import.meta.client) return

    const cards = document.querySelectorAll('.team-card-animate')
    if (!cards.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    cards.forEach((card) => observer.observe(card))
  }

  // Lifecycle hooks
  onMounted(() => {
    sectionRef.value = document.getElementById('our-team')
    setupObserver()
    // Small delay to ensure DOM is ready
    setTimeout(() => setupAnimationObserver(), 100)
  })
</script>

<style scoped lang="scss">
  @use '~/assets/css/components/swiper-navigation.scss' as swp;

  /* 
    Full-bleed slider logic:
    1. Negative margins on wrapper to pull to screen edges
    2. Padding on Swiper to align first/last items with container grid
  */
  .slider-bleed-wrapper {
    /* Mobile: px-4 (1rem) container padding */
    margin-left: -1rem;
    margin-right: -1rem;
    width: calc(100% + 2rem);
  }

  .team-swiper {
    /* Compensate for negative margins */
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 1rem;
  }

  @media (min-width: 640px) {
    .slider-bleed-wrapper {
      /* sm: px-6 (1.5rem) */
      margin-left: -1.5rem;
      margin-right: -1.5rem;
      width: calc(100% + 3rem);
    }
    .team-swiper {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .slider-bleed-wrapper {
      /* lg: px-8 (2rem) */
      margin-left: -2rem;
      margin-right: -2rem;
      width: calc(100% + 4rem);
    }
    .team-swiper {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  }

  .swiper-button-prev-custom,
  .swiper-button-next-custom {
    @include swp.swiper-nav-button;
    position: absolute;
    top: calc(50% - 22px);
  }

  /* Navigation button hover effects only for devices with hover capability */
  @media (hover: hover) and (pointer: fine) {
    .slider-bleed-wrapper:hover .swiper-button-prev-custom,
    .slider-bleed-wrapper:hover .swiper-button-next-custom {
      opacity: 1;
    }
    .slider-bleed-wrapper:hover .swiper-button-prev-custom.swiper-button-disabled,
    .slider-bleed-wrapper:hover .swiper-button-next-custom.swiper-button-disabled {
      opacity: 0.2;
    }
  }

  /* For touchscreen devices, always show navigation buttons (when visible) */
  @media (hover: none) and (pointer: coarse) {
    .swiper-button-prev-custom,
    .swiper-button-next-custom {
      opacity: 0.7;
    }
    .swiper-button-prev-custom.swiper-button-disabled,
    .swiper-button-next-custom.swiper-button-disabled {
      opacity: 0.2;
    }
  }

  .swiper-button-prev-custom {
    left: 1rem;
  }

  .swiper-button-next-custom {
    right: 1rem;
  }

  @media (min-width: 640px) {
    .swiper-button-prev-custom {
      left: 1.5rem;
    }
    .swiper-button-next-custom {
      right: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .swiper-button-prev-custom {
      left: 2rem;
    }
    .swiper-button-next-custom {
      right: 2rem;
    }
  }

  @media (max-width: 768px) {
    .swiper-button-prev-custom,
    .swiper-button-next-custom {
      display: none;
    }
  }

  /* Scroll animations for team cards */
  .team-card-animate {
    opacity: 0;
    transform: translateY(15px);
    transition:
      opacity 0.6s ease,
      transform 0.6s ease;

    &.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* Staggered animation delays based on index */
    @for $i from 0 through 10 {
      &[data-index='#{$i}'] {
        transition-delay: #{$i * 0.1}s;
      }
    }
  }
</style>
