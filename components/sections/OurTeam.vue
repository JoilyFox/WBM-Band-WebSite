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
          <SwiperSlide v-for="member in teamMembers" :key="member.id">
            <div class="member-card group">
              <div class="member-image-container">
                <img :src="member.image" :alt="member.name" class="member-image" loading="lazy" />
                <div class="member-overlay">
                  <div class="member-info">
                    <h4 class="member-name">{{ member.name }}</h4>
                    <p class="member-role">{{ member.role }}</p>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        <!-- Custom Navigation Buttons -->
        <div class="swiper-button-prev-custom">
          <i class="pi pi-chevron-left"></i>
        </div>
        <div class="swiper-button-next-custom">
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

  // Import Swiper styles
  import 'swiper/css'
  import 'swiper/css/navigation'

  // i18n global scope
  const { t } = useI18n({ useScope: 'global' })

  const modules = [Navigation]

  // Placeholder team data
  // Placeholder team data
  const { resolveUrl } = useAssetUrl()
  const teamMembers = computed(() => {
    return [
      {
        id: 1,
        name: 'Member 1',
        role: 'Vocals',
        image: '/images/optimized/about-us-images/DSC02185.avif'
      },
      {
        id: 2,
        name: 'Member 2',
        role: 'Guitar',
        image: '/images/optimized/about-us-images/DSC02209-2.avif'
      },
      {
        id: 3,
        name: 'Member 3',
        role: 'Bass',
        image: '/images/optimized/about-us-images/DSC02213-2.avif'
      },
      {
        id: 4,
        name: 'Member 4',
        role: 'Drums',
        image: '/images/optimized/about-us-images/DSC02256.avif'
      },
      {
        id: 5,
        name: 'Member 5',
        role: 'Keys',
        image: '/images/optimized/about-us-images/DSC02268.avif'
      },
      {
        id: 6,
        name: 'Member 6',
        role: 'Tech',
        image: '/images/optimized/about-us-images/DSC02277.avif'
      }
    ].map((member) => ({
      ...member,
      image: resolveUrl(member.image)
    }))
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

  .member-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    /* Ensure shadow doesn't cause scroll */
    margin: 0.5rem;
  }

  .member-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .member-image-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .member-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .member-card:hover .member-image {
    transform: scale(1.05);
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
  }

  .member-card:hover .member-overlay {
    opacity: 1;
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

  .member-card:hover .member-name,
  .member-card:hover .member-role {
    transform: translateY(0);
  }

  .swiper-button-prev-custom,
  .swiper-button-next-custom {
    @include swp.swiper-nav-button;
    position: absolute;
    top: calc(50% - 22px);
  }

  .slider-bleed-wrapper:hover .swiper-button-prev-custom,
  .slider-bleed-wrapper:hover .swiper-button-next-custom {
    opacity: 1;
  }
  .slider-bleed-wrapper:hover .swiper-button-prev-custom.swiper-button-disabled,
  .slider-bleed-wrapper:hover .swiper-button-next-custom.swiper-button-disabled {
    opacity: 0.2;
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

    .member-overlay {
      opacity: 1;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
    }

    .member-name,
    .member-role {
      transform: translateY(0);
    }
  }
</style>
