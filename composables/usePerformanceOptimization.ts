/**
 * Advanced Performance Optimization Composable
 * Mobile-first approach: Low performance by default on mobile, high performance only for flagships
 * Desktop: Maintains current detection system
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

interface DeviceMetrics {
  deviceMemory: number
  hardwareConcurrency: number
  effectiveType: string
  pixelRatio: number
  isMobile: boolean
  isTablet: boolean
  screenWidth: number
  screenHeight: number
  deviceModel: string
  isFlagship: boolean
  gpuTier: 'low' | 'medium' | 'high'
  /** Positive evidence of a genuinely slow GPU (software rasterizer / old GPU). */
  gpuWeak: boolean
}

interface PerformanceLevel {
  level: 'high' | 'medium' | 'low'
  score: number
  enableAnimations: boolean
  enableBackdropBlur: boolean
  enableComplexGradients: boolean
  enableFloatingEffects: boolean
  enableParallax: boolean
  maxAnimationCount: number
  blurStrength: number
  animationDuration: number
  mobileStrategy: 'flagship' | 'standard' | 'conservative'
}

export function usePerformanceOptimization() {
  const deviceMetrics = ref<DeviceMetrics>({
    deviceMemory: 4,
    hardwareConcurrency: 4,
    effectiveType: '4g',
    pixelRatio: 1,
    isMobile: false,
    isTablet: false,
    screenWidth: 1920,
    screenHeight: 1080,
    deviceModel: 'unknown',
    isFlagship: false,
    gpuTier: 'medium',
    gpuWeak: false
  })

  const performanceLevel = ref<PerformanceLevel>({
    level: 'high',
    score: 10,
    enableAnimations: true,
    enableBackdropBlur: true,
    enableComplexGradients: true,
    enableFloatingEffects: true,
    enableParallax: true,
    maxAnimationCount: 10,
    blurStrength: 12,
    animationDuration: 1,
    mobileStrategy: 'standard'
  })

  const prefersReducedMotion = ref(false)

  // Flagship device detection patterns. Matched against the UA string AND the
  // UA-Client-Hints `model` (Chromium Android) AND the WebGL renderer — because
  // modern Android Chrome freezes the UA model to "K", so the model only shows
  // up via Client Hints, and the GPU only via the WebGL renderer.
  const FLAGSHIP_DEVICES = {
    iphone: [/iPhone1[2-9],/i, /iPhone[2-9]\d,/i],
    samsung: [
      /SM-[SFN]\d{3}/i, // Galaxy S / Z Fold / Z Flip / Note flagships
      /SM-A[5-9]\d{2}/i // Galaxy A5x–A9x upper mid-range (capable)
    ],
    google: [/Pixel ([6-9]|1\d)/i], // Pixel 6 … 19 (+ Pro/a)
    oneplus: [/OnePlus ([89]|1\d)/i, /CPH2\d{3}/i, /[A-Z]E2\d{3}/i, /ONEPLUS A\d/i],
    xiaomi: [/(?:Xiaomi|Mi) 1\d/i, /Redmi K[3-9]\d/i, /POCO [FX]\d/i, /\b2[34]\d{2}[A-Z]/i],
    oppovivo: [/CPH2\d{3}/i, /\bV2\d{3}\b/i, /iQOO/i],
    others: [
      /Nothing Phone/i,
      /\bA06[0-9]\b/i, // Nothing build codes
      /ASUS_AI2[0-9]/i,
      /ROG Phone/i, // Asus gaming
      /XQ-[A-Z]{2}\d{2}/i // Sony Xperia 1/5
    ]
  }

  // GPU buckets. `high`/`medium` confirm capability; `weak` is POSITIVE evidence
  // of a genuinely slow GPU (software rasterizer or old mobile GPU) — the only
  // thing that should push a device down to the flat fallback.
  const GPU_TIER_INDICATORS = {
    high: [
      /iPhone1[2-9],/i,
      /iPad1[3-9],/i,
      /Apple M\d/i, // Apple Silicon Mac
      /Apple GPU/i, // iOS WebGL renderer (generic) — treat as high by platform
      /Adreno \(TM\) (6[5-9]\d|[78]\d\d)/i, // Adreno 650+, 7xx, 8xx
      /Mali-G(7[1-9]|[89]\d)/i, // Mali-G71x … G9xx
      /Immortalis-G\d{3}/i, // ARM Immortalis (all flagship)
      /Xclipse \d{3}/i, // Samsung RDNA
      /(RTX|GTX 1[6-9]|Radeon RX|\bArc\b|Iris Xe)/i // desktop dGPU / modern iGPU
    ],
    medium: [
      /iPhone(?:9|10|11),/i,
      /iPad[6-9],/i,
      /Adreno \(TM\) (5[5-9]\d|6[0-4]\d)/i, // Adreno 55x–64x
      /Mali-G(5[2-9]|6\d|7[01])/i, // Mali-G52 … G710
      /Intel\(R\) (UHD|Iris)/i
    ],
    weak: [
      /SwiftShader|llvmpipe|Microsoft Basic Render|Software/i, // software rasterizer
      /Adreno \(TM\) [1-4]\d\d/i, // Adreno < 500
      /Mali-(4|T\d|G3\d|G5[01])/i, // old Mali
      /PowerVR/i
    ]
  }

  // Detect device characteristics
  const detectDeviceModel = (
    userAgent: string
  ): {
    model: string
    isFlagship: boolean
    gpuTier: 'low' | 'medium' | 'high'
    gpuWeak: boolean
  } => {
    const ua = userAgent.toLowerCase()

    // Check flagship devices
    let isFlagship = false
    for (const [brand, patterns] of Object.entries(FLAGSHIP_DEVICES)) {
      if (patterns.some((pattern) => pattern.test(userAgent))) {
        isFlagship = true
        break
      }
    }

    // iOS: modern Safari/WebKit UA hides the hardware model (and iOS has no UA
    // Client Hints to recover it), so the regexes above can't identify an
    // iPhone — leaving it stuck on the 'low' tier, which FLATTENS the glass
    // (backdrop-filter:none) and was why Liquid Glass never appeared on iOS.
    // Every iOS device runs the same capable WebKit and handles -webkit-
    // backdrop-filter fine, so treat iOS as a capable flagship.
    if (/iphone|ipad|ipod/i.test(ua)) {
      isFlagship = true
    }

    // Determine GPU tier. `low` here is the UNKNOWN default (not a downgrade
    // signal); `gpuWeak` is POSITIVE evidence of a genuinely slow GPU (software
    // rasterizer / old mobile GPU) — the only GPU signal that forces a downgrade.
    // `signal` is the UA plus, on Android, the WebGL renderer + Client-Hints
    // model (passed in), since the bare UA no longer carries model/GPU info.
    let gpuTier: 'low' | 'medium' | 'high' = 'low'
    if (GPU_TIER_INDICATORS.high.some((pattern) => pattern.test(userAgent))) {
      gpuTier = 'high'
    } else if (GPU_TIER_INDICATORS.medium.some((pattern) => pattern.test(userAgent))) {
      gpuTier = 'medium'
    }
    const gpuWeak = GPU_TIER_INDICATORS.weak.some((pattern) => pattern.test(userAgent))

    // Extract a human-ish model name for debugging.
    let model = 'unknown'
    const iphoneMatch = userAgent.match(/iPhone[0-9,]+/i)
    const samsungMatch = userAgent.match(/SM-[A-Z0-9]+/i)
    const pixelMatch = userAgent.match(/Pixel [0-9]+( Pro)?/i)

    if (iphoneMatch) model = iphoneMatch[0]
    else if (samsungMatch) model = samsungMatch[0]
    else if (pixelMatch) model = pixelMatch[0]

    return { model, isFlagship, gpuTier, gpuWeak }
  }

  // Read the real GPU from the WebGL renderer — the most reliable GPU signal on
  // Android (the UA no longer carries it). Returns '' if blocked/unavailable
  // (Safari returns a generic "Apple GPU"; privacy browsers may return null).
  const detectGpuRenderer = (): string => {
    if (typeof document === 'undefined') return ''
    try {
      const canvas = document.createElement('canvas')
      const gl = (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
      if (!gl) return ''
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = dbg
        ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string)
        : (gl.getParameter(gl.RENDERER) as string)
      return renderer || ''
    } catch {
      return ''
    }
  }

  // Computed properties for easy access
  const isLowPerformanceDevice = computed(() => performanceLevel.value.level === 'low')
  const isMediumPerformanceDevice = computed(() => performanceLevel.value.level === 'medium')
  const isHighPerformanceDevice = computed(() => performanceLevel.value.level === 'high')
  const shouldReduceAnimations = computed(
    () => prefersReducedMotion.value || performanceLevel.value.level === 'low'
  )

  // Performance-based CSS variables
  const performanceCSSVars = computed(() => ({
    '--perf-blur-strength': `${performanceLevel.value.blurStrength}px`,
    '--perf-animation-duration': `${performanceLevel.value.animationDuration}s`,
    '--perf-max-animations': performanceLevel.value.maxAnimationCount.toString(),
    '--perf-opacity':
      performanceLevel.value.level === 'low'
        ? '0.8'
        : performanceLevel.value.level === 'medium'
          ? '0.9'
          : '1'
  }))

  const detectDeviceCapabilities = () => {
    if (typeof window === 'undefined') return

    const navigator = window.navigator as any
    const screen = window.screen
    const userAgent = navigator.userAgent || ''

    // Detect device characteristics. Feed the WebGL renderer alongside the UA so
    // the GPU regexes can identify Android GPUs (the bare UA no longer carries
    // them); the Client-Hints model is folded in later (async) below.
    const gpuRenderer = detectGpuRenderer()
    const deviceInfo = detectDeviceModel(`${userAgent} ${gpuRenderer}`)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    )
    const isTablet =
      /(iPad|Android.*tablet|Windows.*touch)/i.test(userAgent) && !/Mobile/i.test(userAgent)

    // Collect device metrics with all required fields
    deviceMetrics.value = {
      deviceMemory: navigator.deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      effectiveType: navigator.connection?.effectiveType || '4g',
      pixelRatio: window.devicePixelRatio || 1,
      isMobile,
      isTablet,
      screenWidth: screen.width || window.innerWidth,
      screenHeight: screen.height || window.innerHeight,
      deviceModel: deviceInfo.model,
      isFlagship: deviceInfo.isFlagship,
      gpuTier: deviceInfo.gpuTier,
      gpuWeak: deviceInfo.gpuWeak
    }

    // Read current reduced-motion preference (the live `change` listener is
    // wired once in onMounted and torn down in onUnmounted — see below — so it
    // is NOT registered here, which used to add a new listener on every resize).
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    calculatePerformanceLevel()

    // ── Recover the real device model on Chromium (UA Client Hints) ───────────
    // Chrome's User-Agent Reduction freezes the device model in `navigator.userAgent`
    // to a placeholder ("K") and pins the Android version to 10, so the UA-regex
    // flagship/GPU detection above misses EVERY recent Android phone — they all
    // fall through to 'low'/'conservative' (which then disables transforms &
    // transitions site-wide). UA Client Hints still expose the real model; query
    // it asynchronously and re-evaluate so flagships are classified correctly.
    const uaData = navigator.userAgentData
    if (uaData?.getHighEntropyValues) {
      uaData
        .getHighEntropyValues(['model'])
        .then((hints: { model?: string }) => {
          const model = hints?.model?.trim()
          if (!model) return
          const info = detectDeviceModel(`${model} ${gpuRenderer}`)
          const next = { ...deviceMetrics.value }
          let changed = false
          if (info.isFlagship && !next.isFlagship) {
            next.isFlagship = true
            changed = true
          }
          if (info.gpuTier !== 'low' && next.gpuTier === 'low') {
            next.gpuTier = info.gpuTier
            changed = true
          }
          if (info.model !== 'unknown' && next.deviceModel === 'unknown') {
            next.deviceModel = info.model
            changed = true
          }
          if (changed) {
            deviceMetrics.value = next
            calculatePerformanceLevel()
          }
        })
        .catch(() => {
          /* Client Hints unavailable or blocked — keep the UA-based estimate. */
        })
    }
  }

  const calculatePerformanceLevel = () => {
    const metrics = deviceMetrics.value

    // Mobile strategy: CAPABLE-BY-DEFAULT. UA Reduction (Android freezes the
    // model to "K") + iOS privacy mean we usually can't identify the device, so
    // assume it's capable (glass shows) and only downgrade on POSITIVE
    // weak-evidence. This inverts the old "default low, upgrade only known
    // flagships" logic that wrongly flattened iPhones and the Pixel 10 Pro.
    if (metrics.isMobile && !metrics.isTablet) {
      let mobileStrategy: 'flagship' | 'standard' | 'conservative' = 'standard'
      let level: PerformanceLevel['level'] = 'medium'

      if (metrics.isFlagship || metrics.gpuTier === 'high') {
        // Confirmed-capable (flagship model via Client Hints, or a high-tier GPU
        // from the WebGL renderer) → full effect. NEVER downgraded — this is the
        // guarantee against false-lows.
        mobileStrategy = 'flagship'
        level = 'high'
      } else {
        // Unknown device: capable by default (medium). Downgrade to the flat low
        // tier ONLY on positive weak-evidence — a software/old GPU (gpuWeak) or
        // two agreeing weak hardware signals. Absent values default to capable
        // (deviceMemory/hardwareConcurrency fall back to 4; iOS clamps cores to 2
        // but is already 'flagship' above, so it never reaches here).
        const lowRam = metrics.deviceMemory <= 2
        const lowCores = metrics.hardwareConcurrency <= 3
        const slowNet = metrics.effectiveType === '2g' || metrics.effectiveType === 'slow-2g'
        if (metrics.gpuWeak || (lowRam && lowCores) || (lowRam && slowNet)) {
          mobileStrategy = 'conservative'
          level = 'low'
        }
      }

      // NOTE: prefers-reduced-motion no longer forces the 'low' tier — that
      // would needlessly flatten the (static) glass on capable devices. It is
      // honoured separately via enableAnimations / shouldReduceAnimations.

      // Set mobile performance configuration
      performanceLevel.value = {
        level,
        score: level === 'high' ? 15 : level === 'medium' ? 10 : 5,
        mobileStrategy,
        enableAnimations: level !== 'low' && !prefersReducedMotion.value,
        enableBackdropBlur: level === 'high' && mobileStrategy === 'flagship',
        enableComplexGradients: level === 'high',
        enableFloatingEffects: false, // Always disabled on mobile for battery life
        enableParallax: false, // Always disabled on mobile for performance
        maxAnimationCount: level === 'high' ? 5 : level === 'medium' ? 3 : 1,
        blurStrength: level === 'high' ? 8 : level === 'medium' ? 4 : 0,
        animationDuration: level === 'high' ? 0.6 : level === 'medium' ? 0.4 : 0.2
      }
    } else {
      // Desktop/Tablet - use original scoring system
      let score = 10 // Start with base score

      // Memory scoring
      if (metrics.deviceMemory >= 8) score += 4
      else if (metrics.deviceMemory >= 4) score += 2
      else if (metrics.deviceMemory >= 2) score += 0
      else score -= 3

      // CPU scoring
      if (metrics.hardwareConcurrency >= 8) score += 4
      else if (metrics.hardwareConcurrency >= 6) score += 3
      else if (metrics.hardwareConcurrency >= 4) score += 2
      else if (metrics.hardwareConcurrency >= 2) score += 0
      else score -= 3

      // Network scoring
      if (metrics.effectiveType === '4g') score += 2
      else if (metrics.effectiveType === '3g') score += 0
      else if (metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g') score -= 2

      // Display scoring
      if (metrics.pixelRatio <= 1.5) score += 2
      else if (metrics.pixelRatio <= 2) score += 1
      else if (metrics.pixelRatio <= 3) score += 0
      else score -= 1

      // Screen resolution consideration
      const totalPixels = metrics.screenWidth * metrics.screenHeight * metrics.pixelRatio
      if (totalPixels > 4000000)
        score -= 2 // Very high res displays
      else if (totalPixels > 2000000) score -= 1 // 4K displays

      // GPU tier bonus for desktop
      if (metrics.gpuTier === 'high') score += 3
      else if (metrics.gpuTier === 'medium') score += 1

      // Prefer reduced motion override
      if (prefersReducedMotion.value) score -= 5

      // Determine performance level
      let level: PerformanceLevel['level']
      if (score >= 15) level = 'high'
      else if (score >= 10) level = 'medium'
      else level = 'low'

      // Set desktop performance configuration
      performanceLevel.value = {
        level,
        score,
        mobileStrategy: 'standard',
        enableAnimations: level !== 'low' && !prefersReducedMotion.value,
        enableBackdropBlur: level !== 'low',
        enableComplexGradients: level !== 'low',
        enableFloatingEffects: level === 'high',
        enableParallax: level === 'high',
        maxAnimationCount: level === 'high' ? 12 : level === 'medium' ? 8 : 3,
        blurStrength: level === 'high' ? 12 : level === 'medium' ? 8 : 2,
        animationDuration: level === 'high' ? 1 : level === 'medium' ? 0.7 : 0.4
      }
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Advanced Performance Detection:', {
        metrics: deviceMetrics.value,
        level: performanceLevel.value.level,
        score: performanceLevel.value.score,
        mobileStrategy: performanceLevel.value.mobileStrategy,
        config: performanceLevel.value
      })
    }
  }

  // CSS class helpers
  const getPerformanceClass = () => {
    const classes = [`perf-${performanceLevel.value.level}`]

    if (deviceMetrics.value.isMobile) {
      classes.push('mobile-device')
      classes.push(`mobile-${performanceLevel.value.mobileStrategy}`)
    }
    if (deviceMetrics.value.isTablet) classes.push('tablet-device')
    if (deviceMetrics.value.isFlagship) classes.push('flagship-device')
    if (shouldReduceAnimations.value) classes.push('reduce-animations')
    // Only `simple-gradients` has matching CSS (MusicDetailContent); the former
    // no-backdrop-blur / no-floating / no-parallax classes had no rules anywhere.
    if (!performanceLevel.value.enableComplexGradients) classes.push('simple-gradients')

    return classes.join(' ')
  }

  // Mobile-specific performance checks
  const isMobileFlagship = computed(
    () => deviceMetrics.value.isMobile && deviceMetrics.value.isFlagship
  )
  const shouldUseMobileFallback = computed(
    () => deviceMetrics.value.isMobile && performanceLevel.value.mobileStrategy === 'conservative'
  )

  // Animation budget system
  const activeAnimationCount = ref(0)
  const canAddAnimation = computed(
    () => activeAnimationCount.value < performanceLevel.value.maxAnimationCount
  )

  const requestAnimation = (name: string) => {
    if (!performanceLevel.value.enableAnimations || !canAddAnimation.value) {
      return false
    }
    activeAnimationCount.value++
    return true
  }

  const releaseAnimation = () => {
    if (activeAnimationCount.value > 0) {
      activeAnimationCount.value--
    }
  }

  // Intersection Observer for performance-aware animations
  const createPerformanceObserver = (callback: IntersectionObserverCallback) => {
    if (!window.IntersectionObserver) return null

    const options = {
      // Adjust thresholds based on performance level
      threshold: performanceLevel.value.level === 'low' ? [0.5] : [0.1, 0.5, 0.9],
      rootMargin: performanceLevel.value.level === 'low' ? '50px' : '100px'
    }

    return new IntersectionObserver(callback, options)
  }

  // Re-detect performance on window resize (device rotation, etc.)
  const handleResize = () => {
    detectDeviceCapabilities()
  }

  // Live reduced-motion preference. Wired once (not per detect/resize) and
  // removed on unmount so neither this nor the resize listener leaks.
  const reducedMotionMql =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    prefersReducedMotion.value = e.matches
    calculatePerformanceLevel()
  }

  onMounted(() => {
    detectDeviceCapabilities()
    window.addEventListener('resize', handleResize, { passive: true })
    reducedMotionMql?.addEventListener('change', handleReducedMotionChange)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    reducedMotionMql?.removeEventListener('change', handleReducedMotionChange)
  })

  return {
    // State
    deviceMetrics: readonly(deviceMetrics),
    performanceLevel: readonly(performanceLevel),
    prefersReducedMotion: readonly(prefersReducedMotion),

    // Computed
    isLowPerformanceDevice,
    isMediumPerformanceDevice,
    isHighPerformanceDevice,
    shouldReduceAnimations,
    isMobileFlagship,
    shouldUseMobileFallback,
    performanceCSSVars,
    canAddAnimation,

    // Methods
    getPerformanceClass,
    requestAnimation,
    releaseAnimation,
    createPerformanceObserver,
    detectDeviceCapabilities
  }
}
