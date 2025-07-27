<template>
  <section class="test-section py-24 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
          {{ title }}
        </h2>
        <p class="text-xl text-gray-300 max-w-2xl mx-auto">
          {{ description }}
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          v-for="item in items" 
          :key="item.id"
          class="test-card p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
        >
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
            <i :class="item.icon" class="text-2xl text-white"></i>
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">{{ item.title }}</h3>
          <p class="text-gray-300">{{ item.content }}</p>
        </div>
      </div>
      
      <!-- Extra content for scrolling -->
      <div class="mt-16 space-y-8">
        <div v-for="i in 5" :key="`extra-${i}`" class="text-center">
          <h3 class="text-2xl font-bold text-white mb-4">Section {{ i }}</h3>
          <p class="text-gray-300 max-w-3xl mx-auto">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute 
            irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla 
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
            deserunt mollit anim id est laborum.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Props
interface Props {
  title?: string
  description?: string
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Test Scroll Section',
  description: 'This is a test section to demonstrate the scroll-based logo animation. Scroll down to see the logo shrink and navigation spacing adjust.',
  backgroundColor: 'bg-gradient-to-b from-gray-900 to-gray-800'
})

// Test data
const items = ref([
  {
    id: 1,
    icon: 'pi pi-music',
    title: 'Music',
    content: 'Discover our latest tracks and albums with high-energy rock performances.'
  },
  {
    id: 2,
    icon: 'pi pi-calendar',
    title: 'Tour Dates',
    content: 'Check out our upcoming concerts and live performances near you.'
  },
  {
    id: 3,
    icon: 'pi pi-users',
    title: 'Band Members',
    content: 'Meet the talented musicians behind Woman Based Mechanics.'
  },
  {
    id: 4,
    icon: 'pi pi-image',
    title: 'Gallery',
    content: 'Browse through our collection of photos from concerts and studio sessions.'
  },
  {
    id: 5,
    icon: 'pi pi-envelope',
    title: 'Contact',
    content: 'Get in touch with us for bookings, collaborations, or just to say hello.'
  },
  {
    id: 6,
    icon: 'pi pi-star',
    title: 'Reviews',
    content: 'Read what fans and critics are saying about our music and performances.'
  }
])
</script>

<style scoped>
.test-section {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1b69 50%, #1a1a1a 100%);
}

.test-card {
  transition: all 0.3s ease;
}

.test-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Responsive text sizing */
@media (max-width: 420px) {
  h2 {
    font-size: 2rem;
    line-height: 2.25rem;
  }
}
</style>
