<template>
  <div class="gradient-section-wrapper relative">
    <div class="content relative z-10">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
  .gradient-section-wrapper {
    position: relative;
    isolation: isolate;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(38, 38, 42, 0.6) 40%,
      rgba(38, 38, 42, 0.6) 70%,
      transparent 100%
    );
    overflow: hidden;
  }
</style>
