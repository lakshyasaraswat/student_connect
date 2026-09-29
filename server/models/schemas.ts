// server/models/schemas.ts
import mongoose, { Schema, type SchemaOptions } from 'mongoose';

const opts: SchemaOptions = {
    versionKey: false,
    toJSON: {
        transform: (_doc: any, ret: any) => {
            delete ret._id;
            return ret;
        },
    },
};

// ============================================================
// USER
// ============================================================
const UserSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, index: true, sparse: true },
    admissionNumber: String,
    phone: String,
    email: { type: String, required: true, index: true },
    collegeName: { type: String, required: true },
    collegeIdCardUrl: String,
    passwordHash: String,
    campusId: { type: String, index: true, required: true },
    domain: String,
    avatar: String,
    course: String,
    year: String,
    branch: String,
    hostelStatus: { type: String, enum: ['Hostelite', 'Day Scholar'] },
    bio: String,
    skills: [String],
    interests: [String],
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    isVerified: { type: Boolean, default: false },
    idVerificationStatus: {
        type: String,
        enum: ['verified', 'pending', 'rejected'],
    },
    idVerificationSubmittedAt: String,
    idVerificationNotes: String,
    walletBalance: { type: Number, default: 0 },
    escrowBalance: { type: Number, default: 0 },
    createdAt: String,
}, opts);
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// ============================================================
// RIDE + RidePassenger subdocument
// ============================================================
const RidePassengerSchema = new Schema({
    passengerId: { type: String, required: true },
    passengerName: String,
    passengerAvatar: String,
    passengerCollege: String,
    seatsBooked: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
    requestedAt: String,
}, { _id: false });

const RideSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    collegeName: String,
    driverId: { type: String, index: true },
    driverName: String,
    driverAvatar: String,
    driverPhone: String,
    driverEmail: String,
    vehicleType: { type: String, enum: ['Car', 'Scooty', 'Bike'] },
    vehicleModel: String,
    source: String,
    pickupMapsUrl: String,
    destination: String,
    destinationMapsUrl: String,
    date: String,
    time: String,
    seatsTotal: Number,
    seatsAvailable: Number,
    pricePerSeat: Number,
    passengers: [RidePassengerSchema],
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    recurring: { type: Boolean, default: false },
    recurrencePattern: String,
    notes: String,
    createdAt: String,
}, opts);
export const RideModel = mongoose.models.Ride || mongoose.model('Ride', RideSchema);

// ============================================================
// NOTE + NoteReview subdocument
// ============================================================
const NoteReviewSchema = new Schema({
    id: String,
    reviewerId: String,
    reviewerName: String,
    reviewerAvatar: String,
    rating: Number,
    comment: String,
    date: String,
}, { _id: false });

const NoteSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    collegeName: String,
    sellerId: { type: String, index: true },
    sellerName: String,
    sellerAvatar: String,
    title: String,
    subject: String,
    semester: String,
    professor: String,
    examType: String,
    price: Number,
    isFree: { type: Boolean, default: false },
    fileUrl: String,
    previewPages: [String],
    purchasedBy: [String],
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    reviews: [NoteReviewSchema],
    tags: [String],
    downloadsCount: { type: Number, default: 0 },
    createdAt: String,
}, opts);
export const NoteModel = mongoose.models.Note || mongoose.model('Note', NoteSchema);

// ============================================================
// EQUIPMENT + EquipmentRental subdocument
// ============================================================
const EquipmentRentalSchema = new Schema({
    rentalId: String,
    renterId: String,
    renterName: String,
    renterAvatar: String,
    startDate: String,
    dueDate: String,
    returnDate: String,
    totalDays: Number,
    rentalFee: Number,
    depositHeld: Number,
    status: { type: String, enum: ['active', 'returned', 'overdue', 'disputed'] },
    lateFeeCharged: Number,
}, { _id: false });

const EquipmentSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    collegeName: String,
    ownerId: { type: String, index: true },
    ownerName: String,
    ownerAvatar: String,
    name: String,
    category: {
        type: String,
        enum: ['Engineering Tools', 'Lab Kits', 'Calculators', 'Electronics', 'Cameras', 'Sports', 'Books'],
    },
    condition: { type: String, enum: ['Brand New', 'Good', 'Fair'] },
    description: String,
    imageUrl: String,
    pricePerDay: Number,
    deposit: Number,
    lateFeePerDay: Number,
    status: { type: String, enum: ['available', 'rented', 'maintenance', 'sold'], default: 'available' },
    availabilityDays: String,
    allowBuy: Boolean,
    buyPrice: Number,
    purchasedBy: {
        buyerId: String,
        buyerName: String,
        date: String,
        amount: Number,
    },
    activeRental: EquipmentRentalSchema,
    rentHistory: [EquipmentRentalSchema],
    createdAt: String,
}, opts);
export const EquipmentModel = mongoose.models.Equipment || mongoose.model('Equipment', EquipmentSchema);

// ============================================================
// TUTOR PROFILE
// ============================================================
const TutorProfileSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    campusId: String,
    collegeName: String,
    tutorName: String,
    tutorAvatar: String,
    branch: String,
    year: String,
    subjects: [String],
    hourlyRate: Number,
    bio: String,
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
    availability: [String],
}, opts);
export const TutorProfileModel =
    mongoose.models.TutorProfile || mongoose.model('TutorProfile', TutorProfileSchema);

// ============================================================
// TUTORING SESSION
// ============================================================
const TutoringSessionSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: String,
    tutorId: { type: String, index: true },
    tutorName: String,
    tutorCollege: String,
    studentId: { type: String, index: true },
    studentName: String,
    studentAvatar: String,
    studentCollege: String,
    isCrossCollege: Boolean,
    subject: String,
    date: String,
    time: String,
    durationHours: Number,
    sessionType: { type: String, enum: ['1-on-1', 'Group'] },
    amount: Number,
    status: { type: String, enum: ['booked', 'in_progress', 'completed', 'cancelled'] },
    escrowStatus: { type: String, enum: ['held', 'released', 'refunded'] },
    videoCallLink: String,
    notes: String,
    studentRating: Number,
    studentFeedback: String,
    createdAt: String,
}, opts);
export const TutoringSessionModel =
    mongoose.models.TutoringSession || mongoose.model('TutoringSession', TutoringSessionSchema);

// ============================================================
// STUDY GROUP + subdocuments
// ============================================================
const StudyGroupMemberSchema = new Schema({
    userId: String,
    name: String,
    avatar: String,
    role: { type: String, enum: ['admin', 'member'] },
    joinedAt: String,
}, { _id: false });

const StudyGroupResourceSchema = new Schema({
    id: String,
    title: String,
    url: String,
    type: { type: String, enum: ['pdf', 'doc', 'link', 'code'] },
    uploadedBy: String,
    date: String,
}, { _id: false });

const StudyGroupScheduleSchema = new Schema({
    id: String,
    topic: String,
    date: String,
    time: String,
    location: String,
}, { _id: false });

const StudyGroupSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    creatorId: { type: String, index: true },
    creatorName: String,
    creatorAvatar: String,
    name: String,
    subject: String,
    topic: String,
    description: String,
    maxMembers: Number,
    type: { type: String, enum: ['public', 'private'] },
    locationType: { type: String, enum: ['Online', 'Campus Library', 'Hostel Common Room', 'Lab'] },
    members: [StudyGroupMemberSchema],
    schedule: [StudyGroupScheduleSchema],
    resources: [StudyGroupResourceSchema],
    createdAt: String,
}, opts);
export const StudyGroupModel =
    mongoose.models.StudyGroup || mongoose.model('StudyGroup', StudyGroupSchema);

// ============================================================
// ROOMMATE POST + RoommatePreferences subdocument
// ============================================================
const RoommatePreferencesSchema = new Schema({
    preferredGender: { type: String, enum: ['Male', 'Female', 'Any'] },
    smoking: { type: String, enum: ['Non-Smoker', 'Smoker', 'Flexible'] },
    food: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Any'] },
    sleepSchedule: {
        type: String,
        enum: ['Early Bird (before 11 PM)', 'Night Owl (after 1 AM)', 'Flexible'],
    },
    cleanliness: { type: String, enum: ['Extremely Clean', 'Moderate', 'Relaxed'] },
    studyHabit: { type: String, enum: ['Quiet Study', 'Music / Background noise', 'Group Study'] },
}, { _id: false });

const RoommatePostSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    userId: { type: String, index: true },
    userName: String,
    userAvatar: String,
    userGender: { type: String, enum: ['Male', 'Female', 'Other'] },
    course: String,
    year: String,
    budgetMin: Number,
    budgetMax: Number,
    preferredLocation: String,
    preferences: RoommatePreferencesSchema,
    bio: String,
    mapsUrl: String,
    status: { type: String, enum: ['looking', 'found'], default: 'looking' },
    contactPreferences: String,
    createdAt: String,
}, opts);
export const RoommatePostModel =
    mongoose.models.RoommatePost || mongoose.model('RoommatePost', RoommatePostSchema);

// ============================================================
// PG LISTING + PGListingReview subdocument
// ============================================================
const PGListingReviewSchema = new Schema({
    id: String,
    userName: String,
    rating: Number,
    comment: String,
    date: String,
}, { _id: false });

const PGListingSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    ownerId: { type: String, index: true },
    ownerName: String,
    ownerType: { type: String, enum: ['student', 'verified_landlord'] },
    ownerContact: String,
    title: String,
    type: { type: String, enum: ['PG', 'Flat', 'Hostel', 'Studio'] },
    photos: [String],
    rent: Number,
    deposit: Number,
    amenities: [String],
    mapsUrl: String,
    location: {
        address: String,
        distanceToCampusKm: Number,
        lat: Number,
        lng: Number,
    },
    rules: [String],
    genderPreference: { type: String, enum: ['Boys', 'Girls', 'Any'] },
    verified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    reviews: [PGListingReviewSchema],
    status: { type: String, enum: ['available', 'full'], default: 'available' },
    createdAt: String,
}, opts);
export const PGListingModel =
    mongoose.models.PGListing || mongoose.model('PGListing', PGListingSchema);

// ============================================================
// APP NOTIFICATION
// ============================================================
const NotificationSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    userId: { type: String, index: true },
    type: {
        type: String,
        enum: ['ride', 'note', 'equipment', 'tutoring', 'roommate', 'group', 'admin', 'escrow', 'assignment'],
    },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    link: String,
    createdAt: String,
}, opts);
export const AppNotificationModel =
    mongoose.models.AppNotification || mongoose.model('AppNotification', NotificationSchema);

// ============================================================
// CHAT MESSAGE
// ============================================================
const ChatMessageSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: String,
    roomId: { type: String, index: true },
    senderId: { type: String, index: true },
    senderName: String,
    senderAvatar: String,
    text: String,
    createdAt: String,
}, opts);
export const ChatMessageModel =
    mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

// ============================================================
// ASSIGNMENT + AssignmentProposal + AssignmentSubmission
// ============================================================
const AssignmentProposalSchema = new Schema({
    id: String,
    solverId: String,
    solverName: String,
    solverAvatar: String,
    solverCollege: String,
    solverVerified: Boolean,
    proposedTime: String,
    pitch: String,
    offeredPrice: Number,
    counterPrice: Number,
    counterNote: String,
    counterStatus: { type: String, enum: ['pending', 'accepted', 'declined'] },
    counterBy: String,
    status: { type: String, enum: ['pending', 'accepted', 'declined'] },
    createdAt: String,
}, { _id: false });

const AssignmentSubmissionSchema = new Schema({
    id: String,
    solverId: String,
    solverName: String,
    submittedAt: String,
    solutionNotes: String,
    solutionFileUrl: String,
    solutionFileName: String,
    status: { type: String, enum: ['submitted', 'approved', 'revision_requested'] },
    reviewFeedback: String,
}, { _id: false });

const AssignmentSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: { type: String, index: true },
    collegeName: String,
    studentId: { type: String, index: true },
    studentName: String,
    studentAvatar: String,
    studentVerified: Boolean,
    studentEmail: String,
    studentPhone: String,
    studentLocation: String,
    preferredContactMethod: { type: String, enum: ['chat', 'phone', 'email', 'whatsapp'] },
    studentCollege: String,
    title: String,
    subject: String,
    courseCode: String,
    description: String,
    requirements: [String],
    attachmentUrl: String,
    attachmentName: String,
    attachmentType: { type: String, enum: ['pdf', 'doc', 'code', 'image', 'other'] },
    bounty: Number,
    escrowStatus: { type: String, enum: ['none', 'held', 'released', 'refunded'], default: 'none' },
    deadline: String,
    urgency: { type: String, enum: ['Normal', 'High', 'Urgent (Within 24h)'] },
    status: {
        type: String,
        enum: ['open', 'assigned', 'submitted', 'completed', 'cancelled'],
        default: 'open',
    },
    solverId: String,
    solverName: String,
    solverAvatar: String,
    solverCollege: String,
    solverVerified: Boolean,
    assignedAt: String,
    proposals: [AssignmentProposalSchema],
    submission: AssignmentSubmissionSchema,
    studentRating: Number,
    studentReview: String,
    createdAt: String,
}, opts);
export const AssignmentModel =
    mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);

// ============================================================
// ESCROW TRANSACTION (was escrowLedger array)
// ============================================================
const EscrowTransactionSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    campusId: String,
    payerId: { type: String, index: true },
    payeeId: { type: String, index: true },
    amount: Number,
    type: {
        type: String,
        enum: ['tutoring_escrow', 'equipment_deposit', 'equipment_rent', 'note_purchase', 'assignment_bounty'],
    },
    referenceId: { type: String, index: true },
    status: { type: String, enum: ['held', 'released', 'refunded', 'disputed'], default: 'held' },
    createdAt: String,
    releasedAt: String,
    refundedAt: String,
    note: String,
}, opts);
export const EscrowTransactionModel =
    mongoose.models.EscrowTransaction || mongoose.model('EscrowTransaction', EscrowTransactionSchema);

// ============================================================
// Aggregate export
// ============================================================
export const models = {
    User: UserModel,
    Ride: RideModel,
    Note: NoteModel,
    Equipment: EquipmentModel,
    TutorProfile: TutorProfileModel,
    TutoringSession: TutoringSessionModel,
    StudyGroup: StudyGroupModel,
    RoommatePost: RoommatePostModel,
    PGListing: PGListingModel,
    AppNotification: AppNotificationModel,
    ChatMessage: ChatMessageModel,
    Assignment: AssignmentModel,
    EscrowTransaction: EscrowTransactionModel,
};