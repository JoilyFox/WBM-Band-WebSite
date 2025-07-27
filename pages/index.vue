<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center px-4">
      <!-- Background overlay -->
      <div class="absolute inset-0 bg-black/30"></div>
      
      <!-- Content -->
      <div class="relative z-10 text-center max-w-4xl mx-auto">
        <h1 class="text-6xl md:text-8xl font-bold text-white mb-6 animate-fade-in">
          WBM BAND
        </h1>
        
        <p class="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up">
          Rock • Metal • Alternative
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
          <Button 
            label="Listen Now" 
            class="btn-primary text-lg px-8 py-3"
            icon="pi pi-play"
          />
          <Button 
            label="Tour Dates" 
            class="btn-outline text-lg px-8 py-3"
            icon="pi pi-calendar"
          />
        </div>
      </div>
      
      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <i class="pi pi-chevron-down text-white text-2xl"></i>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-20 px-4 bg-black/50">
      <div class="max-w-6xl mx-auto text-center">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-8">About WBM</h2>
        <p class="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
          WBM Band brings high-energy rock performances with a modern twist on classic metal sounds. 
          Our passion for music drives us to create unforgettable experiences for our fans.
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-music-note text-white text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Original Music</h3>
            <p class="text-gray-400">Creating powerful, original compositions that resonate with our audience</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-users text-white text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Live Shows</h3>
            <p class="text-gray-400">Electrifying live performances that bring our music to life</p>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-heart text-white text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">Fan Connection</h3>
            <p class="text-gray-400">Building lasting relationships with our amazing fanbase</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest News/Updates -->
    <section class="py-20 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl md:text-5xl font-bold text-white text-center mb-12">Latest Updates</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-xl font-semibold text-white mb-3">New Album Coming</h3>
            <p class="text-gray-300 mb-4">We're excited to announce our upcoming album release this fall...</p>
            <span class="text-purple-400 text-sm">2 days ago</span>
          </div>
          
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-xl font-semibold text-white mb-3">Summer Tour</h3>
            <p class="text-gray-300 mb-4">Join us on our summer tour across the country. Tickets available now...</p>
            <span class="text-purple-400 text-sm">1 week ago</span>
          </div>
          
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 class="text-xl font-semibold text-white mb-3">Studio Sessions</h3>
            <p class="text-gray-300 mb-4">Behind the scenes look at our recording process for the new tracks...</p>
            <span class="text-purple-400 text-sm">2 weeks ago</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact/Social -->
    <section class="py-20 px-4 bg-black/50">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-8">Stay Connected</h2>
        <p class="text-lg text-gray-300 mb-8">Follow us for the latest updates, behind-the-scenes content, and exclusive releases</p>
        
        <div class="flex justify-center space-x-6 mb-8">
          <Button 
            icon="pi pi-facebook" 
            class="btn-outline !p-3"
            aria-label="Facebook"
          />
          <Button 
            icon="pi pi-instagram" 
            class="btn-outline !p-3"
            aria-label="Instagram"
          />
          <Button 
            icon="pi pi-twitter" 
            class="btn-outline !p-3"
            aria-label="Twitter"
          />
          <Button 
            icon="pi pi-youtube" 
            class="btn-outline !p-3"
            aria-label="YouTube"
          />
        </div>
        
        <Button 
          label="Contact Us" 
          class="btn-primary text-lg px-8 py-3"
          icon="pi pi-envelope"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useSnackbar } from '~/composables/useSnackbar'
import { WEBSITE_TITLE, APP_DESCRIPTION, createPageTitle } from '~/constants/app'

// Meta
definePageMeta({
  title: 'Home'
})

useHead({
  title: createPageTitle('WBM Band - Rock • Metal • Alternative'),
  meta: [
    {
      name: 'description',
      content: 'WBM Band - High-energy rock performances with a modern twist on classic metal sounds. Official website for tour dates, music, and updates.'
    }
  ]
})

// Composables
const snackbar = useSnackbar()

// Methods for future functionality
const handleListenNow = () => {
  snackbar.info('Music Player', 'Music player coming soon!', 3000)
}

const handleTourDates = () => {
  snackbar.info('Tour Dates', 'Tour schedule coming soon!', 3000)
}

const handleContact = () => {
  snackbar.info('Contact', 'Contact form coming soon!', 3000)
}

const handleSocialClick = (platform: string) => {
  snackbar.info('Social Media', `${platform} link coming soon!`, 3000)
}
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-slide-up {
  animation: slide-up 1s ease-out 0.3s both;
}

.animate-scale-in {
  animation: scale-in 1s ease-out 0.6s both;
}
</style>