export interface CampusConfig {
  id: string;
  name: string;
  domain: string;
  city: string;
  state: string;
  centerCoordinates: { lat: number; lng: number };
}

export const SUPPORTED_CAMPUSES: CampusConfig[] = [
  {
    id: 'campus_stanford',
    name: 'Stanford University',
    domain: 'stanford.edu',
    city: 'Stanford',
    state: 'CA',
    centerCoordinates: { lat: 37.4275, lng: -122.1697 }
  },
  {
    id: 'campus_berkeley',
    name: 'UC Berkeley',
    domain: 'berkeley.edu',
    city: 'Berkeley',
    state: 'CA',
    centerCoordinates: { lat: 37.8719, lng: -122.2585 }
  },
  {
    id: 'campus_mit',
    name: 'Massachusetts Institute of Technology',
    domain: 'mit.edu',
    city: 'Cambridge',
    state: 'MA',
    centerCoordinates: { lat: 42.3601, lng: -71.0942 }
  },
  {
    id: 'campus_iitd',
    name: 'IIT Delhi',
    domain: 'iitd.ac.in',
    city: 'New Delhi',
    state: 'DL',
    centerCoordinates: { lat: 28.5450, lng: 77.1926 }
  },
  {
    id: 'campus_cmu',
    name: 'Carnegie Mellon University',
    domain: 'cmu.edu',
    city: 'Pittsburgh',
    state: 'PA',
    centerCoordinates: { lat: 40.4432, lng: -79.9428 }
  }
];

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ESCROW_STATUSES = {
  PENDING: 'pending',
  HELD_IN_ESCROW: 'held_in_escrow',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed'
} as const;
