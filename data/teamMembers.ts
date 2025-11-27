/**
 * Team members data
 */

export interface TeamMember {
  id: number
  name: string
  role: string
  /** Main image(s) - can be a single string or array of strings for random selection */
  mainImages: string | string[]
  /** Hover image(s) - shown on hover (desktop) or in rotation (mobile) */
  hoverImages?: string | string[]
}

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Bohdan',
    role: 'Vocals',
    mainImages: ['/images/our-team/bohdan/main-1.jpg', '/images/our-team/bohdan/main-2.jpg'],
    hoverImages: [
      '/images/our-team/bohdan/hover-1.jpg',
      '/images/our-team/bohdan/hover-2.jpg',
      '/images/our-team/bohdan/hover-3.jpg'
    ]
  }
]
