# Hero media — a clip or a still behind the release hero

A release page's hero (cover + title, `.music-hero`) can carry a darkened background:
a muted looping clip from the music video, or a still. Without it the hero is the
cover-coloured gradient as before; with it the gradient stays as a light wash on top.

Status: **preview on branch `feature/hero-media`**, not on production.

| Release        | Clip                         | Options                                                                                                 |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| «Сліпа вулиця» | 0:20–0:44 of the music video | `anchor: 0.36` (the red sun). A red `tint` of the wash was tried and dropped: the owner prefers it dark |
| «Манія»        | 0:30–0:50                    | `--squeeze 4` (club footage: flares, fast cuts)                                                         |
| «Хвилі»        | 2:27–2:57                    | —                                                                                                       |

## Add one

1. Cut and encode from the source video (needs Homebrew `ffmpeg` with libsvtav1 + libx264):
   ```bash
   npm run hero-media -- ~/Desktop/clip.mp4 <slug> --from 20 --to 44
   ```
   Pick a calm stretch: no flashes, the subject near the centre (phones see the middle
   9:16 of the frame). 15–30 s. The loop is seamless: the script cuts `--xfade` (default
   1.5 s) past `--to` and dissolves that tail into the first frames (a plain crossfade,
   no dip to black), so the file's last frame runs straight into its first. Mean luma
   across the seam of «Сліпа вулиця» stays within 48–52 (no darkening).
2. Add to the release in `data/musicLibrary.ts`:
   ```ts
   heroMedia: {
     kind: 'video',
     wide: '/videos/releases/<slug>/hero-1280',
     small: '/videos/releases/<slug>/hero-640',
     anchor: 0.36 // optional: the clip's height kept at the hero's centre
   }
   ```
   `kind: 'image'` uses only `<prefix>.poster.{avif,webp,jpg}` (a still, no clip).
   `focus` sets `object-position` if the subject is off-centre.
   Busy footage: `--squeeze 4` raises both CRFs (roughly halves the size). The source can
   be a section downloaded from YouTube (`yt-dlp --download-sections "*0:25-1:05"`);
   keep it out of the repo.

## Files (`public/videos/releases/<slug>/`)

| File                                 | What                           | Size («Сліпа вулиця», 24 s) |
| ------------------------------------ | ------------------------------ | --------------------------- |
| `hero-1280.av1.mp4` / `.h264.mp4`    | 16:9 1280×720, windows ≥ 768px | 1.0 MB / 1.8 MB             |
| `hero-640.av1.mp4` / `.h264.mp4`     | 16:9 640×360, phones           | 0.4 MB / 0.55 MB            |
| `<rendition>.poster.{avif,webp,jpg}` | first frame                    | 4–47 KB                     |

No audio, 24 fps, keyframe every 4 s, `faststart`. Film grain is denoised (`hqdn3d`)
first: grain is most of the bitrate and invisible under the darkening.

## How it plays (`components/music/HeroMedia.vue`)

- **Never in the way of first paint**: nothing on the server; the clip starts after the
  `load` event when the main thread is idle (~200 ms after load locally). It fades in
  (1.6 s) only once its first frame is painted (`requestVideoFrameCallback`).
- **Codec**: AV1 only where `navigator.mediaCapabilities` says it decodes
  `powerEfficient` (hardware); otherwise H.264. Software AV1 would cost a phone's CPU for
  the whole visit.
- **Rendition**: `wide` from 768px, `small` below (chosen once, at start). Both 16:9.
- **Falls back to the plain hero**: Save-Data or 2g, a load error. **Falls back to the
  still**: `prefers-reduced-motion`, `.perf-low` tier, autoplay refused (iOS Low Power
  Mode), `kind: 'image'`.
- **Paused** off screen (IntersectionObserver) and in a hidden tab; the decoder is
  released on unmount.
- Release pages, and the home-page release modal on desktop (not the phone sheet);
  closing the modal unmounts it and releases the decoder. In the modal the clip is
  `translucent` (38 % opacity, a light vignette instead of the dark scrim) so the glass
  panel stays see-through: the page behind shows through the clip.

## Shape, collapse / expand on phones

The clip is always shown whole-width at its own 16:9 shape (`object-fit: cover` on a
16:9 box), never stretched to the hero. Phones: the box is `max(56.25vw, 240px)` tall,
so on narrow phones it still covers the 228px collapsed hero (a slight zoom, 390px:
219 → 240) and shows the whole frame width.

Where the hero is taller than the clip (the expanded phone hero, a portrait tablet), a
**blurred copy** fills the rest (`is-filled`): the video draws each frame into a 32×18
canvas (`requestVideoFrameCallback`, no second decode) that CSS scales up and blurs; the
still uses its own image. The copy loop runs only while it is visible; the clip's top and
bottom edges feather into it.

On every hero resize the box is re-placed (`--hm-shift`: the `anchor` point at the hero's
centre, clamped so it never uncovers an edge it can cover) and slides there with a
compositor `translate` transition (0.6 s, the curve of the hero content's own animation).
The box keeps its size across collapse / expand, so the picture is never rescaled.

## Look

- Darkening is the clip's own scrim (`.hero-media::after`, over the clip and its copy): radial (lighter in the
  middle) + vertical; the hero overlay above drops to 55 % opacity.
- The clip fades out over the hero's lower 38 % (mask), into the page.
- Desktop hero grows to `clamp(416px, 60vh, 580px)` when it has media.

## Production checklist

- `deploy/nginx/wbm-site.conf` has a `location ^~ /videos/` (one-year cache). Without it
  `.mp4` falls through to `location /` and is sent `no-cache`. Install the nginx config
  on the VPS (`deploy/nginx/README.md`) before or with the first deploy.
- About 2 MB per release in git; the source video never goes in the repo.

## Extending

`kind` is the switch: a future `'scene'` (an interactive canvas or WebGL piece) would be
another branch in `HeroMedia.vue`, with the same contract — client-only, starts when idle,
fades in when ready, falls back to the still/plain hero, pauses off screen.
