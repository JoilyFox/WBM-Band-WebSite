# WBM Band Website - Documentation

This directory contains documentation for all the main features of the WBM Band Website application.

## Features Documentation

- [Deployment Guide](./deployment-guide.md) - Complete guide for deploying to production hosting (wbmband.com) with manual FTP deployment
- [Performance Optimization](./performance-optimization.md) - Automatic device performance detection and adaptive optimizations for smooth 60 FPS on all devices
- [PageSpeed / Lighthouse Regression Testing](./pagespeed-regression-testing.md) - `npm run test:perf` runs the real Lighthouse engine (the PageSpeed lab profile) against `/`, `/ua`, `/en` and fails on score/byte-budget regressions; why local Lighthouse replaced the now-quota-0 keyless PSI API, plus the opt-in PSI field-data check
- [API Caching](./api-caching.md) - Browser-based API response caching system with localStorage fallback
- [Global Loading System](./global-loading-system.md) - Top bar progress indicator for async operations
- [Snackbar Notifications](./snackbar-notifications.md) - Custom notification system with modern animations and multiple types
- [Error Page System](./error-page-system.md) - Comprehensive error handling with custom messages and glassmorphism design
- [Liquid Glass + `<UiButton>`](./liquid-glass.md) - The macOS-style "liquid glass" material (classes, `--lg-*` tunables, tier gating, the backdrop-root trap, the hover/press morph, `v-lg-pointer`/`v-lg-physics`) and the unified `<UiButton>` component (variants/sizes/shapes) built on it — plus which buttons are unified vs deliberately kept
- [Image Optimization Guide](./image-optimization-guide.md) - Comprehensive image optimization implementation with static site generation support
- [Pre‑Blurred Images](./pre-blurred-images.md) - Build-time blur/tint generation to replace runtime overlay blur
- [Image Utilities](./image-utilities.md) - Composables and helper functions for image loading states and optimization
- [Favicon Setup](./favicon-setup.md) - Complete favicon generation system with multi-platform support and PWA compatibility
- [Pre-save Functionality](./presave-functionality.md) - Pre-save system for upcoming music releases with automatic state transitions
- [Release States System](./release-states-system.md) - Automatic preview / pre-save / released state management for each release based on release date and config flags
- [Release Page Theming](./release-page-theming.md) - Cover-driven "Ambient Bloom" atmosphere on release pages (build-time palette extraction + per-release overrides, performance-tiered)
- [Song Lyrics](./lyrics-feature.md) - Per-release lyrics that cross-slide in over the platform links; structured `lyrics[]` data, localized section labels, data-driven button
- [AI Search & SEO Optimization Strategy](./ai-search-optimization-strategy.md) - Strategy for Google Search / AI Overviews / AI-assistant discoverability: gap audit, phased plan (Phase 1 done), include/exclude with pros-cons, and the off-site music-entity playbook (MusicBrainz/Wikidata)
- [Off-Site Entity Setup Guide](./entity-setup-guide.md) - Copy-paste-ready MusicBrainz → Wikidata → Spotify/Apple-for-Artists → YouTube OAC walkthrough with verified field values and Wikidata property IDs (Phase 3 of the AI-search strategy)
- [Web3Forms Setup Guide](./web3forms-setup.md) - Contact form integration via Web3Forms: getting the API key and wiring `web3formsApiKey` in `config/general.ts`
- [Analytics Implementation — Task Plan](./analytics-implementation-tasks.md) - GA4 task plan for music master pages (`/listen/*`, `/pre-save/*`): hybrid path-prefix + referrer/UA source attribution, tracking visitors and converted listeners
- [GA4 Analytics — Operations, Debugging & Why Reports Go Empty](./analytics-debugging.md) - The operating/debugging source of truth: the scope⇄carrier mental model, why "aggregate works but per-source is empty," Consent Mode default-deny reality, the end-to-end `/g/collect` + DebugView validation runbook, the canonical attribution Exploration, and the GA4 Admin/Data API service-account + MCP access recipe
- [GA4 Dashboards & Per-Song Reports](./analytics-dashboards.md) - Three ways to see per-song/per-source numbers: the `scripts/ga-report.mjs` CLI, per-song additions to existing GA4 Explorations (filter / tabs / release_slug-as-row), and a full Looker Studio master-dashboard walkthrough with a dynamic release dropdown + general stats
- [Testing Strategy](./testing-strategy.md) - Prioritized testing audit and implemented suites (unit/nuxt + e2e), coverage ratchet floors, CI wiring, and open findings

## Tech Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Styling**: Tailwind CSS + SCSS with modular architecture
- **State Management**: Pinia for reactive state management
- **UI Components**: PrimeVue with custom extensions
- **TypeScript**: Full type safety across the application
- **Icons**: PrimeIcons for consistent iconography

## Adding New Documentation

To add documentation for a new feature:

1. **Create a new `.md` file** in the `docs/` directory (e.g., `my-feature.md`)
2. **Follow the standard structure**:
   - Feature title and overview
   - Components list with clickable links to source files
   - Quick start examples
   - API reference
   - Real-world examples
   - Best practices and troubleshooting
3. **Add your feature to the list above** with a brief description
4. **Use relative links** to source files: `[ComponentName.vue](../components/path/to/component.vue)`
5. **Keep it developer-focused** with practical examples and clear API documentation

### Documentation Template

```markdown
# Feature Name

Brief description of what this feature does.

## Overview

Explain the main components and how they work together.

## Components

- [`ComponentName.vue`](../components/path/to/component.vue) - Description
- [`useFeatureComposable`](../composables/useFeature.ts) - Description
- [`featureStore`](../store/feature.ts) - Description

## Quick Start

### Basic Usage

\`\`\`vue
<template>

  <!-- Template example -->
</template>

<script setup lang="ts">
// Script example
</script>

\`\`\`

## API Reference

Detailed API documentation...

## Real-World Examples

Practical usage scenarios...

## Best Practices

Guidelines for optimal usage...

## Troubleshooting

Common issues and solutions...
```

---

_More feature documentation will be added as the project grows._
