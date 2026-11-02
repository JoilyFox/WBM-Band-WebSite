# Liquid Glass material + the `<UiButton>` system

macOS-Tahoe-style "liquid glass" material and the unified button built on top of
it. The material lives in `assets/css/components/liquid-glass.scss` (+ SVG lens
filters in `app.vue`, directives in `plugins/liquid-glass.ts`); the button is
`components/ui/Button.vue` (`<UiButton>`).

---

## 1. The one rule that will waste your afternoon — the backdrop-root trap

A `.liquid-glass` element frosts the page behind it with `backdrop-filter`. That
filter is **silently disabled** (renders nothing — the page behind stays sharp)
if the element **or any ancestor** establishes a "backdrop root":

`transform` (non-none) · `will-change: transform|opacity` · `opacity < 1` ·
`filter` · `contain: paint|layout` · `isolation: isolate` · `perspective` ·
`mask` / `clip-path` · `mix-blend-mode`.

**`getComputedStyle(el, '::before').backdropFilter` returns the _declared_ value
even when it is suppressed** — so it looks verified but renders flat. The only
real checks are a screenshot / pixel sharpness, or walking the ancestor chain for
the triggers above. See `memory/reference_backdrop_filter_ancestor_trap.md`.

Consequences baked into the system:

- A glass host must stay a plain stacking context (`position: relative; z-index: 0`
  — never `isolation: isolate`).
- Entrances never animate a glass host (or its ancestors) with `transform` /
  `opacity` / `will-change`. Scrims fade via `background-color`; panels
  materialize by ramping the frost + tint in place; motion rides on a descendant.
- Glass **inside** content that fades in (BaseModal's scroll wrapper, `opacity < 1`
  for the entrance) is suppressed for the fade and came back in one frame when it
  ended. BaseModal tags every backdrop-filtered descendant on enter
  (`data-lg-frost` / `data-lg-frost-before`), holds it at `backdrop-filter: none`
  and eases it to its own value after the entrance (`frostHold` / `frostRamp`). An
  identity filter (`blur(0) saturate(1)`) is NOT equivalent and still snapped.
- The panel's enter-from / leave-to frost is the identity `blur(0) saturate(1)
brightness(1)`: keeping the vibrancy there lifted the page under the invisible
  panel, a rectangle that snapped off when the closed modal was removed. The panel's
  `::before` also fades to `opacity: 0` there: its Chromium lens (`filter: url()`)
  doesn't interpolate and kept bending the page under the invisible panel until the
  modal was removed (a one-frame shift of a couple of pixels).
- The home page clears `selectedRelease` only after the close animation
  (`useMusicNavigation.closeModal`, 450 ms); clearing it at once unmounted the
  modal mid-close, so it vanished in one frame.
- **Hover never transforms a glass host** (a persistent transform kills the frost
  the whole time it's hovered). The "grow on hover" rides on the button's inner
  content instead. A **press** transform is allowed because it's transient — the
  one-frame frost drop reads as the press.

---

## 2. Layer model (zero extra markup)

| Layer                  | Paints                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| host (`.liquid-glass`) | tint wash, radius, border, elevation shadow                                                                      |
| `::before`             | frost (`backdrop-filter: blur+saturate+brightness`) + Chromium-only displacement lens (`filter: url(#lg-lens*)`) |
| `::after`              | specular shell — inset rim hairlines, pointer sheen, press-glow (rasterized, no per-frame sampling)              |

Radius **must** be set via `--lg-radius`, not `border-radius` alone: the lens
layer clips with `clip-path: inset(0 round var(--lg-radius))` and can't read
`border-radius`.

## 3. Class API

| Class                       | Use                                                                      |
| --------------------------- | ------------------------------------------------------------------------ |
| `.liquid-glass`             | base host (tint + frost + rim)                                           |
| `.liquid-glass--pill`       | capsule radius, lower blur (round controls)                              |
| `.liquid-glass--panel`      | thick frost + deep shadow (modals, popups, toasts)                       |
| `.liquid-glass--bar`        | full-width clear bar with a bent bottom lip (the header)                 |
| `.liquid-glass--refract`    | near-clear on Chromium so a `v-lg-physics` lens reads as real refraction |
| `.liquid-glass--lens`       | opt-in static SVG displacement lens                                      |
| `.liquid-glass-interactive` | hover/press behaviour (see §6)                                           |
| `.liquid-glass-veil`        | cheap full-screen frosted backdrop (menu/modal scrims)                   |

### Tunable custom properties (override per variant / per use)

`--lg-radius`, `--lg-blur` / `--lg-blur-full`, `--lg-saturate(-full)`,
`--lg-brightness`, `--lg-tint` / `--lg-tint-flat`, `--lg-rim` / `--lg-rim-soft`,
`--lg-sheen`, `--lg-gloss`, `--lg-lens(-filter)`. Defaults live at the top of
`liquid-glass.scss`.

## 4. Tier gating (body classes set in `app.vue` after client detection)

- _(no class)_ — safe default "liquid-lite" (small blur, rim, tint).
- `lg-tier-high` — full blur/saturation; `+ lg-can-lens` adds the SVG lens.
- `lg-tier-low` — frosted glass without specular shine (weak devices).
- `lg-can-lens` — Chromium only (`navigator.userAgentData`); gates `filter:url()`
  so Safari/Firefox never receive an unresolved reference.
- `lg-inapp` — in-webview header becomes a floating pill.
- `@media (prefers-reduced-transparency)` → flat near-opaque; `(prefers-reduced-motion)`
  → no transitions/transforms.

## 5. Directives

- `v-lg-pointer` — cursor-reactive sheen + press-glow origin. Attach to the glass
  host of interactive elements; auto-gated to fine pointers + no-reduced-motion.
- `v-lg-physics="{ strength, edge, curve }"` — per-element Snell's-law
  displacement lens (Chromium only, expensive). For large panels paired with
  `.liquid-glass--refract` (e.g. the desktop release modal), not small buttons.

## 6. The interaction morph (`.liquid-glass-interactive`)

Shared by **every** interactive glass surface (modal close, language switcher,
swiper arrows, and `<UiButton>` glass variants) so they stay in sync:

- **Hover** (fine pointer only): the specular rim brightens, with a soft outer
  bloom and a gentle inner glow; the button's **content** swells (the host can't
  scale — see §1).
- **Press**: the host nudges up (`scale(1.06)`) and settles back with a bouncy
  curve; `--lg-glow` blooms.

The swiper-nav mixin (`assets/css/components/swiper-navigation.scss`) mirrors this
on host-only properties because Swiper owns the button's `::after` (the chevron).

> History: a squash-and-stretch ("gel") variant was tried and reverted in favour
> of this grow + light-play version. Both are GPU-only (transform/opacity) and
> perf/reduced-motion gated.

---

## 7. `<UiButton>` — the unified button

`components/ui/Button.vue`. Renders an explicit native `<button>` / `<a>` /
`<NuxtLink>` — **never** `<component :is="'button'">`, which Vue resolves to the
global PrimeVue Button and drags in an unstyled Ripple that inflates the tap
target (see `memory/reference_ios_button_appearance.md`).

### Props

| Prop                                                        | Values                                             | Notes                                              |
| ----------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `variant`                                                   | `clear` · `dimmed` · `solid` · `outline` · `ghost` | `clear`/`dimmed` are glass; rest are flat          |
| `size`                                                      | `sm` (32px) · `md` (40px) · `lg` (48px)            |                                                    |
| `shape`                                                     | `capsule` · `rounded` (12px) · `circle`            | radius via `--lg-radius`                           |
| `icon`                                                      | icon class, e.g. `pi pi-times`, `pi pi-spotify`    | + `iconPos` `left`/`right`                         |
| `iconOnly`                                                  | boolean                                            | squares the button; **requires `ariaLabel`**       |
| `label` / default slot                                      | text                                               |                                                    |
| `block`                                                     | boolean                                            | full width                                         |
| `to` / `href`                                               | string                                             | renders `<NuxtLink>` / `<a>`; else `<button type>` |
| `disabled`, `loading`, `type`, `ariaLabel`, `target`, `rel` |                                                    | `target="_blank"` auto-adds `rel`                  |

`class` / `@click` / other attrs fall through to the rendered native element
(`inheritAttrs: false` + `v-bind="$attrs"`), so e.g. `id="desktop-share-button"`
still anchors the share popup, and a pass-through `class` can keep a bespoke text
treatment (the contact submit keeps its uppercase via `.submit-button`).

### Variant → family

- **clear** — bright contrast glass (the modal-close look): share-popup close,
  footer social, hero + About slider controls.
- **dimmed** — soft translucent wash (the old `.btn-glassmorphic`): desktop hero
  actions (Music Video/Lyrics/Share), contact submit.
- **solid / outline / ghost** — flat: "Listen Now" (solid), cookie accept (solid)
  / decline (outline).

### Example

```vue
<UiButton
  variant="clear"
  size="sm"
  shape="circle"
  icon-only
  icon="pi pi-times"
  aria-label="Close"
  @click="$emit('close')"
/>

<UiButton variant="solid" size="lg" :icon="icon" :label="t('hero.listen_now')" @click="play" />
```

### Accessibility

Keyboard `:focus-visible` ring on every variant; icon-only buttons need
`ariaLabel`; hover effects are fine-pointer-only; honours reduced-motion /
reduced-transparency via the glass system.

---

## 8. Unification status

**Unified to `<UiButton>` / the glass system:** modal close, share-popup close,
footer social, swiper/carousel arrows (About + Our Team + hero slider), language
switcher + modal close (via shared classes), desktop hero actions, cookie
accept/decline, "Listen Now", contact submit.

**Deliberately kept as-is** (intentional identity / custom animation, not
inconsistency — convert only on request):

- **"Show More"** (`MusicLibrarySection`) — purple brand gradient.
- **Error-page CTA** (`ErrorPage`) — custom ripple/fill.
- **Platform buttons** (`PlatformButton`) — large branded cards with per-platform
  gradients + analytics; they're cards, not generic buttons.
- **Streaming mini-buttons** (`StreamingButtons`) — brand-coloured logos.
- **Text nav / legal / footer links** — links, not button controls; converting
  risks the header glass/scroll-animation system for no visual gain.
- **Mobile hero quick-actions** (`components/music/HeroQuickActions.vue`, the Music
  Video + Lyrics⇄Back morph) — see below.

### Mobile hero quick-actions morph (compositor-only)

The Music Video ⇄ Lyrics/Back morph on `/listen/<slug>` (<md) lives in
`components/music/HeroQuickActions.vue`. It animates **only `translate`, `scale`
and `opacity`**, so it runs on the compositor (Core Animation on iOS). It keeps
full refresh rate (120 Hz on ProMotion iPhones) even while the main thread is busy.
The previous version transitioned a registered `--hqa-p` number that resized the
pills. That ran on the main thread: it dropped frames whenever the page was busy,
and on iPhone it ran at 60 fps next to the 120 fps pane swipe.

- **Nothing resizes.** Each pill's box is laid out at its _largest_ extent. The
  visible pill is the intersection of the pill itself (`overflow: hidden`,
  rounded, never moves) and `.hqa-clip`, a same-size rounded clip that slides
  sideways. The overlap of two equal stadiums offset by `d` is again a stadium, of
  width `w − d`. `.hqa-body` (fill, sheen, rim, content) is counter-slid inside the
  clip, so it stays put while being clipped.
- **Rim.** `.hqa-body::after` draws the rim everywhere except the moving end, and
  `.hqa-cap` (it rides on the clip) draws only the moving end. The masks
  cross-fade over the last 3px of the cap curve. At rest the result matches the
  `HeroPill` rim.
- **Resting geometry is CSS** (`.is-lyrics`), using `100cqw` (the row is
  `container-type: inline-size`). SSR and every resting frame are correct without
  JS. The only JS-measured values are `--mv-label-w` (above 450px the video pill
  keeps its label) and `--hqa-glow-k` (the YouTube glow's squeeze factor; calc()
  cannot divide lengths).
- **Animation = FLIP over computed values.** `capture()` reads each `[data-hqa]`
  part's computed `translate`/`scale`/`opacity`. The class flips, then
  `animate()` animates each changed value with WAAPI. Fades use two overlapping
  windows of eased progress (out over 0–0.6, in over 0.4–1) so the labels never
  double-expose.
- **One clock.** `utils/lyricsMorph.ts` holds the timing (`380ms`,
  `cubic-bezier(.22,1,.36,1)`, ease-out). `MusicDetailContent`'s `setView` creates the pill
  animations, both pane swipes and the container-height tween in one task, so they
  start and end on the same frame. A toggle mid-flight `reverse()`s all of them in
  place.
- WAAPI on `translate`/`scale` is immune to the global perf overrides
  (`* { transition: none }`, `* { transform: none !important }`). Do not move the
  resting offsets to `transform`, or the conservative tier zeroes them. Reduced
  motion swaps instantly.
- **Do not** add CSS transitions on these parts, animate `width`/`flex`/custom
  properties, or put `will-change`/`contain`/`transform` on ancestors of the pills
  (backdrop-root trap, §1). The pills carry no `backdrop-filter`; measured, it made
  ≤5/255 difference on this background.
- Below 360px the video label is the short form (`music.buttons.music_video_short`):
  "Дивитись Кліп" does not fit half of a 320px row.

When adding a button: reach for `<UiButton>`. Only drop to bespoke CSS for a
genuinely distinct identity, and if it's glass, build on `.liquid-glass` +
`.liquid-glass-interactive` so it inherits the shared morph and the fallbacks.
