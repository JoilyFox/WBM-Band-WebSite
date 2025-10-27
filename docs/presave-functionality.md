# Pre-save Functionality

Complete guide for the pre-save system that allows fans to save upcoming releases before they're officially released.

## Overview

The pre-save functionality provides three different states for upcoming music releases:

1. **Next Release Preview** - Non-clickable preview card showing upcoming release
2. **Pre-save Mode** - Clickable card with pre-save platform links
3. **Released** - Regular music card with streaming links

## Components

- [`MusicDetailContent.vue`](../components/music/MusicDetailContent.vue) - Handles both regular and pre-save modes
- [`MusicLibrarySection.vue`](../components/sections/MusicLibrarySection.vue) - Displays preview/pre-save/released cards
- [`pages/pre-save/[slug].vue`](../pages/pre-save/[slug].vue) - Pre-save page route for mobile
- [`pages/listen/[slug].vue`](../pages/listen/[slug].vue) - Regular music page route
- [`useMusicNavigation.ts`](../composables/useMusicNavigation.ts) - Navigation logic
- [`configHelpers.ts`](../utils/configHelpers.ts) - Helper functions for release detection

## Configuration

### General Config (`config/general.ts`)

```typescript
{
  // Enable/disable next release preview (non-clickable card)
  enableNextReleasePreview: boolean
  
  // Enable/disable pre-save functionality (overrides preview when true)
  enablePreSave: boolean
}
```

### Music Library (`data/musicLibrary.ts`)

Add an upcoming release with pre-save links:

```typescript
{
  id: '3',
  slug: 'upcoming-single',
  title: 'Upcoming Single',
  type: 'single',
  releaseDate: '2025-12-01', // Future date
  imageUrl: '/images/optimized/albums-images/example.avif',
  description: 'Our next release coming soon!',
  featured: true,
  
  // Pre-save links (used when enablePreSave = true and date is in future)
  preSaveMusicPlatformLinks: {
    spotify: 'https://spotify.link/presave/example',
    appleMusic: 'https://music.apple.com/presave/example',
    youtubeMusic: 'https://youtube.com/presave/example'
  },
  
  // Regular streaming links (used when date has passed)
  musicPlatformLinks: {
    spotify: 'https://open.spotify.com/track/example',
    appleMusic: 'https://music.apple.com/song/example',
    youtubeMusic: 'https://youtube.com/watch?v=example'
  }
}
```

## Usage Scenarios

### Scenario 1: Preview Mode (No Pre-save)
**Date**: Before release  
**Config**: `enableNextReleasePreview: true`, `enablePreSave: false`  
**Result**: Shows non-clickable preview card with "Coming {date}" text  
**Click**: Shows snackbar notification

### Scenario 2: Pre-save Mode
**Date**: Before release  
**Config**: `enablePreSave: true`  
**Result**: Shows clickable pre-save card with "Pre-save {date}" text  
**Click**: Opens modal (desktop) or navigates to `/pre-save/{slug}` (mobile)  
**Links**: Uses `preSaveMusicPlatformLinks`

### Scenario 3: Released
**Date**: After release date  
**Config**: Any  
**Result**: Shows regular music card  
**Click**: Opens modal (desktop) or navigates to `/listen/{slug}` (mobile)  
**Links**: Uses `musicPlatformLinks`

## How It Works

### 1. Release Detection

The system automatically detects the nearest upcoming release from `musicLibrary`:

```typescript
// In utils/configHelpers.ts
const upcomingRelease = getNearestUpcomingRelease()
```

### 2. State Determination

Based on configuration and dates:

```typescript
// Preview mode (non-clickable)
if (enableNextReleasePreview && !enablePreSave && dateInFuture) {
  // Show preview card
}

// Pre-save mode (clickable with pre-save links)
if (enablePreSave && dateInFuture && hasPreSaveLinks) {
  // Show pre-save card
}

// Released mode
if (dateInPast) {
  // Show regular music card
}
```

### 3. Navigation

- **Desktop**: Opens modal with `MusicDetailContent` component
- **Mobile**: Navigates to `/pre-save/{slug}` or `/listen/{slug}`

### 4. Automatic Transition

When the release date arrives:
- Pre-save page redirects to regular listen page
- Pre-save links automatically switch to regular streaming links
- Card style changes from pre-save to released

## Styling

### Pre-save Badge
- Color: Purple/Pink gradient (`badge-presave`)
- Text: "PRE-SAVE" or "ПРЕСЕЙВ" (Ukrainian)

### Pre-save Card
- Icon: Bookmark icon (`pi-bookmark`)
- Hover: Purple glow effect
- Text: "Pre-save {date}"

## API Reference

### Helper Functions

```typescript
// Get nearest upcoming release
getNearestUpcomingRelease(): MusicRelease | null

// Check if pre-save mode is active
isPreSaveMode(): boolean

// Check if preview should show
shouldShowNextReleasePreview(): boolean

// Check if date is upcoming
isUpcomingRelease(dateString: string): boolean
```

### Component Props

```typescript
// MusicDetailContent
interface Props {
  release: MusicRelease
  isModal?: boolean
  isPreSave?: boolean  // Indicates pre-save mode
}
```

## Workflow Example

### Setup Pre-save Campaign

1. Add upcoming release to `musicLibrary` with future `releaseDate`
2. Add `preSaveMusicPlatformLinks` with pre-save URLs
3. Add regular `musicPlatformLinks` for post-release
4. Set `enablePreSave: false` in `general.ts` (keep preview mode)

### Activate Pre-save

1. Set `enablePreSave: true` in `general.ts`
2. Preview card automatically switches to clickable pre-save card
3. Users can now click to access pre-save links

### Release Day

1. Release date arrives
2. System automatically detects date has passed
3. Pre-save card disappears from music section
4. Regular music card appears with streaming links
5. `/pre-save/{slug}` redirects to `/listen/{slug}`

## Translations

### English (`locales/en.json`)
```json
{
  "music": {
    "detail": {
      "presave_title": "Pre-save Now"
    },
    "presave": {
      "card_title_fallback": "Pre-save",
      "coming_prefix": "Pre-save {date}"
    }
  }
}
```

### Ukrainian (`locales/uk.json`)
```json
{
  "music": {
    "detail": {
      "presave_title": "Зберегти наперед"
    },
    "presave": {
      "card_title_fallback": "Пресейв",
      "coming_prefix": "Пресейв {date}"
    }
  }
}
```

## Best Practices

1. **Add releases in advance** - Add the release to musicLibrary as soon as you know the date
2. **Test pre-save links** - Verify all pre-save URLs work before enabling
3. **Enable preview first** - Use preview mode to build anticipation before enabling pre-save
4. **Set correct dates** - Use ISO date format (YYYY-MM-DD) for accurate detection
5. **Update on release day** - The system auto-switches, but verify everything works

## Troubleshooting

### Pre-save card not showing
- Check `enablePreSave: true` in `general.ts`
- Verify release has future `releaseDate`
- Ensure `preSaveMusicPlatformLinks` has at least one link
- Check that release is nearest upcoming (only one shows)

### Wrong links showing
- Pre-save mode uses `preSaveMusicPlatformLinks`
- Released mode uses `musicPlatformLinks`
- Verify correct links are in correct property

### Page redirects immediately
- Release date may have passed
- Check date is in future: `releaseDate: '2025-12-01'`
- Verify system clock is correct

---

*This documentation was created for the WBM Band website pre-save system.*
