import { isUpcomingRelease } from '~/utils/configHelpers'

type TranslateFn = (key: string, params?: Record<string, any>) => string | number

type CountdownUnit = 'day' | 'hour' | 'minute'

interface CountdownOptions {
  releaseDate?: string | Date
  locale?: string
  t: TranslateFn
}

const normalizeLocale = (locale?: string): string => {
  if (!locale) return 'en'
  const lower = locale.toLowerCase()
  if (lower === 'ua') return 'uk'
  if (lower === 'en-us') return 'en'
  if (lower === 'uk-ua') return 'uk'
  return lower
}

const getPrefix = (localeCode: string, t: TranslateFn) => {
  const raw = t('music.days_remaining.prefix')
  const prefix = typeof raw === 'string' ? raw : String(raw)
  if (prefix === 'music.days_remaining.prefix') {
    return localeCode === 'uk' ? 'через' : 'in'
  }
  return prefix
}

export const getLocalizedCountdown = ({ releaseDate, locale, t }: CountdownOptions): string => {
  if (!releaseDate) return ''

  const releaseDateValue = typeof releaseDate === 'string' ? new Date(releaseDate) : releaseDate
  if (!releaseDateValue || Number.isNaN(releaseDateValue.getTime())) {
    return ''
  }

  const releaseDateInput =
    typeof releaseDate === 'string' ? releaseDate : releaseDateValue.toISOString()

  if (!isUpcomingRelease(releaseDateInput)) {
    return ''
  }

  const now = new Date()
  const diffMs = releaseDateValue.getTime() - now.getTime()
  const totalMinutes = Math.ceil(diffMs / (1000 * 60))

  if (totalMinutes <= 0) {
    return ''
  }

  const minutesInHour = 60
  const minutesInDay = minutesInHour * 24

  let unit: CountdownUnit = 'day'
  let value = totalMinutes

  if (totalMinutes >= minutesInDay) {
    unit = 'day'
    value = Math.ceil(totalMinutes / minutesInDay)
  } else if (totalMinutes >= minutesInHour) {
    unit = 'hour'
    value = Math.ceil(totalMinutes / minutesInHour)
  } else {
    unit = 'minute'
    value = Math.max(totalMinutes, 1)
  }

  const localeCode = normalizeLocale(locale)
  const prefix = getPrefix(localeCode, t)

  if (localeCode === 'uk') {
    const lastDigit = value % 10
    const lastTwoDigits = value % 100

    const unitKeyMap: Record<CountdownUnit, { one: string; few: string; many: string }> = {
      day: {
        one: 'music.days_remaining.day',
        few: 'music.days_remaining.days_2_4',
        many: 'music.days_remaining.days_many'
      },
      hour: {
        one: 'music.days_remaining.hour',
        few: 'music.days_remaining.hours_2_4',
        many: 'music.days_remaining.hours_many'
      },
      minute: {
        one: 'music.days_remaining.minute',
        few: 'music.days_remaining.minutes_2_4',
        many: 'music.days_remaining.minutes_many'
      }
    }

    const fallbackMap: Record<string, string> = {
      'music.days_remaining.day': 'день',
      'music.days_remaining.days_2_4': 'дні',
      'music.days_remaining.days_many': 'днів',
      'music.days_remaining.hour': 'годину',
      'music.days_remaining.hours_2_4': 'години',
      'music.days_remaining.hours_many': 'годин',
      'music.days_remaining.minute': 'хвилину',
      'music.days_remaining.minutes_2_4': 'хвилини',
      'music.days_remaining.minutes_many': 'хвилин'
    }

    const unitKeys = unitKeyMap[unit]
    let selectedKey = unitKeys.many

    if (lastTwoDigits < 11 || lastTwoDigits > 19) {
      if (lastDigit === 1) {
        selectedKey = unitKeys.one
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        selectedKey = unitKeys.few
      }
    }

    const translated = t(selectedKey)
    const unitWord =
      typeof translated === 'string' && translated !== selectedKey
        ? translated
        : fallbackMap[selectedKey] || ''

    return `${prefix} ${value} ${unitWord}`.trim()
  }

  const englishKeyMap: Record<CountdownUnit, { singular: string; plural: string }> = {
    day: {
      singular: 'music.days_remaining.day',
      plural: 'music.days_remaining.days'
    },
    hour: {
      singular: 'music.days_remaining.hour',
      plural: 'music.days_remaining.hours'
    },
    minute: {
      singular: 'music.days_remaining.minute',
      plural: 'music.days_remaining.minutes'
    }
  }

  const keyPair = englishKeyMap[unit]
  const selectedKey = value === 1 ? keyPair.singular : keyPair.plural
  const translated = t(selectedKey)
  const fallbackMap: Record<string, string> = {
    'music.days_remaining.day': 'day',
    'music.days_remaining.days': 'days',
    'music.days_remaining.hour': 'hour',
    'music.days_remaining.hours': 'hours',
    'music.days_remaining.minute': 'minute',
    'music.days_remaining.minutes': 'minutes'
  }

  const unitWord =
    typeof translated === 'string' && translated !== selectedKey
      ? translated
      : fallbackMap[selectedKey] || ''

  return `${prefix} ${value} ${unitWord}`.trim()
}
