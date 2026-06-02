// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MusicDetailModal from '~/components/music/MusicDetailModal.vue'
import TeamMemberModal from '~/components/team/TeamMemberModal.vue'
import type { MusicRelease } from '~/data/musicLibrary'
import type { TeamMember } from '~/data/teamMembers'

// Both wrappers are thin adapters over CommonBaseModal (components/common/BaseModal.vue):
//   - MusicDetailModal forwards :aria-label="release?.title || 'Release details'"
//     and renders <MusicDetailContent> in the default slot.
//   - TeamMemberModal forwards :aria-label="member ? $t(member.nameKey) : 'Team member'"
//     and renders the member name (via $t) in its own slot body.
// Both forward :is-visible and re-emit BaseModal's 'close' upward.
//
// BaseModal teleports its markup to document.body via <Teleport to="body">, and
// uses v-show (not v-if), so the dialog node exists in the DOM regardless of
// visibility. The wrapper's own w.html() does NOT contain the teleported nodes,
// so DOM assertions about aria-label / rendered content read from document.body.
// Prop-forwarding is also asserted structurally via findComponent({ name: 'BaseModal' }).
//
// MusicDetailContent is heavy (Teleport, performance composables, theming), so
// it is stubbed to a marker element. We're testing the WRAPPER's forwarding, not
// the content component itself.
//
// i18n is LIVE here. The bare nuxt runtime resolves to ENGLISH by default, so
// TeamMemberModal's $t(member.nameKey) yields the English name. To assert the
// Ukrainian string we flip the GLOBAL i18n locale and reset it in beforeEach so
// the file stays order-independent (other spec files share this composer).

const makeRelease = (overrides: Partial<MusicRelease> = {}): MusicRelease =>
  ({
    id: '1',
    slug: 'mania',
    title: 'Mania',
    titleKey: 'releases.mania.title',
    type: 'single',
    releaseDate: '2025-11-14T12:00:00Z',
    imageUrl: '/images/optimized/albums-images/mania/cover.avif',
    descriptionKey: 'releases.mania.description',
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/0pjAORRhgVsS7eP4R6JbMF'
    },
    ...overrides
  }) as MusicRelease

const makeMember = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  id: 1,
  nameKey: 'team.members.bohdan.name',
  roleKey: 'team.members.bohdan.role',
  mainImages: ['/images/optimized/our-team/bohdan/main-1.jpg'],
  ...overrides
})

// Stub for the heavy content child so MusicDetailModal mounts cheaply. The stub
// records the props it receives so we can assert the wrapper forwards them.
const MusicDetailContentStub = {
  name: 'MusicDetailContent',
  props: ['release', 'isModal', 'isPreSave'],
  template:
    '<div class="mdc-stub" :data-pre-save="String(isPreSave)" :data-is-modal="String(isModal)" />'
}

// Set the GLOBAL i18n locale that TeamMemberModal's $t reads. useNuxtApp() is
// only valid inside a test/hook; $i18n is getter-only but $i18n.locale is a
// writable Vue ref. Mirrors the helper in music-card.nuxt.spec.ts.
const setLocale = (loc: 'ua' | 'en') => {
  ;(useNuxtApp() as { $i18n: { locale: { value: string } } }).$i18n.locale.value = loc
}

describe('modal wrappers', () => {
  beforeEach(() => {
    // Reset to English (the runtime default) so locale never leaks between tests.
    setLocale('en')
  })

  afterEach(() => {
    // BaseModal teleports to body; clean up any leftover dialog nodes between
    // tests so document.body queries don't see stale modals.
    document.querySelectorAll('.modal-backdrop').forEach((n) => n.remove())
  })

  describe('MusicDetailModal.vue', () => {
    it('forwards release.title as the BaseModal aria-label', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease({ title: 'Mania' }), isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      const base = w.findComponent({ name: 'BaseModal' })
      expect(base.exists()).toBe(true)
      expect(base.props('ariaLabel')).toBe('Mania')
      // And it lands on the role="dialog" container in the teleported DOM.
      const dialog = document.querySelector('.modal-container[role="dialog"]')
      expect(dialog?.getAttribute('aria-label')).toBe('Mania')
    })

    it('falls back to "Release details" when release.title is empty', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease({ title: '' }), isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      expect(w.findComponent({ name: 'BaseModal' }).props('ariaLabel')).toBe('Release details')
    })

    it('forwards isVisible=true to BaseModal', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease(), isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      expect(w.findComponent({ name: 'BaseModal' }).props('isVisible')).toBe(true)
    })

    it('forwards isVisible=false to BaseModal (content stays mounted via v-show)', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease(), isVisible: false },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      expect(w.findComponent({ name: 'BaseModal' }).props('isVisible')).toBe(false)
      // v-show, not v-if: the dialog node still exists in the DOM, just hidden.
      expect(document.querySelector('.modal-container[role="dialog"]')).not.toBeNull()
    })

    it('passes preloadImageUrl through to BaseModal from release.imageUrl', async () => {
      const release = makeRelease({ imageUrl: '/images/cover-x.avif' })
      const w = await mountSuspended(MusicDetailModal, {
        props: { release, isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      expect(w.findComponent({ name: 'BaseModal' }).props('preloadImageUrl')).toBe(
        '/images/cover-x.avif'
      )
    })

    it('renders MusicDetailContent in the slot and forwards release + isModal=true', async () => {
      const release = makeRelease()
      const w = await mountSuspended(MusicDetailModal, {
        props: { release, isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      const content = w.findComponent({ name: 'MusicDetailContent' })
      expect(content.exists()).toBe(true)
      expect(content.props('release')).toBe(release)
      // The wrapper hardcodes :is-modal="true".
      expect(content.props('isModal')).toBe(true)
    })

    it('defaults isPreSave to false and forwards it to MusicDetailContent', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease(), isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      expect(w.findComponent({ name: 'MusicDetailContent' }).props('isPreSave')).toBe(false)
    })

    it('forwards isPreSave=true when provided', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease(), isVisible: true, isPreSave: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      expect(w.findComponent({ name: 'MusicDetailContent' }).props('isPreSave')).toBe(true)
    })

    it('re-emits "close" upward when BaseModal emits close', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease(), isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      w.findComponent({ name: 'BaseModal' }).vm.$emit('close')
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('propagates the close from the BaseModal close button click', async () => {
      const w = await mountSuspended(MusicDetailModal, {
        props: { release: makeRelease(), isVisible: true },
        global: { stubs: { MusicDetailContent: MusicDetailContentStub } }
      })
      const closeBtn = document.querySelector('.modal-close-btn') as HTMLButtonElement | null
      expect(closeBtn).not.toBeNull()
      closeBtn!.click()
      await w.vm.$nextTick()
      expect(w.emitted('close')).toHaveLength(1)
    })
  })

  describe('TeamMemberModal.vue', () => {
    it('forwards the translated member name as the BaseModal aria-label (English default)', async () => {
      const w = await mountSuspended(TeamMemberModal, {
        props: { member: makeMember(), isVisible: true }
      })
      const base = w.findComponent({ name: 'BaseModal' })
      // locales/en.json → team.members.bohdan.name === 'Bohdan'
      expect(base.props('ariaLabel')).toBe('Bohdan')
      const dialog = document.querySelector('.modal-container[role="dialog"]')
      expect(dialog?.getAttribute('aria-label')).toBe('Bohdan')
    })

    it('uses the Ukrainian translation when the global locale is ua', async () => {
      setLocale('ua')
      const w = await mountSuspended(TeamMemberModal, {
        props: { member: makeMember(), isVisible: true }
      })
      // locales/uk.json → team.members.bohdan.name === 'Богдан'
      expect(w.findComponent({ name: 'BaseModal' }).props('ariaLabel')).toBe('Богдан')
    })

    it('falls back to "Team member" aria-label when member is null', async () => {
      const w = await mountSuspended(TeamMemberModal, {
        props: { member: null, isVisible: true }
      })
      expect(w.findComponent({ name: 'BaseModal' }).props('ariaLabel')).toBe('Team member')
    })

    it('renders the translated member name in the modal body when member is set', async () => {
      await mountSuspended(TeamMemberModal, {
        props: { member: makeMember(), isVisible: true }
      })
      // Body content is teleported to document.body.
      const name = document.querySelector('.member-modal-name')
      expect(name?.textContent).toBe('Bohdan')
    })

    it('renders an empty name node when member is null', async () => {
      await mountSuspended(TeamMemberModal, {
        props: { member: null, isVisible: true }
      })
      const name = document.querySelector('.member-modal-name')
      expect(name).not.toBeNull()
      expect(name?.textContent).toBe('')
    })

    it('forwards isVisible to BaseModal', async () => {
      const w = await mountSuspended(TeamMemberModal, {
        props: { member: makeMember(), isVisible: false }
      })
      expect(w.findComponent({ name: 'BaseModal' }).props('isVisible')).toBe(false)
    })

    it('re-emits "close" upward when BaseModal emits close', async () => {
      const w = await mountSuspended(TeamMemberModal, {
        props: { member: makeMember(), isVisible: true }
      })
      w.findComponent({ name: 'BaseModal' }).vm.$emit('close')
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('does not pass a preloadImageUrl (TeamMemberModal omits it)', async () => {
      const w = await mountSuspended(TeamMemberModal, {
        props: { member: makeMember(), isVisible: true }
      })
      // BaseModal default for preloadImageUrl is undefined; the wrapper never sets it.
      expect(w.findComponent({ name: 'BaseModal' }).props('preloadImageUrl')).toBeUndefined()
    })
  })
})
