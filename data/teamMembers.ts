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
    mainImages: ['/images/optimized/our-team/bohdan/main-1.jpg'],
    hoverImages: [
      '/images/optimized/our-team/bohdan/hover-1.jpg',
      '/images/optimized/our-team/bohdan/hover-2.jpg',
      '/images/optimized/our-team/bohdan/hover-3.jpg'
    ]
  },
  // --- TEST PLACEHOLDER MEMBERS (remove before production) ---
  {
    id: 101,
    nameKey: 'team.members.anna.name',
    roleKey: 'team.members.anna.role',
    mainImages: ['https://i.pravatar.cc/400?img=5'],
    hoverImages: ['https://i.pravatar.cc/400?img=10', 'https://i.pravatar.cc/400?img=16']
  },
  {
    id: 102,
    nameKey: 'team.members.maksym.name',
    roleKey: 'team.members.maksym.role',
    mainImages: ['https://i.pravatar.cc/400?img=12'],
    hoverImages: ['https://i.pravatar.cc/400?img=33', 'https://i.pravatar.cc/400?img=53']
  },
  {
    id: 103,
    nameKey: 'team.members.yulia.name',
    roleKey: 'team.members.yulia.role',
    mainImages: ['https://i.pravatar.cc/400?img=23'],
    hoverImages: ['https://i.pravatar.cc/400?img=44', 'https://i.pravatar.cc/400?img=47']
  },
  {
    id: 104,
    nameKey: 'team.members.oleksandr.name',
    roleKey: 'team.members.oleksandr.role',
    mainImages: ['https://i.pravatar.cc/400?img=14'],
    hoverImages: ['https://i.pravatar.cc/400?img=51', 'https://i.pravatar.cc/400?img=68']
  },
  {
    id: 105,
    nameKey: 'team.members.iryna.name',
    roleKey: 'team.members.iryna.role',
    mainImages: ['https://i.pravatar.cc/400?img=25'],
    hoverImages: ['https://i.pravatar.cc/400?img=36', 'https://i.pravatar.cc/400?img=45']
  }
]
