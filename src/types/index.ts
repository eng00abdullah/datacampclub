import { Timestamp } from 'firebase/firestore';

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'hr_organizer' 
  | 'hr_manager' 
  | 'event_manager' 
  | 'content_manager' 
  | 'finance_manager' 
  | 'organizer' 
  | 'member';

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  memberId: string;
  status: UserStatus;
  isVerified: boolean;
  phoneNumber?: string;
  faculty?: string;
  academicYear?: string;
  photoURL?: string;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

export interface ClubEvent {
  id?: string;
  title: string;
  description: string;
  date: string | Timestamp;
  location: string;
  category: string;
  capacity: number;
  attendees: string[];
  imageURL?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  organizerId: string;
  createdAt: string | Timestamp;
}

export interface BlogPost {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  imageURL?: string;
  category: string;
  status: 'draft' | 'published';
  tags: string[];
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

export interface GalleryImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  category: string;
  uploadedBy: string;
  createdAt: string | Timestamp;
}

export interface Settings {
  clubName: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  theme: 'dark' | 'light' | 'system';
  contactEmail: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface AuditLog {
  id?: string;
  action: string;
  userId: string;
  userName: string;
  details: string;
  status: 'success' | 'failure';
  ip?: string;
  createdAt: string | Timestamp;
}

export interface OTPRecord {
  id?: string;
  target: string;
  otp: string;
  type: 'email' | 'phone';
  attempts: number;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}
