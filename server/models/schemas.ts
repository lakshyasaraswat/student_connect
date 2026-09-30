// server/models/schemas.ts
import mongoose, { Schema, type Model, type SchemaOptions } from 'mongoose';

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
export interface UserDoc {
    id: string;
    name: string;
    username?: string;
    admissionNumber?: string;
    phone?: string;
    email: string;
    collegeName: string;
    collegeIdCardUrl?: string;
    passwordHash?: string;
    campusId: string;
    domain?: string;
    avatar?: string;
    course?: string;
    year?: string;
    branch?: string;
    hostelStatus?: 'Hostelite' | 'Day Scholar';
    bio?: string;
    skills: string[];
    interests: string[];
    role: 'student' | 'admin';
    isVerified: boolean;
    idVerificationStatus?: 'verified' | 'pending' | 'rejected';
    idVerificationSubmittedAt?: string;
    idVerificationNotes?: string;
    walletBalance: number;
    escrowBalance: number;
    createdAt: string;
}

const UserSchema = new Schema<UserDoc>(
    {
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
        skills: { type: [String], default: [] },
        interests: { type: [String], default: [] },
        role: {
            type: String,
            required: true,
            enum: ['student', 'admin'],
            default: 'student',
        },
        isVerified: { type: Boolean, required: true, default: false },
        idVerificationStatus: {
            type: String,
            enum: ['verified', 'pending', 'rejected'],
        },
        idVerificationSubmittedAt: String,
        idVerificationNotes: String,
        walletBalance: { type: Number, required: true, default: 0 },
        escrowBalance: { type: Number, required: true, default: 0 },
        createdAt: String,
    },
    opts
);
export const UserModel: Model<UserDoc> =
    (mongoose.models.User as Model<UserDoc>) ||
    mongoose.model<UserDoc>('User', UserSchema);

// ============================================================
// RIDE
// ============================================================
export interface RidePassengerDoc {
    passengerId: string;
    passengerName?: string;
    passengerAvatar?: string;
    passengerCollege?: string;
    seatsBooked: number;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    requestedAt?: string;
}

export interface RideDoc {
    id: string;
    campusId?: string;
    collegeName?: string;
    driverId: string;
    driverName?: string;
    driverAvatar?: string;
    driverPhone?: string;
    driverEmail?: string;
    vehicleType?: 'Car' | 'Scooty' | 'Bike';
    vehicleModel?: string;
    source?: string;
    pickupMapsUrl?: string;
    destination?: string;
    destinationMapsUrl?: string;
    date?: string;
    time?: string;
    seatsTotal?: number;
    seatsAvailable?: number;
    pricePerSeat?: number;
    passengers: RidePassengerDoc[];
    status: 'active' | 'completed' | 'cancelled';
    recurring: boolean;
    recurrencePattern?: string;
    notes?: string;
    createdAt: string;
}

const RidePassengerSchema = new Schema<RidePassengerDoc>(
    {
        passengerId: { type: String, required: true },
        passengerName: String,
        passengerAvatar: String,
        passengerCollege: String,
        seatsBooked: { type: Number, required: true, default: 1 },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
            default: 'pending',
        },
        requestedAt: String,
    },
    { _id: false }
);

const RideSchema = new Schema<RideDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: { type: String, index: true },
        collegeName: String,
        driverId: { type: String, required: true, index: true },
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
        passengers: { type: [RidePassengerSchema], default: [] },
        status: {
            type: String,
            required: true,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active',
        },
        recurring: { type: Boolean, required: true, default: false },
        recurrencePattern: String,
        notes: String,
        createdAt: String,
    },
    opts
);
export const RideModel: Model<RideDoc> =
    (mongoose.models.Ride as Model<RideDoc>) ||
    mongoose.model<RideDoc>('Ride', RideSchema);

// ============================================================
// NOTE
// ============================================================
export interface NoteReviewDoc {
    id?: string;
    reviewerId?: string;
    reviewerName?: string;
    reviewerAvatar?: string;
    rating?: number;
    comment?: string;
    date?: string;
}

export interface NoteDoc {
    id: string;
    campusId?: string;
    collegeName?: string;
    sellerId: string;
    sellerName?: string;
    sellerAvatar?: string;
    title?: string;
    subject?: string;
    semester?: string;
    professor?: string;
    examType?: string;
    price?: number;
    isFree: boolean;
    fileUrl?: string;
    previewPages: string[];
    purchasedBy: string[];
    rating: number;
    reviewsCount: number;
    reviews: NoteReviewDoc[];
    tags: string[];
    downloadsCount: number;
    createdAt: string;
}

const NoteReviewSchema = new Schema<NoteReviewDoc>(
    {
        id: String,
        reviewerId: String,
        reviewerName: String,
        reviewerAvatar: String,
        rating: Number,
        comment: String,
        date: String,
    },
    { _id: false }
);

const NoteSchema = new Schema<NoteDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: { type: String, index: true },
        collegeName: String,
        sellerId: { type: String, required: true, index: true },
        sellerName: String,
        sellerAvatar: String,
        title: String,
        subject: String,
        semester: String,
        professor: String,
        examType: String,
        price: Number,
        isFree: { type: Boolean, required: true, default: false },
        fileUrl: String,
        previewPages: { type: [String], default: [] },
        purchasedBy: { type: [String], default: [] },
        rating: { type: Number, required: true, default: 0 },
        reviewsCount: { type: Number, required: true, default: 0 },
        reviews: { type: [NoteReviewSchema], default: [] },
        tags: { type: [String], default: [] },
        downloadsCount: { type: Number, required: true, default: 0 },
        createdAt: String,
    },
    opts
);
export const NoteModel: Model<NoteDoc> =
    (mongoose.models.Note as Model<NoteDoc>) ||
    mongoose.model<NoteDoc>('Note', NoteSchema);

// ============================================================
// EQUIPMENT
// ============================================================
export interface EquipmentRentalDoc {
    rentalId?: string;
    renterId?: string;
    renterName?: string;
    renterAvatar?: string;
    startDate?: string;
    dueDate?: string;
    returnDate?: string;
    totalDays?: number;
    rentalFee?: number;
    depositHeld?: number;
    status?: 'active' | 'returned' | 'overdue' | 'disputed';
    lateFeeCharged?: number;
}

export interface EquipmentPurchasedByDoc {
    buyerId?: string;
    buyerName?: string;
    date?: string;
    amount?: number;
}

export interface EquipmentDoc {
    id: string;
    campusId?: string;
    collegeName?: string;
    ownerId: string;
    ownerName?: string;
    ownerAvatar?: string;
    name?: string;
    category?:
    | 'Engineering Tools'
    | 'Lab Kits'
    | 'Calculators'
    | 'Electronics'
    | 'Cameras'
    | 'Sports'
    | 'Books';
    condition?: 'Brand New' | 'Good' | 'Fair';
    description?: string;
    imageUrl?: string;
    pricePerDay?: number;
    deposit?: number;
    lateFeePerDay?: number;
    status: 'available' | 'rented' | 'maintenance' | 'sold';
    availabilityDays?: string;
    allowBuy?: boolean;
    buyPrice?: number;
    purchasedBy?: EquipmentPurchasedByDoc;
    activeRental?: EquipmentRentalDoc;
    rentHistory: EquipmentRentalDoc[];
    createdAt: string;
}

const EquipmentRentalSchema = new Schema<EquipmentRentalDoc>(
    {
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
        status: {
            type: String,
            enum: ['active', 'returned', 'overdue', 'disputed'],
        },
        lateFeeCharged: Number,
    },
    { _id: false }
);

const EquipmentPurchasedBySchema = new Schema<EquipmentPurchasedByDoc>(
    {
        buyerId: String,
        buyerName: String,
        date: String,
        amount: Number,
    },
    { _id: false }
);

const EquipmentSchema = new Schema<EquipmentDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: { type: String, index: true },
        collegeName: String,
        ownerId: { type: String, required: true, index: true },
        ownerName: String,
        ownerAvatar: String,
        name: String,
        category: {
            type: String,
            enum: [
                'Engineering Tools',
                'Lab Kits',
                'Calculators',
                'Electronics',
                'Cameras',
                'Sports',
                'Books',
            ],
        },
        condition: { type: String, enum: ['Brand New', 'Good', 'Fair'] },
        description: String,
        imageUrl: String,
        pricePerDay: Number,
        deposit: Number,
        lateFeePerDay: Number,
        status: {
            type: String,
            required: true,
            enum: ['available', 'rented', 'maintenance', 'sold'],
            default: 'available',
        },
        availabilityDays: String,
        allowBuy: Boolean,
        buyPrice: Number,
        purchasedBy: EquipmentPurchasedBySchema,
        activeRental: EquipmentRentalSchema,
        rentHistory: { type: [EquipmentRentalSchema], default: [] },
        createdAt: String,
    },
    opts
);
export const EquipmentModel: Model<EquipmentDoc> =
    (mongoose.models.Equipment as Model<EquipmentDoc>) ||
    mongoose.model<EquipmentDoc>('Equipment', EquipmentSchema);

// ============================================================
// TUTOR PROFILE
// ============================================================
export interface TutorProfileDoc {
    id: string;
    userId?: string;
    campusId?: string;
    collegeName?: string;
    tutorName?: string;
    tutorAvatar?: string;
    branch?: string;
    year?: string;
    subjects: string[];
    hourlyRate?: number;
    bio?: string;
    rating: number;
    reviewsCount: number;
    sessionsCompleted: number;
    availability: string[];
}

const TutorProfileSchema = new Schema<TutorProfileDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        userId: { type: String, index: true },
        campusId: String,
        collegeName: String,
        tutorName: String,
        tutorAvatar: String,
        branch: String,
        year: String,
        subjects: { type: [String], default: [] },
        hourlyRate: Number,
        bio: String,
        rating: { type: Number, required: true, default: 0 },
        reviewsCount: { type: Number, required: true, default: 0 },
        sessionsCompleted: { type: Number, required: true, default: 0 },
        availability: { type: [String], default: [] },
    },
    opts
);
export const TutorProfileModel: Model<TutorProfileDoc> =
    (mongoose.models.TutorProfile as Model<TutorProfileDoc>) ||
    mongoose.model<TutorProfileDoc>('TutorProfile', TutorProfileSchema);

// ============================================================
// TUTORING SESSION
// ============================================================
export interface TutoringSessionDoc {
    id: string;
    campusId?: string;
    tutorId?: string;
    tutorName?: string;
    tutorCollege?: string;
    studentId?: string;
    studentName?: string;
    studentAvatar?: string;
    studentCollege?: string;
    isCrossCollege?: boolean;
    subject?: string;
    date?: string;
    time?: string;
    durationHours?: number;
    sessionType?: '1-on-1' | 'Group';
    amount?: number;
    status?: 'booked' | 'in_progress' | 'completed' | 'cancelled';
    escrowStatus?: 'held' | 'released' | 'refunded';
    videoCallLink?: string;
    notes?: string;
    studentRating?: number;
    studentFeedback?: string;
    createdAt: string;
}

const TutoringSessionSchema = new Schema<TutoringSessionDoc>(
    {
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
        status: {
            type: String,
            enum: ['booked', 'in_progress', 'completed', 'cancelled'],
        },
        escrowStatus: { type: String, enum: ['held', 'released', 'refunded'] },
        videoCallLink: String,
        notes: String,
        studentRating: Number,
        studentFeedback: String,
        createdAt: String,
    },
    opts
);
export const TutoringSessionModel: Model<TutoringSessionDoc> =
    (mongoose.models.TutoringSession as Model<TutoringSessionDoc>) ||
    mongoose.model<TutoringSessionDoc>(
        'TutoringSession',
        TutoringSessionSchema
    );

// ============================================================
// STUDY GROUP
// ============================================================
export interface StudyGroupMemberDoc {
    userId?: string;
    name?: string;
    avatar?: string;
    role?: 'admin' | 'member';
    joinedAt?: string;
}

export interface StudyGroupResourceDoc {
    id?: string;
    title?: string;
    url?: string;
    type?: 'pdf' | 'doc' | 'link' | 'code';
    uploadedBy?: string;
    date?: string;
}

export interface StudyGroupScheduleDoc {
    id?: string;
    topic?: string;
    date?: string;
    time?: string;
    location?: string;
}

export interface StudyGroupDoc {
    id: string;
    campusId?: string;
    creatorId?: string;
    creatorName?: string;
    creatorAvatar?: string;
    name?: string;
    subject?: string;
    topic?: string;
    description?: string;
    maxMembers: number;
    type?: 'public' | 'private';
    locationType?: 'Online' | 'Campus Library' | 'Hostel Common Room' | 'Lab';
    members: StudyGroupMemberDoc[];
    schedule: StudyGroupScheduleDoc[];
    resources: StudyGroupResourceDoc[];
    createdAt: string;
}

const StudyGroupMemberSchema = new Schema<StudyGroupMemberDoc>(
    {
        userId: String,
        name: String,
        avatar: String,
        role: { type: String, enum: ['admin', 'member'] },
        joinedAt: String,
    },
    { _id: false }
);

const StudyGroupResourceSchema = new Schema<StudyGroupResourceDoc>(
    {
        id: String,
        title: String,
        url: String,
        type: { type: String, enum: ['pdf', 'doc', 'link', 'code'] },
        uploadedBy: String,
        date: String,
    },
    { _id: false }
);

const StudyGroupScheduleSchema = new Schema<StudyGroupScheduleDoc>(
    {
        id: String,
        topic: String,
        date: String,
        time: String,
        location: String,
    },
    { _id: false }
);

const StudyGroupSchema = new Schema<StudyGroupDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: { type: String, index: true },
        creatorId: { type: String, index: true },
        creatorName: String,
        creatorAvatar: String,
        name: String,
        subject: String,
        topic: String,
        description: String,
        maxMembers: { type: Number, required: true, default: 10 },
        type: { type: String, enum: ['public', 'private'] },
        locationType: {
            type: String,
            enum: ['Online', 'Campus Library', 'Hostel Common Room', 'Lab'],
        },
        members: { type: [StudyGroupMemberSchema], default: [] },
        schedule: { type: [StudyGroupScheduleSchema], default: [] },
        resources: { type: [StudyGroupResourceSchema], default: [] },
        createdAt: String,
    },
    opts
);
export const StudyGroupModel: Model<StudyGroupDoc> =
    (mongoose.models.StudyGroup as Model<StudyGroupDoc>) ||
    mongoose.model<StudyGroupDoc>('StudyGroup', StudyGroupSchema);

// ============================================================
// ROOMMATE POST
// ============================================================
export interface RoommatePreferencesDoc {
    preferredGender?: 'Male' | 'Female' | 'Any';
    smoking?: 'Non-Smoker' | 'Smoker' | 'Flexible';
    food?: 'Vegetarian' | 'Non-Vegetarian' | 'Any';
    sleepSchedule?:
    | 'Early Bird (before 11 PM)'
    | 'Night Owl (after 1 AM)'
    | 'Flexible';
    cleanliness?: 'Extremely Clean' | 'Moderate' | 'Relaxed';
    studyHabit?: 'Quiet Study' | 'Music / Background noise' | 'Group Study';
}

export interface RoommatePostDoc {
    id: string;
    campusId?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    userGender?: 'Male' | 'Female' | 'Other';
    course?: string;
    year?: string;
    budgetMin?: number;
    budgetMax?: number;
    preferredLocation?: string;
    preferences?: RoommatePreferencesDoc;
    bio?: string;
    mapsUrl?: string;
    status: 'looking' | 'found';
    contactPreferences?: string;
    createdAt: string;
}

const RoommatePreferencesSchema = new Schema<RoommatePreferencesDoc>(
    {
        preferredGender: { type: String, enum: ['Male', 'Female', 'Any'] },
        smoking: { type: String, enum: ['Non-Smoker', 'Smoker', 'Flexible'] },
        food: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Any'] },
        sleepSchedule: {
            type: String,
            enum: [
                'Early Bird (before 11 PM)',
                'Night Owl (after 1 AM)',
                'Flexible',
            ],
        },
        cleanliness: {
            type: String,
            enum: ['Extremely Clean', 'Moderate', 'Relaxed'],
        },
        studyHabit: {
            type: String,
            enum: ['Quiet Study', 'Music / Background noise', 'Group Study'],
        },
    },
    { _id: false }
);

const RoommatePostSchema = new Schema<RoommatePostDoc>(
    {
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
        status: {
            type: String,
            required: true,
            enum: ['looking', 'found'],
            default: 'looking',
        },
        contactPreferences: String,
        createdAt: String,
    },
    opts
);
export const RoommatePostModel: Model<RoommatePostDoc> =
    (mongoose.models.RoommatePost as Model<RoommatePostDoc>) ||
    mongoose.model<RoommatePostDoc>('RoommatePost', RoommatePostSchema);

// ============================================================
// PG LISTING
// ============================================================
export interface PGListingReviewDoc {
    id?: string;
    userName?: string;
    rating?: number;
    comment?: string;
    date?: string;
}

export interface PGListingLocationDoc {
    address?: string;
    distanceToCampusKm?: number;
    lat?: number;
    lng?: number;
}

export interface PGListingDoc {
    id: string;
    campusId?: string;
    ownerId?: string;
    ownerName?: string;
    ownerType?: 'student' | 'verified_landlord';
    ownerContact?: string;
    title?: string;
    type?: 'PG' | 'Flat' | 'Hostel' | 'Studio';
    photos: string[];
    rent?: number;
    deposit?: number;
    amenities: string[];
    mapsUrl?: string;
    location?: PGListingLocationDoc;
    rules: string[];
    genderPreference?: 'Boys' | 'Girls' | 'Any';
    verified: boolean;
    rating: number;
    reviewsCount: number;
    reviews: PGListingReviewDoc[];
    status: 'available' | 'full';
    createdAt: string;
}

const PGListingReviewSchema = new Schema<PGListingReviewDoc>(
    {
        id: String,
        userName: String,
        rating: Number,
        comment: String,
        date: String,
    },
    { _id: false }
);

const PGListingLocationSchema = new Schema<PGListingLocationDoc>(
    {
        address: String,
        distanceToCampusKm: Number,
        lat: Number,
        lng: Number,
    },
    { _id: false }
);

const PGListingSchema = new Schema<PGListingDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: { type: String, index: true },
        ownerId: { type: String, index: true },
        ownerName: String,
        ownerType: { type: String, enum: ['student', 'verified_landlord'] },
        ownerContact: String,
        title: String,
        type: { type: String, enum: ['PG', 'Flat', 'Hostel', 'Studio'] },
        photos: { type: [String], default: [] },
        rent: Number,
        deposit: Number,
        amenities: { type: [String], default: [] },
        mapsUrl: String,
        location: PGListingLocationSchema,
        rules: { type: [String], default: [] },
        genderPreference: { type: String, enum: ['Boys', 'Girls', 'Any'] },
        verified: { type: Boolean, required: true, default: false },
        rating: { type: Number, required: true, default: 0 },
        reviewsCount: { type: Number, required: true, default: 0 },
        reviews: { type: [PGListingReviewSchema], default: [] },
        status: {
            type: String,
            required: true,
            enum: ['available', 'full'],
            default: 'available',
        },
        createdAt: String,
    },
    opts
);
export const PGListingModel: Model<PGListingDoc> =
    (mongoose.models.PGListing as Model<PGListingDoc>) ||
    mongoose.model<PGListingDoc>('PGListing', PGListingSchema);

// ============================================================
// APP NOTIFICATION
// ============================================================
export interface NotificationDoc {
    id: string;
    campusId?: string;
    userId?: string;
    type?:
    | 'ride'
    | 'note'
    | 'equipment'
    | 'tutoring'
    | 'roommate'
    | 'group'
    | 'admin'
    | 'escrow'
    | 'assignment';
    title?: string;
    message?: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

const NotificationSchema = new Schema<NotificationDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: { type: String, index: true },
        userId: { type: String, index: true },
        type: {
            type: String,
            enum: [
                'ride',
                'note',
                'equipment',
                'tutoring',
                'roommate',
                'group',
                'admin',
                'escrow',
                'assignment',
            ],
        },
        title: String,
        message: String,
        read: { type: Boolean, required: true, default: false },
        link: String,
        createdAt: String,
    },
    opts
);
export const AppNotificationModel: Model<NotificationDoc> =
    (mongoose.models.AppNotification as Model<NotificationDoc>) ||
    mongoose.model<NotificationDoc>('AppNotification', NotificationSchema);

// ============================================================
// CHAT MESSAGE
// ============================================================
export interface ChatMessageDoc {
    id: string;
    campusId?: string;
    roomId?: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
    text: string;
    createdAt: string;
}

const ChatMessageSchema = new Schema<ChatMessageDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: String,
        roomId: { type: String, index: true },
        senderId: { type: String, required: true, index: true },
        senderName: String,
        senderAvatar: String,
        text: { type: String, required: true },
        createdAt: String,
    },
    opts
);
export const ChatMessageModel: Model<ChatMessageDoc> =
    (mongoose.models.ChatMessage as Model<ChatMessageDoc>) ||
    mongoose.model<ChatMessageDoc>('ChatMessage', ChatMessageSchema);

// ============================================================
// ASSIGNMENT
// ============================================================
export interface AssignmentProposalDoc {
    id?: string;
    solverId?: string;
    solverName?: string;
    solverAvatar?: string;
    solverCollege?: string;
    solverVerified?: boolean;
    proposedTime?: string;
    pitch?: string;
    offeredPrice?: number;
    counterPrice?: number;
    counterNote?: string;
    counterStatus?: 'pending' | 'accepted' | 'declined';
    counterBy?: string;
    status?: 'pending' | 'accepted' | 'declined';
    createdAt?: string;
}

export interface AssignmentSubmissionDoc {
    id?: string;
    solverId?: string;
    solverName?: string;
    submittedAt?: string;
    solutionNotes?: string;
    solutionFileUrl?: string;
    solutionFileName?: string;
    status?: 'submitted' | 'approved' | 'revision_requested';
    reviewFeedback?: string;
}

export interface AssignmentDoc {
    id: string;
    campusId?: string;
    collegeName?: string;
    studentId?: string;
    studentName?: string;
    studentAvatar?: string;
    studentVerified?: boolean;
    studentEmail?: string;
    studentPhone?: string;
    studentLocation?: string;
    preferredContactMethod?: 'chat' | 'phone' | 'email' | 'whatsapp';
    studentCollege?: string;
    title?: string;
    subject?: string;
    courseCode?: string;
    description?: string;
    requirements: string[];
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: 'pdf' | 'doc' | 'code' | 'image' | 'other';
    bounty?: number;
    escrowStatus: 'none' | 'held' | 'released' | 'refunded';
    deadline?: string;
    urgency?: 'Normal' | 'High' | 'Urgent (Within 24h)';
    status: 'open' | 'assigned' | 'submitted' | 'completed' | 'cancelled';
    solverId?: string;
    solverName?: string;
    solverAvatar?: string;
    solverCollege?: string;
    solverVerified?: boolean;
    assignedAt?: string;
    proposals: AssignmentProposalDoc[];
    submission?: AssignmentSubmissionDoc;
    studentRating?: number;
    studentReview?: string;
    createdAt: string;
}

const AssignmentProposalSchema = new Schema<AssignmentProposalDoc>(
    {
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
        counterStatus: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
        },
        counterBy: String,
        status: { type: String, enum: ['pending', 'accepted', 'declined'] },
        createdAt: String,
    },
    { _id: false }
);

const AssignmentSubmissionSchema = new Schema<AssignmentSubmissionDoc>(
    {
        id: String,
        solverId: String,
        solverName: String,
        submittedAt: String,
        solutionNotes: String,
        solutionFileUrl: String,
        solutionFileName: String,
        status: {
            type: String,
            enum: ['submitted', 'approved', 'revision_requested'],
        },
        reviewFeedback: String,
    },
    { _id: false }
);

const AssignmentSchema = new Schema<AssignmentDoc>(
    {
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
        preferredContactMethod: {
            type: String,
            enum: ['chat', 'phone', 'email', 'whatsapp'],
        },
        studentCollege: String,
        title: String,
        subject: String,
        courseCode: String,
        description: String,
        requirements: { type: [String], default: [] },
        attachmentUrl: String,
        attachmentName: String,
        attachmentType: {
            type: String,
            enum: ['pdf', 'doc', 'code', 'image', 'other'],
        },
        bounty: Number,
        escrowStatus: {
            type: String,
            required: true,
            enum: ['none', 'held', 'released', 'refunded'],
            default: 'none',
        },
        deadline: String,
        urgency: {
            type: String,
            enum: ['Normal', 'High', 'Urgent (Within 24h)'],
        },
        status: {
            type: String,
            required: true,
            enum: ['open', 'assigned', 'submitted', 'completed', 'cancelled'],
            default: 'open',
        },
        solverId: String,
        solverName: String,
        solverAvatar: String,
        solverCollege: String,
        solverVerified: Boolean,
        assignedAt: String,
        proposals: { type: [AssignmentProposalSchema], default: [] },
        submission: AssignmentSubmissionSchema,
        studentRating: Number,
        studentReview: String,
        createdAt: String,
    },
    opts
);
export const AssignmentModel: Model<AssignmentDoc> =
    (mongoose.models.Assignment as Model<AssignmentDoc>) ||
    mongoose.model<AssignmentDoc>('Assignment', AssignmentSchema);

// ============================================================
// ESCROW TRANSACTION
// ============================================================
export interface EscrowTransactionDoc {
    id: string;
    campusId?: string;
    payerId?: string;
    payeeId?: string;
    amount: number;
    type?:
    | 'tutoring_escrow'
    | 'equipment_deposit'
    | 'equipment_rent'
    | 'note_purchase'
    | 'assignment_bounty';
    referenceId?: string;
    status: 'held' | 'released' | 'refunded' | 'disputed';
    createdAt: string;
    releasedAt?: string;
    refundedAt?: string;
    note?: string;
}

const EscrowTransactionSchema = new Schema<EscrowTransactionDoc>(
    {
        id: { type: String, required: true, unique: true, index: true },
        campusId: String,
        payerId: { type: String, index: true },
        payeeId: { type: String, index: true },
        amount: { type: Number, required: true },
        type: {
            type: String,
            enum: [
                'tutoring_escrow',
                'equipment_deposit',
                'equipment_rent',
                'note_purchase',
                'assignment_bounty',
            ],
        },
        referenceId: { type: String, index: true },
        status: {
            type: String,
            required: true,
            enum: ['held', 'released', 'refunded', 'disputed'],
            default: 'held',
        },
        createdAt: String,
        releasedAt: String,
        refundedAt: String,
        note: String,
    },
    opts
);
export const EscrowTransactionModel: Model<EscrowTransactionDoc> =
    (mongoose.models.EscrowTransaction as Model<EscrowTransactionDoc>) ||
    mongoose.model<EscrowTransactionDoc>(
        'EscrowTransaction',
        EscrowTransactionSchema
    );

// ============================================================
// AGGREGATE EXPORT
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