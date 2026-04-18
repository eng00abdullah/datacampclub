import { UserProfile } from '../types';

export const INITIAL_DEMO_USERS: any[] = [
  { 
    uid: 'demo_admin', 
    email: 'sysadmin@datacamp.club', 
    fullName: 'System Administrator', 
    role: 'super_admin', 
    memberId: '0', 
    status: 'active', 
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    uid: 'demo_member', 
    email: 'member@example.com', 
    fullName: 'Demo Member', 
    role: 'member', 
    memberId: '1', 
    status: 'active', 
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_DEMO_EVENTS = [
  {
    id: '1',
    title: 'Data Science Workshop 2026',
    date: '2026-05-15',
    location: 'Main Hall',
    description: 'Advanced Python for Data Analysis',
    registeredCount: 45,
    capacity: 100,
    status: 'published'
  },
  {
    id: '2',
    title: 'Hackathon: Grid Runner',
    date: '2026-06-20',
    location: 'Cyber Lab',
    description: 'High stakes coding competition',
    registeredCount: 120,
    capacity: 200,
    status: 'published'
  }
];

export const INITIAL_DEMO_STAFF = [
  { id: '1', name: 'Abdullah Hossam', role: 'President', category: 'Leaders', image: 'https://picsum.photos/seed/pres/400/400', socials: [{ platform: 'linkedin', url: 'https://linkedin.com' }] }
];

export const INITIAL_DEMO_BLOG = [
  { id: '1', title: 'The Future of AI', content: 'Discussion on LLMs...', author: 'Abdullah Hossam', date: '2026-04-10', status: 'published' }
];

export const INITIAL_DEMO_PROJECTS = [
  { id: '1', title: 'Data Pipeline X', description: 'Real-time ETL...', status: 'active', members: ['Sys Admin'] }
];

export const INITIAL_DEMO_GALLERY = [
  { id: '1', url: 'https://picsum.photos/seed/event1/1200/800', title: 'Data Science Workshop 2025' },
  { id: '2', url: 'https://picsum.photos/seed/event2/1200/800', title: 'AI Summit Keynote' },
  { id: '3', url: 'https://picsum.photos/seed/event3/1200/800', title: 'Hackathon Winners' },
  { id: '4', url: 'https://picsum.photos/seed/event4/1200/800', title: 'Tech Talk: Web3' },
  { id: '5', url: 'https://picsum.photos/seed/event5/1200/800', title: 'Networking Night' },
  { id: '6', url: 'https://picsum.photos/seed/event6/1200/800', title: 'Neural Networks Lab' },
];

export const INITIAL_DEMO_SETTINGS = {
  siteName: 'DataCamp',
  siteSubName: 'Student Club',
  siteDescription: 'Empowering students with data science and AI skills.',
  contactEmail: 'contact@datacamp.club',
  contactPhone: '+20 123 456 7890',
  logoUrl: '',
  enableRegistration: true,
  maintenanceMode: false,
  themeColor: '#39FF14',
  socialLinks: [
    { platform: 'facebook', url: '', icon: 'Facebook' },
    { platform: 'linkedin', url: '', icon: 'Linkedin' },
    { platform: 'instagram', url: '', icon: 'Instagram' },
  ]
};

export const INITIAL_DEMO_HOME_CONTENT = {
  heroTitle: 'THE FUTURE OF DATA IS HERE',
  heroSubtitle: 'Join the elite community of data scientists and software engineers.',
  stats: [
    { label: 'ACTIVE MEMBERS', value: '500+' },
    { label: 'WORKSHOPS', value: '50+' },
    { label: 'PROJECTS', value: '20+' },
  ]
};

export const INITIAL_DEMO_ABOUT_DATA = {
  mission: 'To empower students with data science skills.',
  vision: 'To be the leading tech community in the region.',
  history: 'Founded in 2024 with a vision for the future.'
};

export const INITIAL_DEMO_MESSAGES = [
  { id: '1', name: 'Potential Partner', email: 'partner@example.com', subject: 'Collaboration Inquiry', message: 'I would like to discuss a potential partnership.', status: 'unread', timestamp: new Date().toISOString() }
];

// In-memory runtime state for demo mode
export let demoUsers = [...INITIAL_DEMO_USERS];
export let demoEvents = [...INITIAL_DEMO_EVENTS];
export let demoStaff = [...INITIAL_DEMO_STAFF];
export let demoBlog = [...INITIAL_DEMO_BLOG];
export let demoProjects = [...INITIAL_DEMO_PROJECTS];
export let demoGallery = [...INITIAL_DEMO_GALLERY];
export let demoSettings = { ...INITIAL_DEMO_SETTINGS };
export let demoHomeContent = { ...INITIAL_DEMO_HOME_CONTENT };
export let demoAboutData = { ...INITIAL_DEMO_ABOUT_DATA };
export let demoMessages = [...INITIAL_DEMO_MESSAGES];

export const setDemoUsers = (users: any[]) => { demoUsers = users; };
export const setDemoEvents = (events: any[]) => { demoEvents = events; };
export const setDemoStaff = (staff: any[]) => { demoStaff = staff; };
export const setDemoBlog = (blog: any[]) => { demoBlog = blog; };
export const setDemoProjects = (projects: any[]) => { demoProjects = projects; };
export const setDemoGallery = (gallery: any[]) => { demoGallery = gallery; };
export const setDemoSettings = (settings: any) => { demoSettings = settings; };
export const setDemoHomeContent = (content: any) => { demoHomeContent = content; };
export const setDemoAboutData = (data: any) => { demoAboutData = data; };
export const setDemoMessages = (messages: any[]) => { demoMessages = messages; };
