import { ref, computed } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'
import { useI18n } from 'vue-i18n'

interface ShareData {
  title: string
  description?: string
  url?: string
}

export const useShareFunctionality = () => {
  const { success: showSuccess, error: showError } = useSnackbar()
  const { t } = useI18n()
  
  // Create clean URL without certain params
  const getCleanUrl = (removeParams: string[] = ['from']) => {
    if (typeof window === 'undefined') return ''
    
    const url = new URL(window.location.href)
    removeParams.forEach(param => url.searchParams.delete(param))
    return url.toString()
  }
  
  // Generate share text and URL
  const getShareContent = (data: ShareData) => {
    const cleanUrl = data.url || getCleanUrl()
    const title = data.title
    const base = t('music.share_popup.check_out', { title }) as string
    const text = data.description ? `${base} - ${data.description}` : base
    const shareMessage = `${text}\n\n${cleanUrl}`
    
    return {
      title,
      text: shareMessage,
      url: cleanUrl,
      displayText: text
    }
  }
  
  // Mobile share using Web Share API
  const shareViaMobile = async (data: ShareData) => {
    try {
      const cleanUrl = data.url || getCleanUrl()
      const title = data.title
      const base = t('music.share_popup.check_out', { title }) as string
      const text = data.description ? `${base} - ${data.description}` : base
      
      if (navigator.share) {
        // For Web Share API, don't include URL in text since it's provided separately
        await navigator.share({
          title,
          text,
          url: cleanUrl
        })
        return true
      } else {
        // Fallback to clipboard with full share message including URL
        const shareMessage = `${text}\n\n${cleanUrl}`
        await copyToClipboard(shareMessage)
        return true
      }
    } catch (error) {
      // User cancelled or error occurred
      return false
    }
  }
  
  // Copy to clipboard with feedback
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        showSuccess(t('snackbar.copy_link_success') as string)
        return true
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
        showSuccess(t('snackbar.copy_link_success') as string)
        return true
      }
    } catch (error) {
      showError(t('snackbar.copy_link_error') as string)
      return false
    }
  }
  
  return {
    getCleanUrl,
    getShareContent,
    shareViaMobile,
    copyToClipboard
  }
}
