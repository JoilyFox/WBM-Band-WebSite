# Release States System

## Overview

The music release system automatically manages three distinct states for each release based on the release date and configuration settings:

1. **Preview (New Release)** - Non-clickable preview card for upcoming releases
2. **Pre-save** - Clickable card with pre-save links for upcoming releases
3. **Released** - Regular music card with streaming platform links

## State Transitions

The system automatically transitions between states based on:

- The current date/time vs. release date/time
- Configuration flags in `config/general.ts`
- Presence of pre-save links

### State Logic

```
Is release date in the future?
├─ YES (Upcoming Release)
│  ├─ Has preSaveMusicPlatformLinks AND enablePreSave=true?
│  │  └─ Show PRE-SAVE card (clickable, links to /pre-save/{slug})
│  └─ enableNextReleasePreview=true?
│     └─ Show PREVIEW card (non-clickable, blurred image)
└─ NO (Released)
   └─ Show REGULAR music card (links to /listen/{slug})
```

## Configuration

In `config/general.ts`:

```typescript
{
  enableNextReleasePreview: true,  // Show preview card for upcoming releases
  enablePreSave: true              // Enable pre-save functionality (overrides preview)
}
```

## Release Date Format

The `releaseDate` property supports ISO 8601 format with optional time:

### Date Only (releases at midnight UTC)

```typescript
releaseDate: '2025-11-14'
```

### Date with Time (specific release time)

```typescript
releaseDate: '2025-11-14T18:00:00' // November 14, 2025 at 6:00 PM UTC
```

### Date with Time and Timezone

```typescript
releaseDate: '2025-11-14T18:00:00Z' // Explicit UTC
```

## Music Release Interface

```typescript
interface MusicRelease {
  id: string
  slug: string
  title: string
  type: 'single' | 'album' | 'ep' | 'new release'
  releaseDate: string // ISO 8601 format
  imageUrl: string // Optimized image for released tracks
  blurredImageUrl?: string // Blurred image for preview cards

  // Regular streaming platform links (shown after release)
  musicPlatformLinks: {
    spotify?: string
    appleMusic?: string
    // ... other platforms
  }

  // Pre-save links (shown before release if enablePreSave=true)
  preSaveMusicPlatformLinks?: {
    spotify?: string
    appleMusic?: string
    // ... other platforms
  }

  // Released-state fallback CTA target, used when musicPlatformLinks is still
  // empty (a distributor smart-link, e.g. feature.fm). See "Released-state
  // smart-link fallback CTA" below.
  releaseSmartLink?: string
}
```

## Key Features

### 1. Automatic Deduplication

The system ensures each release appears only once:

- If showing preview/pre-save card, the release is **filtered out** from regular music cards
- When release date passes, preview/pre-save card automatically disappears
- Regular music card automatically appears after release date

### 2. Time-Aware Releases

- Supports specific release times (hours and minutes)
- Time comparison is precise to the minute
- Automatic state switching at exact release time

### 3. Image Optimization

- **Released tracks**: Use optimized images (`imageUrl`)
- **Preview/Pre-save cards**: Use blurred images (`blurredImageUrl`)
- Fallback: Automatically adds `-blurred` suffix if `blurredImageUrl` not specified

### 4. Released-state smart-link fallback CTA

Per-platform DSP links (`musicPlatformLinks`) often only become available _after_
release. To avoid an empty platform grid on `/listen/{slug}` at release, set an
optional `releaseSmartLink` (a distributor smart-link, e.g. feature.fm). When the
release is in the **Released** state and `musicPlatformLinks` is still empty,
`MusicDetailContent.vue` renders a single **"Listen on all platforms"** CTA to that
smart-link instead of an empty grid. As soon as any `musicPlatformLinks` entry is
added, the normal platform grid replaces the CTA automatically.

Unlike the pre-save `distributorPreSaveUrl` (which _redirects_ the transient
pre-save page), `releaseSmartLink` does **not** redirect: `/listen/{slug}` is an
indexed SEO surface (self-canonical + JSON-LD), so it stays a real page and links
out via the button. A manual CTA click is tracked as a `platform_click`
(`platform_name: 'smartlink'`).

## Example Workflow

### 1. Announce Upcoming Release

```typescript
// In musicLibrary.ts
{
  id: '3',
  slug: 'new-song',
  title: 'New Song',
  type: 'single',
  releaseDate: '2025-12-01T18:00:00',  // December 1, 2025 at 6:00 PM
  imageUrl: '/images/optimized/albums-images/new-song.avif',
  blurredImageUrl: '/images/albums-images/new-song-blurred.jpg',
  musicPlatformLinks: {
    spotify: 'https://open.spotify.com/album/...',
    appleMusic: 'https://music.apple.com/album/...'
  }
}
```

**Result**: Shows non-clickable preview card with blurred image

### 2. Enable Pre-save

```typescript
// Add pre-save links
preSaveMusicPlatformLinks: {
  spotify: 'https://open.spotify.com/album/...?go=1',
  appleMusic: 'https://music.apple.com/album/...'
}
```

**Result**: Preview card becomes clickable pre-save card

### 3. Automatic Release

When `2025-12-01T18:00:00` arrives:

- Pre-save card **automatically disappears**
- Regular music card **automatically appears**
- Uses regular `musicPlatformLinks` instead of pre-save links
- Shows optimized image instead of blurred image

## Components Involved

### MusicLibrarySection.vue

- Manages display of music cards
- Filters out upcoming releases from regular cards when showing preview/pre-save
- Renders preview/pre-save card at the top

### pages/pre-save/[slug].vue

- Mobile pre-save page
- Automatically redirects to `/listen/{slug}` after release date

### pages/listen/[slug].vue

- Regular music page for released tracks

### MusicDetailContent.vue

- Shared component for both pre-save and regular display
- Supports `isPreSave` prop to switch between modes

## Helper Functions

### isUpcomingRelease(dateString)

```typescript
// Returns true if release date is in the future
const isUpcoming = isUpcomingRelease('2025-11-14T18:00:00')
```

### formatReleaseDate(dateString, locale)

```typescript
// Formats date with time if available
const formatted = formatReleaseDate('2025-11-14T18:00:00', 'en-US')
// Result: "November 14, 2025 at 6:00 PM"
```

## Best Practices

1. **Always set both link types** for upcoming releases:
   - `musicPlatformLinks` - for after release
   - `preSaveMusicPlatformLinks` - for pre-save period

2. **Use specific times** for coordinated releases:

   ```typescript
   releaseDate: '2025-11-14T18:00:00' // Not just '2025-11-14'
   ```

3. **Generate blurred images** for upcoming releases:

   ```bash
   node scripts/generate-blurred-image.js public/images/albums-images/cover.jpg
   ```

4. **Test state transitions** by setting release date to near-future time

5. **One release, one state** - The system ensures no duplicate cards appear
