// Performance debugging utilities for scroll animations
// This file is optional and only for development/debugging purposes

export interface PerformanceDebugInfo {
  deviceType: 'high-performance' | 'balanced' | 'low-performance'
  currentThrottle: number
  prefersReducedMotion: boolean
  averageFrameTime: number
  missedFrames: number
  totalFrames: number
  recommendations: string[]
}

export function createPerformanceDebugger() {
  let debugElement: HTMLElement | null = null
  let isDebugging = false

  const createDebugElement = (): HTMLElement => {
    const debug = document.createElement('div')
    debug.id = 'scroll-performance-debug'
    debug.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      max-width: 300px;
      line-height: 1.4;
    `
    document.body.appendChild(debug)
    return debug
  }

  const updateDebugInfo = (info: PerformanceDebugInfo) => {
    if (!debugElement) return

    const html = `
      <div><strong>Scroll Performance Debug</strong></div>
      <div>Device: ${info.deviceType}</div>
      <div>Throttle: ${info.currentThrottle}ms</div>
      <div>Reduced Motion: ${info.prefersReducedMotion ? 'Yes' : 'No'}</div>
      <div>Avg Frame Time: ${info.averageFrameTime.toFixed(2)}ms</div>
      <div>Missed Frames: ${info.missedFrames}/${info.totalFrames}</div>
      ${info.recommendations.length > 0 ? `
        <div style="margin-top: 5px;"><strong>Recommendations:</strong></div>
        ${info.recommendations.map(rec => `<div>• ${rec}</div>`).join('')}
      ` : ''}
    `
    debugElement.innerHTML = html
  }

  const startDebugging = () => {
    if (isDebugging) return
    isDebugging = true
    debugElement = createDebugElement()
  }

  const stopDebugging = () => {
    if (!isDebugging) return
    isDebugging = false
    if (debugElement) {
      document.body.removeChild(debugElement)
      debugElement = null
    }
  }

  const toggleDebugging = () => {
    if (isDebugging) {
      stopDebugging()
    } else {
      startDebugging()
    }
  }

  return {
    startDebugging,
    stopDebugging,
    toggleDebugging,
    updateDebugInfo,
    isDebugging: () => isDebugging
  }
}

// Global debug function for console usage
if (typeof window !== 'undefined') {
  (window as any).toggleScrollDebug = () => {
    if (!(window as any).__scrollDebugger) {
      (window as any).__scrollDebugger = createPerformanceDebugger()
    }
    (window as any).__scrollDebugger.toggleDebugging()
  }
}
