<template>
  <section id="team" class="team-bg-section relative overflow-hidden">
    <CommonContainer size="xl" padding="md">
      <!-- Header -->
      <div class="relative z-10 mt-20 mb-10 text-center">
        <CommonSectionTitle :level="2" size="xl" align="center">
          {{ t('team.section_title') }}
        </CommonSectionTitle>
        <CommonSectionSubtitle align="center" max-width="md" size="base">
          {{ t('team.section_subtitle') }}
        </CommonSectionSubtitle>
      </div>

      <!-- Team Members Creative Grid Placeholder -->
      <SectionsTeamMembersGrid variant="columns" />
    </CommonContainer>

    <!-- Background Grain Layer -->
    <div class="grain-layer" aria-hidden="true"></div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CommonContainer from '~/components/common/Container.vue'

// i18n global scope
const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped lang="scss">
.team-bg-section {
  min-height: 75vh; // Taller for extended transition visual
  display: block;
  position: relative;
  isolation: isolate;
  /* Extended vertical gradient: lengthened intermediate stops for smoother ramp */
  background:
    linear-gradient(to bottom,
      rgba(0,0,0,0.88) 0%,
      rgba(12,12,13,0.70) 460px,
      rgba(22,22,24,0.62) 680px,
      rgba(30,30,33,0.56) 880px,
      rgba(38,38,42,0.50) 100%), /* vertical fade */
    linear-gradient(140deg, rgba(14,14,15,0.95) 0%, rgba(18,18,20,0.85) 40%, rgba(24,24,26,0.78) 75%, rgba(30,30,32,0.72) 100%), /* diagonal depth */
    radial-gradient(circle at 24% 30%, rgba(255,255,255,0.07), transparent 62%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.055), transparent 68%),
    #070707;
  background-blend-mode: normal, overlay, overlay, overlay, normal;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.03),
    inset 0 -1px 0 rgba(255,255,255,0.02);
  overflow: hidden;
}

/* Top and bottom transition extenders */
.team-bg-section::before,
.team-bg-section::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  pointer-events: none;
  z-index: -1;
}

/* Fade upward above the section to merge smoothly with previous dark area */
.team-bg-section::before {
  top: -160px;
  height: 160px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.97));
}

/* Bottom extended fade to ease into next darker or lighter block */
.team-bg-section::after {
  bottom: -200px;
  height: 200px;
  background: linear-gradient(to bottom, rgba(36,36,39,0.48), rgba(28,28,30,0.6) 40%, rgba(16,16,17,0.78) 80%, rgba(8,8,9,0.9));
  filter: blur(2px);
  opacity: 0.95;
}

/* Static fine grain texture */
.grain-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 2px), /* subtle vertical texture lines */
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E");
  background-blend-mode: soft-light, overlay;
  animation: grainShift 22s steps(1) infinite;
}


@keyframes grainShift {
  0% { transform: translate(0,0); }
  25% { transform: translate(-5%, 3%); }
  50% { transform: translate(4%, -4%); }
  75% { transform: translate(-3%, 2%); }
  100% { transform: translate(0,0); }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .grain-layer { animation: none; }
}
</style>
