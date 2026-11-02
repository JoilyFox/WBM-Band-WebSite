import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getConfig } from '~/utils/configHelpers'

export interface SocialLink {
  name: 'instagram' | 'tiktok' | 'youtube'
  /** PrimeIcons class */
  icon: string
  url: string
  /** Accessible name, localized */
  label: string
}

/**
 * The band's social profiles from `general.socialMedia` (Instagram, TikTok, YouTube), in
 * display order, with localized labels. Used by the footer and the home hero.
 */
export function useSocialLinks() {
  const { t } = useI18n()
  return computed<SocialLink[]>(() => {
    const all: SocialLink[] = [
      {
        name: 'instagram',
        icon: 'pi pi-instagram',
        url: getConfig('general.socialMedia.instagram'),
        label: t('footer.follow_instagram')
      },
      {
        name: 'tiktok',
        icon: 'pi pi-tiktok',
        url: getConfig('general.socialMedia.tiktok'),
        label: t('footer.follow_tiktok')
      },
      {
        name: 'youtube',
        icon: 'pi pi-youtube',
        url: getConfig('general.socialMedia.youtube'),
        label: t('footer.subscribe_youtube')
      }
    ]
    return all.filter((l) => !!l.url)
  })
}
