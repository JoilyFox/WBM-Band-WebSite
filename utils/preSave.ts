/**
 * Single source of truth for "does this release have a pre-save target?".
 *
 * A release is pre-save-able when it has at least one NON-EMPTY per-platform
 * pre-save link OR a distributor smart-link (`distributorPreSaveUrl`, e.g. a
 * Linkfire/feature.fm page). Every consumer (listen-access, presave-access,
 * useMusicNavigation, MusicLibrarySection, getNearestUpcomingPreSaveRelease and
 * the pre-save page) MUST use this helper so the two route guards can never
 * disagree again (an object with only empty values, or a release that only has
 * a distributor URL, used to be classified differently in each place).
 *
 * Pure and dependency-free (type-only import) so it is safe to use from
 * `data/musicLibrary.ts`, which is also loaded by nuxt.config.ts and scripts.
 */
import type { MusicRelease } from '../data/musicLibrary'

export const hasPreSaveLinks = (
  release: Pick<MusicRelease, 'preSaveMusicPlatformLinks' | 'distributorPreSaveUrl'>
): boolean => {
  const links = release.preSaveMusicPlatformLinks
  const hasPlatformLink = Boolean(links && Object.values(links).some(Boolean))
  return hasPlatformLink || Boolean(release.distributorPreSaveUrl)
}
