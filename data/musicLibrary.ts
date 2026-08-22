/**
 * Optional per-release theming override for the cover-driven release page
 * atmosphere (see composables/useReleaseTheme.ts). Every field is optional and
 * falls back, field by field, to the auto-extracted palette in
 * `data/coverColors.generated.ts` (run `npm run extract-colors`), then to a
 * deterministic hash fallback. Use this to hand-tune covers that extract to a
 * muddy/monochrome palette, or to give a special drop a bespoke treatment.
 */
export interface ReleaseTheme {
  /** Most vibrant dominant colour (hex). */
  primary?: string
  /** Second hue-separated colour for the aura mesh (hex). */
  secondary?: string
  /** Third accent colour (hex). */
  accent?: string
  /** Tinted near-black base for the page background (hex). */
  dark?: string
  /** Light tint for highlights / title glow (hex). */
  light?: string
  /** Explicit colour list for the aura blobs (primary first); defaults to [primary, secondary, accent]. */
  palette?: string[]
  /**
   * Atmosphere treatment. 'bloom' (default) = ambient blurred cover + palette
   * aura. 'liquid' = animated displacement distortion (high-perf desktop only,
   * gracefully falls back to bloom elsewhere). Reserved for bespoke drops.
   */
  variant?: 'bloom' | 'liquid'
  /** 0–1 multiplier on effect intensity (bloom opacity / aura strength). Default 1. */
  intensity?: number
}

/**
 * Canonical song-part keys for a lyrics section. Each maps to a localized label
 * under the `music.parts.{key}` i18n namespace (e.g. 'verse' → "Verse" / "Куплет").
 * To add a new part, extend this union AND add the key to `music.parts` in BOTH
 * locale files (locales/uk.json + locales/en.json).
 */
export type LyricsPartKey =
  | 'intro'
  | 'verse'
  | 'pre_chorus'
  | 'chorus'
  | 'post_chorus'
  | 'hook'
  | 'bridge'
  | 'refrain'
  | 'interlude'
  | 'outro'

/**
 * One labeled section of a song's lyrics. Lyrics are stored in the song's
 * ORIGINAL language — the lines are never translated; only the section LABEL is
 * localized via `part`. See components/music/Lyrics.vue for rendering.
 */
export interface LyricsSection {
  /**
   * Song-part key → localized heading via `music.parts.{part}`. Omit it (or use
   * a key that has no translation) to render the lines with NO heading.
   */
  part?: LyricsPartKey
  /** Optional ordinal appended to the label, e.g. `num: 2` → "Verse 2" / "Куплет 2". */
  num?: number
  /** The section's lines, in order. One array entry = one rendered line. */
  lines: string[]
}

export interface MusicRelease {
  id: string
  slug: string
  title: string
  /** i18n key for localized title; falls back to slug-based default when omitted */
  titleKey?: string
  type: 'single' | 'album' | 'ep' | 'new release'
  releaseDate?: string // ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss' or 'YYYY-MM-DDTHH:mm:ssZ'
  imageUrl: string
  blurredImageUrl?: string
  /** Optional cover-driven theme override; see ReleaseTheme. */
  theme?: ReleaseTheme
  description?: string
  /** i18n key for localized description; falls back to slug-based default when omitted */
  descriptionKey?: string
  /** Per-release genre(s) for the schema.org MusicRecording (English genre names). */
  genre?: string[]
  featured?: boolean
  /**
   * Optional song lyrics in the song's original language, split into labeled
   * sections (verse/chorus/…). When present and non-empty, the release page
   * shows a Lyrics button that swaps the platform links for the lyrics view.
   * Section labels localize via `music.parts.*`; the lines do not translate.
   */
  lyrics?: LyricsSection[]
  musicPlatformLinks: {
    spotify?: string
    appleMusic?: string
    youtubeMusic?: string
    deezer?: string
    soundcloud?: string
    bandcamp?: string
    tidal?: string
    amazonMusic?: string
    musicVideo?: string
  }
  preSaveMusicPlatformLinks?: {
    spotify?: string
    appleMusic?: string
    youtubeMusic?: string
    deezer?: string
    soundcloud?: string
    bandcamp?: string
    tidal?: string
    amazonMusic?: string
  }
  /** If true and distributorPreSaveUrl is set, redirect to distributor's pre-save page instead of showing custom page */
  useDistributorPreSave?: boolean
  /** Direct link to distributor's pre-save page (e.g., DistroKid, TuneCore, etc.) */
  distributorPreSaveUrl?: string
  /**
   * When true, suppress the synthetic `platform_click` (platform_name: 'distributor')
   * conversion event fired on the automatic distributor redirect. Use for distributor
   * smart-links (e.g. feature.fm/ffm.to) where the real save happens off-site and can't
   * be measured here — an auto-redirect click would just record a meaningless 100%
   * conversion. `release_view` still fires, so per-source visits are still counted.
   * See the pre-save pages' onMounted hook.
   */
  skipDistributorConversionEvent?: boolean
  /**
   * Released-state distributor smart-link (e.g. feature.fm) shown as a single
   * "Listen on all platforms" CTA on the /listen page when `musicPlatformLinks`
   * is still empty — per-platform DSP links often only become available after
   * release. Unlike `distributorPreSaveUrl` this does NOT redirect: the listen
   * page stays a real, indexable page (canonical + JSON-LD) and links out via the
   * button. The moment any `musicPlatformLinks` entry is added, the normal
   * platform grid replaces the CTA automatically.
   */
  releaseSmartLink?: string
}

export const musicLibrary: MusicRelease[] = [
  {
    id: '4',
    slug: 'khvyli',
    title: 'Хвилі',
    titleKey: 'releases.khvyli.title',
    type: 'single',
    releaseDate: '2026-08-20T21:00:00Z', // Midnight Kyiv time (EEST/UTC+3) → 00:00 on 2026-08-21
    imageUrl: '/images/optimized/albums-images/khvyli/cover.avif',
    // No `blurredImageUrl` on purpose: the artwork was already public before the
    // drop, so the card always showed it sharp — first in pre-save mode, now in
    // released mode. Both use `imageUrl` directly (never the blurred variant).
    descriptionKey: 'releases.khvyli.description',
    genre: ['Alternative rock', 'Art rock'],
    featured: true,
    // Auto-extracted palette (deep water blue #165fc0 / dusk violet / mauve) is
    // vibrant and on-cover — no `theme` override needed.
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/track/1xR3GJBaTDBEjbPfP1GZKA?si=f6099a20ebe84d04',
      appleMusic:
        'https://music.apple.com/ua/album/%D1%85%D0%B2%D0%B8%D0%BB%D1%96/6798661748?i=6798661787',
      youtubeMusic:
        'https://music.youtube.com/playlist?list=OLAK5uy_ngUYnTMnsohOXKCGixPVj7HWBy7BhGw9M&si=MCB2mOqeXizHV7gj',
      deezer: 'https://www.deezer.com/track/4207536592',
      musicVideo: 'https://www.youtube.com/watch?v=O16BONZgf6E'
    },
    useDistributorPreSave: true,
    distributorPreSaveUrl: 'https://kontrabass.lnk.to/khvyli',
    // Linkfire handles the actual save off-site, so skip the synthetic
    // distributor conversion event — only the per-source `release_view` is
    // meaningful here.
    skipDistributorConversionEvent: true,
    // The same Linkfire link flips to a streaming chooser after release. Used as
    // the "Listen on all platforms" CTA on /listen/khvyli until the individual
    // platform links are filled in (then the grid replaces the CTA).
    releaseSmartLink: 'https://kontrabass.lnk.to/khvyli',
    lyrics: [
      {
        part: 'chorus',
        lines: [
          'Ти зникаєш в звуках хвиль.',
          'Моїх бажань, твоїх зусиль.',
          'У блакить від гріха.',
          'Світ кричить, що я лиха.'
        ]
      },
      {
        part: 'verse',
        lines: [
          'і мов в тумані.',
          'Є мотив, є алібі.',
          'Скелі хвилями точать образи,',
          'Що ховаються в моїй душі.',
          'Безпричинно залишив лиш бриз.',
          'Моя брехня лишиться зі мною.',
          'І правда каменем на глибині,',
          'ти забереш її з собою.'
        ]
      },
      {
        part: 'bridge',
        lines: ['Зникни-и-и', 'А-а-а-а-а', 'Назавжди-и-и-и']
      },
      {
        part: 'chorus',
        lines: [
          'Ти зникаєш в звуках хвиль.',
          'Моїх бажань, твоїх зусиль.',
          'У блакить від гріха.',
          'Світ кричить, що я лиха-а-а-а-а'
        ]
      }
    ]
  },
  {
    id: '3',
    slug: 'alina',
    title: 'Аліна',
    titleKey: 'releases.alina.title',
    type: 'single',
    releaseDate: '2026-06-11T21:00:00Z', // Midnight Kyiv time (EEST/UTC+3) → 00:00 on 2026-06-12
    imageUrl: '/images/optimized/albums-images/alina/cover.avif',
    descriptionKey: 'releases.alina.description',
    genre: ['Alternative rock', 'Punk rock'],
    featured: true,
    // Auto-extraction picks the green room walls as the accent (#659e39), which
    // tints the lyrics section labels green. Override the accent with a soft
    // pastel coral that matches the warm peach-pink rug glow on the cover — keeps
    // the warm taupe bloom (primary/secondary) from the generated palette.
    theme: {
      accent: '#f4a890'
    },
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/track/13UFLpXjAoVNW3IKCW6Hzf?si=0fbc733064b94732',
      appleMusic:
        'https://music.apple.com/ua/album/%D0%B0%D0%BB%D1%96%D0%BD%D0%B0/6774072720?i=6774072728',
      youtubeMusic: 'https://music.youtube.com/watch?v=wxuovrzFW78&si=81JjXjcu2NJ4uNHE',
      deezer: 'https://www.deezer.com/track/4048321671'
    },
    useDistributorPreSave: true,
    distributorPreSaveUrl: 'https://id.ffm.to/alina',
    // feature.fm handles the actual save off-site, so skip the synthetic distributor
    // conversion event — only the per-source `release_view` is meaningful here.
    skipDistributorConversionEvent: true,
    // After release, the same feature.fm link flips to a streaming chooser. Used
    // as the "Listen on all platforms" CTA on /listen/alina until the individual
    // platform links are filled in (then the grid replaces the CTA).
    releaseSmartLink: 'https://id.ffm.to/alina',
    lyrics: [
      {
        part: 'verse',
        num: 1,
        lines: [
          'Забув своє імʼя, а може й загубив',
          'Напередодні дня ще одне собі створив',
          'Розбещений Іван та цнотлива Марія',
          'Та улюбленим імʼям назавжди було Поліна',
          'Цей світ на тебе тисне, тебе не розуміють',
          'Та лише та сама тебе до серця пригріє',
          'Друкуєш старими пальцями на телефоні',
          'Своїй найкращі подружці «ну як там в тебе в школі?»'
        ]
      },
      {
        part: 'chorus',
        lines: [
          'Що скаже твоя мама дізнавшись всі секрети',
          'сорокорічний син в Інтернеті прикидається юною леді'
        ]
      },
      {
        part: 'verse',
        num: 2,
        lines: [
          'Надягнув свій улюблений образ',
          'Він так довго чекав на цю ніч',
          'Темно синій кашкет та невкладені вуса',
          'Аліна чекай. Твоя подруга клас',
          'В парку темно, нікого немає.',
          'Лише зморщені два мужика',
          'Ти підійдеш до нього й спитаєш: Аліна?'
        ]
      }
    ]
  },
  {
    id: '2',
    slug: 'chorni-ptahy',
    title: 'Чорні Птахи',
    titleKey: 'releases.chorni_ptahy.title',
    type: 'single',
    releaseDate: '2026-02-06T00:00:00Z', // Midnight Ukraine time (EET/UTC+2)
    imageUrl: '/images/optimized/albums-images/chorni-ptahy/cover.avif',
    blurredImageUrl: '/images/albums-images/chorni-ptahy/cover-blurred.jpg',
    // The cover is near-monochrome, so auto-extraction lands on a dull mauve
    // (`#7e5858`). Override with a cold, cinematic steel-blue palette that suits
    // the stark "Black Birds" mood and reads as intentional rather than muddy.
    theme: {
      primary: '#4f6d8a',
      secondary: '#5d6b80',
      accent: '#7d93ab',
      dark: '#0b0e12',
      light: '#d4dde6'
    },
    descriptionKey: 'releases.chorni_ptahy.description',
    genre: ['Alternative rock', 'Art rock'],
    featured: true,
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/track/2hujOwcGE21eCQHMz61y75?si=4VZFobFORxWvdNGEgYbzjg',
      youtubeMusic: 'https://music.youtube.com/watch?v=R6mQB60MUuI&si=TPuJo7qYlrI73Z2R',
      appleMusic:
        'https://music.apple.com/us/song/%D1%87%D0%BE%D1%80%D0%BD%D1%96-%D0%BF%D1%82%D0%B0%D1%85%D0%B8/1868500237',
      amazonMusic:
        'https://music.amazon.com/tracks/B0GGDZGYMF?marketplaceId=ATVPDKIKX0DER&musicTerritory=US&ref=dm_sh_jczvFMarQXoSYTGIbtHUMZ10W'
    },
    useDistributorPreSave: true,
    distributorPreSaveUrl: 'https://artists.landr.com/057914578996',
    preSaveMusicPlatformLinks: {
      spotify:
        'https://accounts.spotify.com/authorize?response_type=code&client_id=5a14783d79444ee9babd9176b256979e&scope=user-follow-modify+user-library-modify+playlist-modify-public+playlist-modify-private+user-read-email+user-read-private&redirect_uri=https%3A%2F%2Flnk.to%2F~%2Fprerelease%2Fspotify&state=bFVybD1hcnRpc3RzLmxhbmRyLmNvbSUyRjA1NzkxNDU3ODk5NiZzSWQ9ZjBlYjk2NTUtYjFkZS00OWE2LWI4OGQtN2ZlNGFlMTFhYTU1JnRJZD01NzdhMGYwMi00OWVlLTRhNzgtYjdlOS1mNTA1Yzk1ZjUxOGQmdT1odHRwcyUzQSUyRiUyRmFydGlzdHMubGFuZHIuY29tJTJGMDU3OTE0NTc4OTk2JnZ0PWM0ZjkxMzQzOTdmM2U0NjAzOTk4MTQ2NDBmYjg0ZTg3JnZ1PTY5MDFlNTkwYjdhNTM3LjM1Mjk0MDk3JnJmPWh0dHBzJTNBJTJGJTJGd3d3LndibWJhbmQuY29tJTJG'
    },
    lyrics: [
      {
        part: 'verse',
        num: 1,
        lines: [
          'Я руйнівник серед близької тобі сотні',
          'Їх дуже мало, але їхній рух є зворотнім',
          'Твоєму бажанню бути на самоті',
          'Їм буде тебе так жаль, і вони не ті'
        ]
      },
      {
        part: 'chorus',
        lines: [
          'Чорні птахи непомітні на фоні бруду',
          'Зграї летять у небо, кричать: «Не буду',
          'Не буду, не буду вбивати в собі дитя',
          'Люблю літати, літати, люблю життя»',
          'Небо гримить у лихій мовчазній згоді',
          'Не пробачає слабкість у непогоді',
          'У небі рятує лиш каяття',
          'І так все життя',
          'І так все життя',
          'Триває'
        ]
      },
      {
        part: 'verse',
        num: 2,
        lines: [
          'А я саме той, кого ти не шукала ніколи',
          'Ти знаєш, нас вчать жити серед людей зі школи',
          'Ми стрибаємо із порожнечі в ще більший вакуум',
          'Здаємось не в змозі хоч якось піти в атаку',
          'Кидаємо спроби шукати далекі мрії',
          'Ми живем тихо, а знаєш, всі ці Марії',
          'Що мали б колись народити свого Христа',
          'Зʼїдають його в собі, зачиняють вуста'
        ]
      },
      {
        part: 'chorus',
        lines: [
          'Чорні птахи непомітні на фоні бруду',
          'Зграї летять у небо, кричать: «Не буду',
          'Не буду, не буду вбивати в собі дитя',
          'Люблю літати, літати, люблю життя»',
          'Небо гримить у лихій мовчазній згоді',
          'Не пробачає слабкість у непогоді',
          'У небі рятує лиш каяття',
          'І так все життя',
          'І так все життя',
          'Триває'
        ]
      },
      {
        part: 'outro',
        lines: [
          'Ти повіриш мені, ти вийдеш із небуття',
          'З криком ламаючи сумніви й каяття',
          'І я руйнівник тої тиші, в якій ти живеш',
          'Подарунком свободи зламаю і тебе теж'
        ]
      }
    ]
  },
  {
    id: '1',
    slug: 'mania',
    title: 'Mania',
    titleKey: 'releases.mania.title',
    type: 'single',
    releaseDate: '2025-11-14T12:00:00Z',
    imageUrl: '/images/optimized/albums-images/mania/cover.avif',
    blurredImageUrl: '/images/albums-images/mania/cover-blurred.jpg',
    descriptionKey: 'releases.mania.description',
    genre: ['Alternative rock', 'Pop rock'],
    featured: true,
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/0pjAORRhgVsS7eP4R6JbMF?go=1',
      appleMusic:
        'https://music.apple.com/ua/album/1849021879?app=music&at=1l3vpUI&ct=LFV_42c959c7fa393b8da43ecd14d3420636&itscg=30440&itsct=catchall_p1&lId=214367132&cId=none&sr=1&src=Linkfire&ls=1',
      youtubeMusic:
        'https://music.youtube.com/playlist?list=OLAK5uy_kYiOPbe8RWJzftzhv3KjQHg6gsR_aa8HQ&src=Linkfire&lId=d0225857-ffa6-4866-94dd-63ec2394cfd0&cId=d3d58fd7-4c47-11e6-9fd0-066c3e7a8751',
      amazonMusic:
        'https://music.amazon.com/albums/B0FXYHVS59?marketplaceId=ATVPDKIKX0DER&musicTerritory=US&ref=dm_sh_O0FTj6Yaw48FAewockBknpO7w',
      deezer: 'https://link.deezer.com/s/31BimrANA5l0xTuEjk4YW',
      musicVideo: 'https://www.youtube.com/watch?v=z_uH1gA9Gwo'
    },
    useDistributorPreSave: true,
    distributorPreSaveUrl: 'https://artists.landr.com/057829908413',
    lyrics: [
      {
        part: 'verse',
        num: 1,
        lines: [
          'Білий дим',
          'Якби ти був тільки моїм',
          'А так належиш всім підряд',
          'Але повія тільки я, повія тільки',
          'Так розболілась голова',
          'Так розболілась голова',
          'Так розболілась голова'
        ]
      },
      {
        part: 'chorus',
        lines: [
          'На руках попелом, подихом, пострілом одним',
          'Ти мій, ти мій',
          'Манія, по губах стікає біль твоя',
          'Бо ти назавжди мій, ти мій'
        ]
      },
      {
        part: 'verse',
        num: 2,
        lines: [
          'Спробував крізь мої пальці утекти',
          'Хочеш віддатись світові',
          'Але належиш лиш мені',
          'Білий дим, зроблю покірним і німим',
          'Лиш в замкнутому просторі',
          'Можемо існувати ми'
        ]
      },
      {
        part: 'refrain',
        lines: [
          'Білий дим, якби ти був тільки моїм',
          'А так належиш всім підряд',
          'Але повія тільки я'
        ]
      },
      {
        part: 'chorus',
        lines: [
          'На руках попелом, подихом, пострілом одним',
          'Ти мій, ти мій',
          'Манія, по губах стікає біль твоя',
          'Бо ти назавжди мій, ти мій',
          'Ти мій, ти мій, ти мій'
        ]
      },
      {
        part: 'outro',
        lines: ['Ти', 'Ти', 'Ти', 'Ти мій']
      }
    ]
  }
]

// Helper functions
export const getFeaturedReleases = (): MusicRelease[] => {
  return musicLibrary.filter((release) => release.featured)
}

// Releases without a date should be considered "newest" / far future
const getReleaseTime = (date?: string) => {
  return date ? new Date(date).getTime() : 8640000000000000 // Max safe timestamp
}

export const getLatestReleases = (limit: number = 4): MusicRelease[] => {
  // Copy before sorting — Array.prototype.sort mutates in place, and sorting the
  // shared module-level `musicLibrary` would corrupt its order for every other
  // consumer (and across repeated calls).
  return [...musicLibrary]
    .sort((a, b) => getReleaseTime(b.releaseDate) - getReleaseTime(a.releaseDate))
    .slice(0, limit)
}

export const getReleasesByType = (type: MusicRelease['type']): MusicRelease[] => {
  return musicLibrary.filter((release) => release.type === type)
}

export const getAllReleases = (): MusicRelease[] => {
  // Copy before sorting (see getLatestReleases) so the shared array isn't mutated.
  return [...musicLibrary].sort(
    (a, b) => getReleaseTime(b.releaseDate) - getReleaseTime(a.releaseDate)
  )
}

export const getReleaseBySlug = (slug: string): MusicRelease | undefined => {
  return musicLibrary.find((release) => release.slug === slug)
}

// Releases that ship a non-empty lyrics array. Drives which slugs get a
// dedicated, indexable /lyrics/<slug> page (prerender list + sitemap).
export const getReleasesWithLyrics = (): MusicRelease[] => {
  return musicLibrary.filter((release) => Boolean(release.lyrics && release.lyrics.length > 0))
}

export const releaseHasLyrics = (slug: string): boolean => {
  const release = getReleaseBySlug(slug)
  return Boolean(release?.lyrics && release.lyrics.length > 0)
}

export const getReleaseById = (id: string): MusicRelease | undefined => {
  return musicLibrary.find((release) => release.id === id)
}

/**
 * Get the nearest upcoming release that has pre-save links
 * @returns The nearest upcoming release with pre-save, or undefined if none found
 */
export const getNearestUpcomingPreSaveRelease = (): MusicRelease | undefined => {
  const now = new Date().getTime()

  // Filter releases that are upcoming and have pre-save links
  const upcomingWithPreSave = musicLibrary.filter((release) => {
    // If no release date, it's definitely in future, but we check if it has links
    const releaseTime = getReleaseTime(release.releaseDate)
    const hasPreSaveLinks =
      (release.preSaveMusicPlatformLinks &&
        Object.keys(release.preSaveMusicPlatformLinks).length > 0) ||
      !!release.distributorPreSaveUrl
    return releaseTime > now && hasPreSaveLinks
  })

  // Sort by release date (nearest first) and return the first one
  if (upcomingWithPreSave.length === 0) return undefined

  return upcomingWithPreSave.sort((a, b) => {
    return getReleaseTime(a.releaseDate) - getReleaseTime(b.releaseDate)
  })[0]
}
