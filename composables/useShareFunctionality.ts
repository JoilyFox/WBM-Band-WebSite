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
    // Only use the URL without additional text
    const shareMessage = cleanUrl
    
    return {
      title,
      text: shareMessage,
      url: cleanUrl,
      displayText: cleanUrl
    }
  }
  
  // Mobile share using Web Share API
  const shareViaMobile = async (data: ShareData) => {
    try {
      const cleanUrl = data.url || getCleanUrl()
      const title = data.title
      
      if (navigator.share) {
        // For Web Share API, only share the URL
        await navigator.share({
          title,
          url: cleanUrl
        })
        return true
      } else {
        // Fallback to clipboard with only the URL
        await copyToClipboard(cleanUrl)
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
