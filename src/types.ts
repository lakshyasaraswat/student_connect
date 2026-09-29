export interface User {
  id: string;
  name: string;
  username?: string;
  admissionNumber?: string;
  phone?: string;
  email: string;
  campusId: string;
  collegeName: string;
  collegeIdCardUrl?: string;
  domain: string;
  avatar: string;
  course?: string;
  year?: string;
  branch?: string;
  hostelStatus?: 'Hostelite' | 'Day Scholar';
  bio?: string;
  skills?: string[];
  interests?: string[];
  role: 'student' | 'admin';
  isVerified: boolean;
  idVerificationStatus?: 'verified' | 'pending' | 'rejected';
  idVerificationSubmittedAt?: string;
  idVerificationNotes?: string;
  walletBalance: number;
  escrowBalance: number;
  createdAt: string;
}

export interface CampusConfig {
  id: string;
  name: string;
  domain: string;
  city: string;
  state: string;
  centerCoordinates: { lat: number; lng: number };
}

export interface RidePassenger {
  passengerId: string;
  passengerName: string;
  passengerAvatar: string;
  passengerCollege?: string;
  seatsBooked: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  requestedAt: string;
}

export interface Ride {
  id: string;
  campusId: string;
  collegeName?: string;
  driverId: string;
  driverName: string;
  driverAvatar: string;
  driverPhone: string;
  driverEmail?: string;
  vehicleType: 'Car' | 'Scooty' | 'Bike';
  vehicleModel: string;
  source: string;
  pickupMapsUrl?: string;
  destination: string;
  destinationMapsUrl?: string;
  date: string;
  time: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  passengers: RidePassenger[];
  status: 'active' | 'completed' | 'cancelled';
  recurring: boolean;
  recurrencePattern?: string;
  notes?: string;
  createdAt: string;
}

export interface NoteReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Note {
  id: string;
  campusId: string;
  collegeName?: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  title: string;
  subject: string;
  semester: string;
  professor?: string;
  examType?: string;
  price: number;
  isFree: boolean;
  fileUrl: string;
  previewPages: string[];
  purchasedBy: string[];
  rating: number;
  reviewsCount: number;
  reviews: NoteReview[];
  tags: string[];
  downloadsCount: number;
  createdAt: string;
}

export interface EquipmentRental {
  rentalId: string;
  renterId: string;
  renterName: string;
  renterAvatar: string;
  startDate: string;
  dueDate: string;
  returnDate?: string;
  totalDays: number;
  rentalFee: number;
  depositHeld: number;
  status: 'active' | 'returned' | 'overdue' | 'disputed';
  lateFeeCharged?: number;
}

export interface Equipment {
  id: string;
  campusId: string;
  collegeName?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  name: string;
  category: 'Engineering Tools' | 'Lab Kits' | 'Calculators' | 'Electronics' | 'Cameras' | 'Sports' | 'Books';
  condition: 'Brand New' | 'Good' | 'Fair';
  description: string;
  imageUrl: string;
  pricePerDay: number;
  deposit: number;
  lateFeePerDay: number;
  status: 'available' | 'rented' | 'maintenance' | 'sold';
  availabilityDays: string;
  allowBuy?: boolean;
  buyPrice?: number; // 0 or greater (0 = Free)
  purchasedBy?: {
    buyerId: string;
    buyerName: string;
    date: string;
    amount: number;
  };
  activeRental?: EquipmentRental;
  rentHistory: EquipmentRental[];
  createdAt: string;
}

export interface TutorProfile {
  id: string;
  userId: string;
  campusId: string;
  collegeName?: string;
  tutorName: string;
  tutorAvatar: string;
  branch: string;
  year: string;
  subjects: string[];
  hourlyRate: number;
  bio: string;
  rating: number;
  reviewsCount: number;
  sessionsCompleted: number;
  availability: string[];
}

export interface TutoringSession {
  id: string;
  campusId: string;
  tutorId: string;
  tutorName: string;
  tutorCollege?: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentCollege?: string;
  isCrossCollege?: boolean;
  subject: string;
  date: string;
  time: string;
  durationHours: number;
  sessionType: '1-on-1' | 'Group';
  amount: number;
  status: 'booked' | 'in_progress' | 'completed' | 'cancelled';
  escrowStatus: 'held' | 'released' | 'refunded';
  videoCallLink: string;
  notes?: string;
  studentRating?: number;
  studentFeedback?: string;
  createdAt: string;
}

export interface StudyGroupMember {
  userId: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface StudyGroupResource {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'doc' | 'link' | 'code';
  uploadedBy: string;
  date: string;
}

export interface StudyGroupSchedule {
  id: string;
  topic: string;
  date: string;
  time: string;
  location: string;
}

export interface StudyGroup {
  id: string;
  campusId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  name: string;
  subject: string;
  topic: string;
  description: string;
  maxMembers: number;
  type: 'public' | 'private';
  locationType: 'Online' | 'Campus Library' | 'Hostel Common Room' | 'Lab';
  members: StudyGroupMember[];
  schedule: StudyGroupSchedule[];
  resources: StudyGroupResource[];
  createdAt: string;
}

export interface RoommatePreferences {
  preferredGender: 'Male' | 'Female' | 'Any';
  smoking: 'Non-Smoker' | 'Smoker' | 'Flexible';
  food: 'Vegetarian' | 'Non-Vegetarian' | 'Any';
  sleepSchedule: 'Early Bird (before 11 PM)' | 'Night Owl (after 1 AM)' | 'Flexible';
  cleanliness: 'Extremely Clean' | 'Moderate' | 'Relaxed';
  studyHabit: 'Quiet Study' | 'Music / Background noise' | 'Group Study';
}

export interface RoommatePost {
  id: string;
  campusId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userGender: 'Male' | 'Female' | 'Other';
  course: string;
  year: string;
  budgetMin: number;
  budgetMax: number;
  preferredLocation: string;
  preferences: RoommatePreferences;
  bio: string;
  mapsUrl?: string;
  status: 'looking' | 'found';
  contactPreferences: string;
  compatibilityScore?: number;
  compatibilityBreakdown?: { category: string; points: number; max: number; match: boolean }[];
  createdAt: string;
}

export interface PGListingReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PGListing {
  id: string;
  campusId: string;
  ownerId: string;
  ownerName: string;
  ownerType: 'student' | 'verified_landlord';
  ownerContact: string;
  title: string;
  type: 'PG' | 'Flat' | 'Hostel' | 'Studio';
  photos: string[];
  rent: number;
  deposit: number;
  amenities: string[];
  mapsUrl?: string;
  location: {
    address: string;
    distanceToCampusKm: number;
    lat: number;
    lng: number;
  };
  rules: string[];
  genderPreference: 'Boys' | 'Girls' | 'Any';
  verified: boolean;
  rating: number;
  reviewsCount: number;
  reviews: PGListingReview[];
  status: 'available' | 'full';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  campusId: string;
  userId: string;
  type: 'ride' | 'note' | 'equipment' | 'tutoring' | 'roommate' | 'group' | 'admin' | 'escrow' | 'assignment';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  campusId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
}

export interface AssignmentProposal {
  id: string;
  solverId: string;
  solverName: string;
  solverAvatar: string;
  solverCollege?: string;
  solverVerified?: boolean;
  proposedTime: string;
  pitch: string;
  offeredPrice?: number;
  counterPrice?: number;
  counterNote?: string;
  counterStatus?: 'pending' | 'accepted' | 'declined';
  counterBy?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  solverId: string;
  solverName: string;
  submittedAt: string;
  solutionNotes: string;
  solutionFileUrl?: string;
  solutionFileName?: string;
  status: 'submitted' | 'approved' | 'revision_requested';
  reviewFeedback?: string;
}

export interface Assignment {
  id: string;
  campusId: string;
  collegeName?: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentVerified?: boolean;
  studentEmail?: string;
  studentPhone?: string;
  studentLocation?: string;
  preferredContactMethod?: 'chat' | 'phone' | 'email' | 'whatsapp';
  studentCollege?: string;
  title: string;
  subject: string;
  courseCode?: string;
  description: string;
  requirements?: string[];
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'pdf' | 'doc' | 'code' | 'image' | 'other';
  bounty: number;
  escrowStatus: 'none' | 'held' | 'released' | 'refunded';
  deadline: string;
  urgency: 'Normal' | 'High' | 'Urgent (Within 24h)';
  status: 'open' | 'assigned' | 'submitted' | 'completed' | 'cancelled';
  solverId?: string;
  solverName?: string;
  solverAvatar?: string;
  solverCollege?: string;
  solverVerified?: boolean;
  assignedAt?: string;
  proposals: AssignmentProposal[];
  submission?: AssignmentSubmission;
  studentRating?: number;
  studentReview?: string;
  createdAt: string;
}
