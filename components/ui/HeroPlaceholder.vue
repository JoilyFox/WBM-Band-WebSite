<template>
  <div class="hero-placeholder grainy-placeholder-animated">
    <!-- Base texture layer -->
    <div class="absolute inset-0 noise-texture"></div>
    
    <!-- Scanning overlay -->
    <div class="scanning-overlay"></div>
    
    <!-- Animated grain patterns -->
    <div class="absolute inset-0">
      <div class="grain-pattern pattern-1"></div>
      <div class="grain-pattern pattern-2"></div>
      <div class="grain-pattern pattern-3"></div>
    </div>
    
    <!-- Center loading indicator -->
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="loading-indicator">
        <div class="indicator-ring ring-1"></div>
        <div class="indicator-ring ring-2"></div>
        <div class="indicator-ring ring-3"></div>
        <div class="indicator-center">
          <i class="pi pi-image text-white/20 text-4xl"></i>
        </div>
      </div>
    </div>
    
    <!-- Corner accent lines -->
    <div class="corner-accents">
      <div class="corner-line top-left"></div>
      <div class="corner-line top-right"></div>
      <div class="corner-line bottom-left"></div>
      <div class="corner-line bottom-right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This component is purely presentational - no props needed
</script>

<style scoped>
.hero-placeholder {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Grain patterns */
.grain-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.1;
}

.pattern-1 {
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 40%);
  animation: drift1 8s ease-in-out infinite alternate;
}

.pattern-2 {
  background: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3px,
      rgba(255, 255, 255, 0.005) 3px,
      rgba(255, 255, 255, 0.005) 6px
    );
  animation: drift2 12s ease-in-out infinite alternate;
}

.pattern-3 {
  background: 
    conic-gradient(
      from 180deg at 50% 50%,
      transparent 0deg,
      rgba(255, 255, 255, 0.008) 90deg,
      transparent 180deg,
      rgba(255, 255, 255, 0.004) 270deg,
      transparent 360deg
    );
  animation: drift3 15s linear infinite;
}

/* Loading indicator */
.loading-indicator {
  position: relative;
  width: 120px;
  height: 120px;
}

.indicator-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.ring-1 {
  animation: pulse-ring 3s ease-in-out infinite;
}

.ring-2 {
  animation: pulse-ring 3s ease-in-out infinite 1s;
  transform: scale(0.8);
}

.ring-3 {
  animation: pulse-ring 3s ease-in-out infinite 2s;
  transform: scale(0.6);
}

.indicator-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

/* Corner accents */
.corner-accents {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corner-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  animation: line-glow 4s ease-in-out infinite alternate;
}

.top-left {
  top: 20px;
  left: 20px;
  width: 30px;
  height: 2px;
}

.top-left::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 30px;
  background: inherit;
}

.top-right {
  top: 20px;
  right: 20px;
  width: 30px;
  height: 2px;
  animation-delay: 1s;
}

.top-right::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 30px;
  background: inherit;
}

.bottom-left {
  bottom: 20px;
  left: 20px;
  width: 30px;
  height: 2px;
  animation-delay: 2s;
}

.bottom-left::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 2px;
  height: 30px;
  background: inherit;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
  width: 30px;
  height: 2px;
  animation-delay: 3s;
}

.bottom-right::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 2px;
  height: 30px;
  background: inherit;
}

/* Animations */
@keyframes drift1 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(3px, -2px) rotate(1deg); }
}

@keyframes drift2 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-2px, 3px) rotate(-1deg); }
}

@keyframes drift3 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes glow-pulse {
  0% {
    opacity: 0.3;
    transform: scale(1);
  }
  100% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

@keyframes line-glow {
  0% {
    opacity: 0.1;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
  }
  100% {
    opacity: 0.3;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }
}

/* Performance optimizations */
.grain-pattern,
.indicator-ring,
.corner-line {
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  .pattern-1,
  .pattern-2,
  .pattern-3,
  .indicator-ring,
  .indicator-center,
  .corner-line {
    animation: none !important;
  }
  
  .indicator-center {
    opacity: 0.5;
  }
  
  .corner-line {
    opacity: 0.2;
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .loading-indicator {
    width: 80px;
    height: 80px;
  }
  
  .indicator-center i {
    font-size: 2rem;
  }
  
  .corner-line {
    display: none; /* Simplify on mobile */
  }
}
</style>
