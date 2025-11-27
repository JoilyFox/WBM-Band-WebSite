/**
 * Team members data
 */

export interface TeamMember {
  id: number
  nameKey: string
  roleKey: string
  mainImages: string | string[]
  hoverImages?: string | string[]
}

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    nameKey: 'team.members.bohdan.name',
    roleKey: 'team.members.bohdan.role',
    mainImages: ['/images/our-team/bohdan/main-1.jpg'],
    hoverImages: [
      '/images/our-team/bohdan/hover-1.jpg',
      '/images/our-team/bohdan/hover-2.jpg',
      '/images/our-team/bohdan/hover-3.jpg'
    ]
  }
]
