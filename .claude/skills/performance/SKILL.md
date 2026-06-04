---
name: performance
description: 'Use when working with the device-tier perf system, --perf-* CSS vars, perf-low/medium/high or reduce-animations classes, prefers-reduced-motion, scroll animations, or usePerformanceOptimization / useScrollAnimation / useOptimizedScroll.'
---

## When to use

Adding or tuning visual effects (blur, gradients, floating/parallax, animations) that must scale by device capability; reacting to `prefers-reduced-motion`; wiring scroll-driven UI (header shrink, reveal-on-scroll); or touching the `--perf-*` CSS variables / `perf-*` tier classes.

## Steps

1. In the component, call `usePerformanceOptimization()`. Bind its values: `:style="performanceCSSVars"` on the element whose subtree uses `--perf-*`, and `:class="getPerformanceClass()"` to emit tier classes.
2. In styles, gate effects with the emitted classes (`.perf-high`, `.no-backdrop-blur`, `.no-floating`, `.no-parallax`, `.reduce-animations`) and read values from `--perf-blur-strength`, `--perf-animation-duration`, `--perf-opacity` — never hardcode blur/duration.
3. For conditional rendering/logic, use the computed booleans (`isHighPerformanceDevice`, `shouldReduceAnimations`, `shouldUseMobileFallback`) rather than re-detecting.
4. For scroll: header/logo shrink uses `useScrollAnimation()` (exposes `isScrolled`, `logoSizeClass`, etc.); generic visibility/RAF-throttled scroll uses `useOptimizedScroll()`.
5. Manually verify at `/performance-test` (dev: tier + score logged to console). Honor `prefers-reduced-motion` in any new keyframe/transition.

## Source of truth

- `docs/performance-optimization.md` — tier criteria, what each tier enables/disables, CSS-var/class model, mobile-first strategy. Read on demand before extending.

## Key files

- `composables/usePerformanceOptimization.ts` — `usePerformanceOptimization()`; returns `performanceLevel`, `deviceMetrics`, `performanceCSSVars`, `getPerformanceClass()`, `shouldReduceAnimations`, `isHigh/Medium/LowPerformanceDevice`, `isMobileFlagship`, `shouldUseMobileFallback`, `createPerformanceObserver()`, `requestAnimation`/`releaseAnimation`.
- `composables/useScrollAnimation.ts` — `useScrollAnimation(opts)`; header/nav scroll state + `logoSizeClass`/`mobileLogo*Class`, adaptive throttling, reduced-motion aware.
- `composables/useOptimizedScroll.ts` — `useOptimizedScroll(opts)`; RAF-throttled `scrollY`/`isScrolled`/`scrollDirection` + `observeElement`/`isElementVisible`.
- `assets/css/base.scss` — defines `--perf-*` vars + `.perf-low/medium/high` and `prefers-reduced-motion` rules.
- `assets/css/components/scroll-animations.scss` — `gpu-accelerated`, `transition-transform-gpu`, `transition-spacing` classes used by scroll composables.
- `pages/performance-test.vue` — manual verification page.

## Gotchas

- Mobile is conservative by default: only flagship + high-GPU mobiles get `high`; backdrop blur on mobile requires `mobileStrategy === 'flagship'`. `enableFloatingEffects`/`enableParallax` are always off on mobile.
- Chromium UA Reduction freezes the model to "K", so UA regex would mis-tier every recent Android to `low`; the composable re-queries UA Client Hints (`getHighEntropyValues(['model'])`) async and re-evaluates — tier can change after mount.
- There's no single app-root provider: each component that needs perf binds the style/class itself. Tier is re-detected on resize/rotation.
- Despite CLAUDE.md, perf vars are NOT in `assets/css/utilities.scss` (that holds perf-agnostic animation/glass utils) — they live in `base.scss`.

## Related

- Skills: `add-release` and `work-with-images` consume this system (release theming + ProgressiveImage tie blur/animation to tier).
- Pair reduced-motion checks with the image-fade vars (`--pi-fade/zoom-duration`).
