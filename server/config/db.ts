import {
  User, Ride, Note, Equipment, TutorProfile, TutoringSession,
  StudyGroup, RoommatePost, PGListing, AppNotification, ChatMessage, Assignment
} from '../models/types.ts';
import { SUPPORTED_CAMPUSES, CampusConfig } from './constants.ts';

// Demo Administrator Account for the Administrator Portal
export const DEMO_ADMIN: User = {
  id: 'usr_admin_mitchell',
  name: 'Dean Mitchell',
  username: 'admin_mitchell',
  admissionNumber: 'ADM-9001',
  phone: '+1 (650) 723-2300',
  email: 'admin@stanford.edu',
  collegeName: 'Stanford University',
  collegeIdCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
  campusId: 'stanford',
  domain: 'stanford.edu',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeanMitchell',
  course: 'University Administration',
  year: 'Staff / Faculty',
  branch: 'Dean of Student Affairs',
  hostelStatus: 'Day Scholar',
  bio: 'Chief Campus Administrator & Student Affairs Moderator at Stanford University. Oversees student identity audits, escrow mediation, and safety compliance.',
  skills: ['Campus Moderation', 'Dispute Resolution', 'Enrollment Verification', 'Administrative Escrow'],
  interests: ['Student Welfare', 'Campus Safety', 'Institutional Integrity'],
  role: 'admin',
  isVerified: true,
  idVerificationStatus: 'verified',
  idVerificationSubmittedAt: '2025-01-01T00:00:00.000Z',
  idVerificationNotes: 'Institutional Chief Administrator credential verified with University Registrar.',
  walletBalance: 50000,
  escrowBalance: 0,
  createdAt: '2025-01-01T00:00:00.000Z'
};

// Seed demo student accounts and a pending verification for testing administrator verification portal
export const DEMO_USERS: User[] = [
  DEMO_ADMIN,
  {
    id: 'usr_sarah_chen',
    name: 'Sarah Chen',
    username: 'sarah_chen',
    admissionNumber: 'ST-2023-0104',
    phone: '+1 (650) 555-0142',
    email: 'sarah@stanford.edu',
    collegeName: 'Stanford University',
    collegeIdCardUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    campusId: 'stanford',
    domain: 'stanford.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_chen',
    course: 'B.S. Computer Science',
    year: '3rd Year',
    branch: 'Computer Science',
    hostelStatus: 'Hostelite',
    bio: 'CS junior interested in AI, peer tutoring, and campus study groups.',
    skills: ['Algorithms', 'Python', 'React', 'Calculus'],
    interests: ['Machine Learning', 'Carpooling', 'Hackathons'],
    role: 'student',
    isVerified: true,
    idVerificationStatus: 'verified',
    idVerificationSubmittedAt: '2025-01-10T10:00:00.000Z',
    idVerificationNotes: 'Verified with Stanford Registrar roster.',
    walletBalance: 2500,
    escrowBalance: 0,
    createdAt: '2025-01-10T10:00:00.000Z'
  },
  {
    id: 'usr_marcus_v',
    name: 'Marcus Vance',
    username: 'marcus_v',
    admissionNumber: 'ST-2022-0891',
    phone: '+1 (650) 555-0198',
    email: 'marcus@stanford.edu',
    collegeName: 'Stanford University',
    collegeIdCardUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    campusId: 'stanford',
    domain: 'stanford.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus_v',
    course: 'B.S. Electrical Engineering',
    year: '4th Year',
    branch: 'Electrical Engineering',
    hostelStatus: 'Hostelite',
    bio: 'Senior EE student. Frequent campus driver and lab equipment lender.',
    skills: ['Circuits', 'Robotics', 'C++', 'Signals'],
    interests: ['Hardware', 'Carpooling', 'Campus Events'],
    role: 'student',
    isVerified: true,
    idVerificationStatus: 'verified',
    idVerificationSubmittedAt: '2025-01-12T14:00:00.000Z',
    idVerificationNotes: 'Verified with Stanford Registrar roster.',
    walletBalance: 3200,
    escrowBalance: 0,
    createdAt: '2025-01-12T14:00:00.000Z'
  },
  {
    id: 'usr_alex_mit',
    name: 'Alex Rivera',
    username: 'alex_mit',
    admissionNumber: 'MIT-2024-512',
    phone: '+1 (617) 253-1000',
    email: 'alex@mit.edu',
    collegeName: 'Massachusetts Institute of Technology',
    collegeIdCardUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    campusId: 'mit',
    domain: 'mit.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex_mit',
    course: 'Course 6-3 (Computer Science)',
    year: '2nd Year',
    branch: 'EECS',
    hostelStatus: 'Hostelite',
    bio: 'MIT sophomore studying systems and networks.',
    skills: ['Data Structures', 'Linux', 'Operating Systems'],
    interests: ['Robotics', 'Study Groups'],
    role: 'student',
    isVerified: true,
    idVerificationStatus: 'verified',
    idVerificationSubmittedAt: '2025-01-15T09:00:00.000Z',
    idVerificationNotes: 'Verified with MIT student roster.',
    walletBalance: 1800,
    escrowBalance: 0,
    createdAt: '2025-01-15T09:00:00.000Z'
  },
  {
    id: 'usr_aarav_iitd',
    name: 'Aarav Sharma',
    username: 'aarav_iitd',
    admissionNumber: 'IITD-2023-108',
    phone: '+91 98765 43210',
    email: 'aarav@iitd.ac.in',
    collegeName: 'IIT Delhi',
    collegeIdCardUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    campusId: 'iitd',
    domain: 'iitd.ac.in',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aarav_iitd',
    course: 'B.Tech Mathematics and Computing',
    year: '3rd Year',
    branch: 'MnC',
    hostelStatus: 'Hostelite',
    bio: 'IIT Delhi student passionate about discrete mathematics and algorithms.',
    skills: ['Discrete Math', 'Competitive Programming', 'Python'],
    interests: ['Tutoring', 'Problem Solving'],
    role: 'student',
    isVerified: true,
    idVerificationStatus: 'verified',
    idVerificationSubmittedAt: '2025-01-18T11:00:00.000Z',
    idVerificationNotes: 'Verified with IIT Delhi academic office.',
    walletBalance: 4500,
    escrowBalance: 0,
    createdAt: '2025-01-18T11:00:00.000Z'
  },
  {
    id: 'usr_riya_patel',
    name: 'Riya Patel',
    username: 'riya_p',
    admissionNumber: 'ST-2024-9042',
    phone: '+1 (650) 555-0188',
    email: 'riya@stanford.edu',
    collegeName: 'Stanford University',
    collegeIdCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    campusId: 'stanford',
    domain: 'stanford.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=riya_p',
    course: 'B.A. Economics',
    year: '1st Year',
    branch: 'Economics',
    hostelStatus: 'Day Scholar',
    bio: 'Freshman economics student. Uploaded student ID card for administrative review.',
    skills: ['Microeconomics', 'Statistics'],
    interests: ['Campus Clubs', 'Tutoring'],
    role: 'student',
    isVerified: false,
    idVerificationStatus: 'pending',
    idVerificationSubmittedAt: new Date().toISOString(),
    idVerificationNotes: 'Awaiting manual administrator verification of Student ID card in Administrator Portal.',
    walletBalance: 500,
    escrowBalance: 0,
    createdAt: new Date().toISOString()
  }
];

// In-Memory document collections for campus intranet
class Database {
  // Retain all supported university campus domains (Stanford, UC Berkeley, MIT, IIT Delhi, CMU)
  campuses: CampusConfig[] = SUPPORTED_CAMPUSES;

  // Active accounts with seeded demo administrator and student accounts
  users: User[] = [...DEMO_USERS];
  rides: Ride[] = [];
  notes: Note[] = [];
  equipment: Equipment[] = [];
  tutors: TutorProfile[] = [];
  sessions: TutoringSession[] = [];
  studyGroups: StudyGroup[] = [];
  roommates: RoommatePost[] = [];
  listings: PGListing[] = [];
  notifications: AppNotification[] = [];
  chatMessages: ChatMessage[] = [];
  assignments: Assignment[] = [];

  constructor() {
    this.users = [...DEMO_USERS];
  }

  // Reset helper for testing or administrative maintenance
  reset() {
    this.users = [...DEMO_USERS];
    this.rides = [];
    this.notes = [];
    this.equipment = [];
    this.tutors = [];
    this.sessions = [];
    this.studyGroups = [];
    this.roommates = [];
    this.listings = [];
    this.notifications = [];
    this.chatMessages = [];
    this.assignments = [];
  }
}

export const db = new Database();
