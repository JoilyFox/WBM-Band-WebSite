<template>
  <div class="team-grid-wrapper relative z-10 pb-32">
    <!-- Team members grid (variant driven) -->
    <div class="team-grid" :class="variantClass" aria-hidden="true">
      <div v-for="n in blocks" :key="n" class="member-block group" :class="`block-${n}`">
        <div class="inner flex items-center justify-center text-white/15 text-[0.65rem] tracking-widest uppercase opacity-0 group-hover:opacity-70 transition-opacity duration-500">
          Block {{ n }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// Only six placeholder blocks for now
const blocks = 6

interface Props {
  variant?: 'balanced' | 'columns'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'balanced'
})

const variantClass = computed(() => `layout-${props.variant}`)
</script>

<style scoped lang="scss">
.team-grid {
  display: grid;
  gap: clamp(0.85rem, 1.2vw, 1.35rem);
  grid-template-columns: repeat(auto-fill, minmax(min(44%, 170px), 1fr));
  align-items: stretch;
  position: relative;
}

/* Larger screens: switch to curated art-directed layout */
@media (min-width: 1024px) {
  .team-grid {
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 110px;
    gap: 1rem;
  }

  .team-grid.layout-columns { grid-auto-rows: 88px; }

  /* Variant: columns (staggered vertical emphasis) */
  .team-grid.layout-columns :deep(.block-1) { grid-column: 1 / span 4; grid-row: 1 / span 3; }
  .team-grid.layout-columns :deep(.block-2) { grid-column: 1 / span 4; grid-row: 4 / span 4; }
  .team-grid.layout-columns :deep(.block-3) { grid-column: 5 / span 4; grid-row: 1 / span 4; }
  .team-grid.layout-columns :deep(.block-4) { grid-column: 5 / span 4; grid-row: 5 / span 3; }
  .team-grid.layout-columns :deep(.block-5) { grid-column: 9 / span 4; grid-row: 1 / span 3; }
  .team-grid.layout-columns :deep(.block-6) { grid-column: 9 / span 4; grid-row: 4 / span 4; }
}

.member-block {
  position: relative;
  border-radius: 1.2rem;
  overflow: hidden;
  background: radial-gradient(circle at 35% 28%, rgba(255,255,255,0.08), transparent 62%),
              linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0));
  backdrop-filter: blur(2px) saturate(160%);
  -webkit-backdrop-filter: blur(2px) saturate(160%);
  box-shadow: 0 3px 14px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
  isolation: isolate;
  display: flex;
  min-height: 110px;
  animation: appear 0.75s ease forwards;
  opacity: 0;
}

.member-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(120,53,255,0.18) 0%, rgba(147,51,234,0.15) 25%, rgba(236,72,153,0.12) 55%, rgba(255,255,255,0) 70%);
  mix-blend-mode: overlay;
  opacity: 0.75;
  transition: opacity 600ms ease;
}
.member-block::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.28), transparent 60%),
    radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2), transparent 65%);
  opacity: 0;
  transform: scale(1.15);
  transition: opacity 0.9s ease, transform 1.2s ease;
}

.member-block:hover::after { opacity: 0.45; transform: scale(1.02); }
.member-block:hover::before { opacity: 1; }
.member-block:hover { box-shadow: 0 6px 26px -4px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07) inset; }
.member-block:hover .inner { letter-spacing: 0.35em; }

.member-block .inner { transition: letter-spacing 1.2s cubic-bezier(.16,.8,.26,1); }

@media (prefers-reduced-motion: reduce) {
  .member-block, .member-block::after { animation: none; transition: none; }
}

@keyframes appear {
  0% { opacity: 0; transform: translateY(26px) scale(.95); filter: blur(3px); }
  55% { opacity: 1; transform: translateY(-3px) scale(1.01); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
