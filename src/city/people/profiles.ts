import type { Status } from '@/profile/status'
// Built-in people. Two kinds:
//   PEOPLE     fictional bots with fictional companies, so the city is never empty. They retire once
//              enough real members have joined (directory.ts).
//   RESIDENTS  real people who agreed to be shown before they have an account. No bot tag, real links,
//              no CONNECT. Each one disappears as soon as the real person joins (residents.ts).

export type Profile = {
  id: string
  name: string
  role: string
  company: string
  /** Where in the city they say they're from (not where they stand in the scene). */
  location: string
  building?: string
  previously?: string
  openToWork: boolean
  skills: string[]
  links: { portfolio?: string; linkedin?: string; x?: string }
  /** Character style from the roster. */
  character: string
  /** Where they spend time in the district. Either a fixed spot or a looping walk. */
  spot?: { x: number; z: number; face: number }
  path?: [number, number][]
  pause?: number
  /** Fictional sample person (not a real profile). */
  sample?: boolean
  /** A real person shown before they've joined: no account yet, so nobody can connect with them here. */
  resident?: boolean
  /** Their status above the nameplate (Phase 5F): a short line + emoji. */
  status?: Status
}

const PI = Math.PI

export const PEOPLE: Profile[] = [
  {
    id: 'kai',
    status: { emoji: '🎧', text: 'Heads down till 6, ping me after', expiresAt: null },
    name: 'KAI MORENO',
    role: 'Motion Designer',
    company: 'Freelance',
    location: 'Design Quarter',
    building: 'Kinetic type experiments',
    skills: ['Motion', 'After Effects', 'Type'],
    openToWork: true,
    links: {},
    character: 'rockstar',
    path: [
      [13, 13],
      [27, 13],
      [27, 27],
      [13, 27],
    ],
    pause: 0.8,
  },
  {
    id: 'amara',
    status: { emoji: '💼', text: 'Hiring two product designers this month!', expiresAt: null },
    name: 'AMARA OKAFOR',
    role: 'Brand Designer',
    company: 'Peepal Labs',
    location: 'Design Quarter',
    building: 'Peepal Labs rebrand',
    previously: 'Studio Kettle',
    skills: ['Branding', 'Illustration', 'Identity'],
    openToWork: false,
    links: {},
    character: 'creative',
    spot: { x: -16.2, z: 7.15, face: PI },
  },
  {
    id: 'jonas',
    name: 'JONAS WEBER',
    role: 'Head of Product',
    company: 'Juno Pay',
    location: 'Tech Park',
    previously: 'Two startups, one exit',
    skills: ['Product strategy', 'Payments', 'Growth'],
    openToWork: false,
    links: {},
    character: 'pm',
    // visiting the Shore until Tech Park is built: a walk along the promenade
    path: [
      [-30, 3],
      [30, 3],
    ],
    pause: 3,
  },
  {
    id: 'sam',
    status: { emoji: '', text: 'New in town, say hi!', expiresAt: null },
    name: 'SAM LINDQVIST',
    role: 'Creative Technologist',
    company: 'Byte Mela',
    location: 'the Shore',
    building: 'Robots that draw chalk patterns',
    skills: ['Creative coding', 'Robotics', '3D'],
    openToWork: true,
    links: {},
    character: 'bot',
    spot: { x: -12, z: 6.2, face: PI }, // The Shore: in front of the big HELLO letters
  },
  {
    id: 'naveen',
    name: 'NAVEEN RAO',
    role: 'Design Engineer',
    company: 'Loop Labs',
    location: 'Makers Row',
    building: 'Tokenizer: Figma tokens to code',
    skills: ['React', 'Design tokens', 'Figma plugins'],
    openToWork: true,
    links: {},
    character: 'developer',
    spot: { x: -19, z: 9.8, face: PI },
  },
  {
    id: 'diego',
    status: { emoji: '🧪', text: 'Shipping v2 this week, need beta testers', expiresAt: null },
    name: 'DIEGO ALVES',
    role: 'Indie Hacker',
    company: 'Solo',
    location: 'Makers Row',
    building: 'BusBuddy: live bus ETAs',
    skills: ['Mobile', 'Maps', 'Shipping fast'],
    openToWork: false,
    links: {},
    character: 'maker',
    spot: { x: -36, z: 9.4, face: 0 },
  },
  {
    id: 'yuki',
    status: { emoji: '☕', text: 'Up for a coffee chat about design systems', expiresAt: null },
    name: 'YUKI TANAKA',
    role: 'Design Systems Lead',
    company: 'Sutra',
    location: 'Makers Row',
    building: 'Open-source icon set',
    skills: ['Design systems', 'Icons', 'Accessibility'],
    openToWork: true,
    links: {},
    character: 'designer',
    spot: { x: 20, z: 10.6, face: 0 },
  },
]

// Real people, shown with their consent until they join. Only public facts from their own profiles:
// no statuses or quotes are written on their behalf. `location` follows registry.ts: a district, another
// area of the city as typed, or another city with a leading "@".
export const RESIDENTS: Profile[] = [
  // Add real people here, only with their consent. Example:
  // {
  //   id: 'resident-priya', name: 'PRIYA S', role: 'Product Designer', company: '', location: 'Design Quarter',
  //   skills: ['Product design'], openToWork: false, character: 'designer',
  //   links: { portfolio: 'https://priya.example', x: 'https://x.com/priya' },
  //   spot: { x: 8, z: 0.5, face: Math.PI },
  // },
]
