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
| `icon`                                                      | icon class, e.g. `pi pi-times`, `fab fa-spotify`   | + `iconPos` `left`/`right`                         |
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

When adding a button: reach for `<UiButton>`. Only drop to bespoke CSS for a
genuinely distinct identity, and if it's glass, build on `.liquid-glass` +
`.liquid-glass-interactive` so it inherits the shared morph and the fallbacks.
