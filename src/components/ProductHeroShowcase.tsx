import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { TabType } from './NavigationTabs.tsx';
import {
  IconCalendar,
  IconClock,
  IconShield,
  IconStar,
  IconBook,
  IconCheck,
  IconArrowRight,
  IconGraduation,
  IconCar,
  IconWrench,
  IconUsers,
  IconHome,
  IconBuilding,
  IconWallet,
  IconLock,
  IconUser,
  IconFileText
} from './icons.tsx';

interface ProductHeroShowcaseProps {
  onSelectTab?: (tab: TabType) => void;
  onSelectTutoring: () => void;
  onSelectNotes: () => void;
  onOpenBooking: (tutor: any) => void;
  onPreviewNote: (note: any) => void;
  onOpenLogin?: (role?: 'student' | 'admin') => void;
  onOpenRegister?: () => void;
}

type FacilityKey = 'tutoring' | 'notes' | 'carpool' | 'equipment' | 'study' | 'roommates' | 'pgs' | 'assignments';

export const ProductHeroShowcase: React.FC<ProductHeroShowcaseProps> = ({
  onSelectTab,
  onSelectTutoring,
  onSelectNotes,
  onPreviewNote,
  onOpenLogin,
  onOpenRegister
}) => {
  const { user, showAlert, refreshUser } = useAuth();
  const [activeFacility, setActiveFacility] = useState<FacilityKey>('tutoring');
  const [selectedSlot, setSelectedSlot] = useState<string>('Today, 4:00 PM');
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleNavigate = (tab: TabType) => {
    if (onSelectTab) {
      onSelectTab(tab);
    } else if (tab === 'tutoring') {
      onSelectTutoring();
    } else if (tab === 'notes') {
      onSelectNotes();
    }
  };

  // 1. Featured Senior Tutors
  const featuredTutors = [
    {
      id: 'usr_tutor_1',
      name: 'Sarah Chen',
      role: 'Senior • Computer Science',
      gpa: '3.94 GPA',
      hourlyRate: 25,
      subjects: ['Data Structures & Algorithms', 'Design and Analysis of Systems'],
      rating: 4.95,
      reviewsCount: 38,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      availableSlots: ['Today, 4:00 PM', 'Tomorrow, 10:30 AM', 'Friday, 2:00 PM']
    },
    {
      id: 'usr_tutor_2',
      name: 'Marcus Vance',
      role: 'Senior • Mechanical Engineering',
      gpa: '3.88 GPA',
      hourlyRate: 22,
      subjects: ['Applied Mechanics & Dynamics', 'Linear Algebra & Multivariable Calculus'],
      rating: 4.88,
      reviewsCount: 24,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      availableSlots: ['Tomorrow, 3:00 PM', 'Thursday, 11:00 AM', 'Saturday, 1:00 PM']
    }
  ];
  const [activeTutorIndex, setActiveTutorIndex] = useState(0);
  const currentTutor = featuredTutors[activeTutorIndex];

  // 2. Featured Course Notes
  const featuredNotes = [
    {
      id: 'note_1',
      title: 'Algorithms & Data Structures - Comprehensive Midterm & Final Cheatsheet',
      courseCode: 'CS 201',
      semester: 'Spring 2026',
      professor: 'Prof. T. Henderson',
      sellerName: 'Sarah Chen',
      pages: 42,
      price: 12,
      rating: 4.95,
      reviewsCount: 18,
      previewUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'note_2',
      title: 'Solid Mechanics & Statics - Solved Problem Sets & Free Body Diagrams',
      courseCode: 'ENGR 104',
      semester: 'Autumn 2025',
      professor: 'Prof. K. Sheppard',
      sellerName: 'Marcus Vance',
      pages: 68,
      price: 0,
      isFree: true,
      rating: 4.85,
      reviewsCount: 12,
      previewUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80'
    }
  ];

  // 3. Featured Carpool Rides
  const featuredRides = [
    {
      id: 'ride_1',
      driverName: 'Marcus Vance',
      driverAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      vehicle: 'Honda Civic (Silver, 2021)',
      source: 'North Campus / Student Union',
      destination: 'Central Transit Station / Metro Hub',
      time: 'Today • 08:30 AM',
      seatsAvailable: 2,
      pricePerSeat: 6,
      notes: 'AC on, Spotify aux ready. Quick commuter route.'
    },
    {
      id: 'ride_2',
      driverName: 'Sarah Chen',
      driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      vehicle: 'Vespa Elettrica (Teal)',
      source: 'University Student Residences',
      destination: 'Downtown Center / Grocery Market',
      time: 'Today • 05:15 PM',
      seatsAvailable: 1,
      pricePerSeat: 3,
      notes: 'Quick grocery run. Clean spare helmet provided!'
    }
  ];

  // 4. Featured Equipment
  const featuredEquipment = [
    {
      id: 'eq_1',
      name: 'TI-Nspire CX II CAS Color Graphing Calculator',
      ownerName: 'Marcus Vance',
      category: 'Calculators',
      dailyRate: 4,
      deposit: 40,
      condition: 'Excellent',
      image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
      description: 'Approved for Calculus & Engineering midterm examinations. Rechargeable battery included.'
    },
    {
      id: 'eq_2',
      name: 'Arduino Mega 2560 R3 + 50 Sensor Kit',
      ownerName: 'Sarah Chen',
      category: 'Lab Kits',
      dailyRate: 5,
      deposit: 30,
      condition: 'Good',
      image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=600&q=80',
      description: 'Complete kit with OLED, ultrasonic, and servo motors for engineering hackathons.'
    },
    {
      id: 'eq_3',
      name: 'Sony Alpha a6400 4K Camera + 16-50mm Lens',
      ownerName: 'Marcus Vance',
      category: 'Cameras',
      dailyRate: 18,
      deposit: 150,
      condition: 'Mint',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      description: 'Ideal for student club media, portfolio projects, and events. 128GB SD card included.'
    }
  ];

  // 5. Featured Study Groups
  const featuredStudyGroups = [
    {
      id: 'group_1',
      name: 'Algorithms & Problem Solving Sprint',
      subject: 'Computer Science',
      topic: 'Dynamic Programming & Network Flow proofs',
      membersCount: 2,
      maxMembers: 8,
      location: 'Central Campus Library Room 214',
      nextMeeting: 'Thursday • 6:00 PM',
      creatorName: 'Sarah Chen'
    },
    {
      id: 'group_2',
      name: 'SWE Interview Prep & LeetCode Squad',
      subject: 'Interview Prep',
      topic: 'Blind 75 & Mock Whiteboard Drills',
      membersCount: 3,
      maxMembers: 12,
      location: 'Student Hub / Engineering Lounge',
      nextMeeting: 'Friday • 7:30 PM',
      creatorName: 'Marcus Vance'
    }
  ];

  // 6. Featured Roommates
  const featuredRoommates = [
    {
      id: 'rm_1',
      name: 'Sarah Chen',
      course: 'Computer Science • Junior',
      budget: '₹8,000 - ₹12,000',
      location: 'University Heights / Campus Terrace',
      sleepHabit: 'Night Owl (after 1 AM)',
      cleanliness: 'Extremely Clean',
      studyHabit: 'Quiet Study',
      matchScore: 94,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'rm_2',
      name: 'Marcus Vance',
      course: 'Mechanical Engineering • Senior',
      budget: '₹7,000 - ₹10,000',
      location: 'College Area / Metro Station',
      sleepHabit: 'Early Bird (before 11 PM)',
      cleanliness: 'Moderate',
      studyHabit: 'Background Music',
      matchScore: 88,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
    }
  ];

  // 7. Featured Campus PG & Housing
  const featuredHousing = [
    {
      id: 'pg_1',
      title: 'Sunny Master Bedroom near Campus Shuttle',
      distance: '1.5 km to University Campus',
      rent: 1150,
      type: '2BHK Apartment Flat',
      landlord: 'Marcus Vance (Student Host)',
      amenities: ['High-Speed WiFi', 'In-Unit Washer/Dryer', 'Furnished Desk', 'Air Conditioning'],
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'pg_2',
      title: 'University Student Residences - Studio Flat',
      distance: '1.2 km to Campus Gate',
      rent: 1400,
      type: 'Studio Apartment',
      landlord: 'Campus Verified Residences',
      amenities: ['Swimming Pool', 'Gym Access', 'Dishwasher', 'Bike Storage'],
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    }
  ];

  // Quick Action Handlers
  const handleQuickBook = async () => {
    setBookingLoading(true);
    try {
      const res = await api.bookSession({
        tutorId: currentTutor.id,
        subject: currentTutor.subjects[0],
        date: new Date().toISOString().split('T')[0],
        time: selectedSlot.split(', ')[1] || '04:00 PM',
        durationHours: 1,
        sessionType: '1-on-1',
        topicDescription: 'Midterm preparation and algorithmic review'
      });
      if (res.success) {
        showAlert(`Tutoring slot booked with ${currentTutor.name}. $${currentTutor.hourlyRate} held in secure escrow.`, 'success');
        await refreshUser();
        handleNavigate('tutoring');
      }
    } catch (err: any) {
      showAlert(err.message || 'Booking failed. Please check your wallet balance.', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleQuickBuyNote = async (note: any) => {
    try {
      const res = await api.purchaseNote(note.id);
      if (res.success) {
        showAlert(`Purchased "${note.courseCode}" notes. PDF download available in your library.`, 'success');
        await refreshUser();
        handleNavigate('notes');
      }
    } catch (err: any) {
      showAlert(err.message || 'Purchase failed', 'error');
    }
  };

  // Facility Navigation Cards
  const facilityCatalog = [
    {
      key: 'tutoring' as FacilityKey,
      tab: 'tutoring' as TabType,
      label: 'Peer Tutoring',
      tag: '1-on-1 Mentorship',
      icon: IconGraduation,
      headline: 'Book Verified Department Seniors',
      description: 'Reserve private 1-on-1 sessions with seniors who achieved top grades in your courses. Includes live WebRTC video room and escrow settlement.',
      metric: '18+ Active Tutors',
      badge: '₹400-₹600 / hr'
    },
    {
      key: 'notes' as FacilityKey,
      tab: 'notes' as TabType,
      label: 'Course Notes',
      tag: 'Academic Exchange',
      icon: IconBook,
      headline: 'Access Course-Tested Lecture Notes',
      description: 'Handwritten notes, solved problem sets, and formula cheatsheets vetted by verified students. Watermarked previews with instant download.',
      metric: '45+ Course Guides',
      badge: 'Free or ₹150-₹350'
    },
    {
      key: 'carpool' as FacilityKey,
      tab: 'carpool' as TabType,
      label: 'Ride Pooling',
      tag: 'Campus Commute',
      icon: IconCar,
      headline: 'Split Gas Fares with Fellow Students',
      description: 'Share rides to downtown, Caltrain stations, grocery markets, or the airport. Verified student drivers with transparent fair-split pricing.',
      metric: '12 Active Routes',
      badge: '₹50 - ₹150 / seat'
    },
    {
      key: 'equipment' as FacilityKey,
      tab: 'equipment' as TabType,
      label: 'Lab & Equipment',
      tag: 'Peer Lending',
      icon: IconWrench,
      headline: 'Borrow Lab Hardware & Digital Cameras',
      description: 'Rent graphing calculators, micro-controller sensor kits, DSLR cameras, and lab gear from peers with security deposit escrow protection.',
      metric: '28 Available Items',
      badge: '₹100 - ₹450 / day'
    },
    {
      key: 'study' as FacilityKey,
      tab: 'study' as TabType,
      label: 'Study Groups',
      tag: 'Collaboration',
      icon: IconUsers,
      headline: 'Form Exam Sprints & LeetCode Squads',
      description: 'Join focused revision groups for your upcoming midterms and finals. Coordinate library study rooms, share practice materials, and stay on track.',
      metric: '16 Active Squads',
      badge: 'Open to Join'
    },
    {
      key: 'roommates' as FacilityKey,
      tab: 'roommates' as TabType,
      label: 'Roommate Match',
      tag: 'Lifestyle Scoring',
      icon: IconHome,
      headline: 'Find Compatible Student Roommates',
      description: 'Compare sleep patterns, study styles, cleanliness habits, and budget with student peers. Built-in compatibility scoring avoids co-living friction.',
      metric: '32 Looking Students',
      badge: '90%+ Match'
    },
    {
      key: 'pgs' as FacilityKey,
      tab: 'pgs' as TabType,
      label: 'Campus Housing',
      tag: 'Verified Accommodations',
      icon: IconBuilding,
      headline: 'Verified Off-Campus Flats & PGs',
      description: 'Browse student apartments, sublets, and PGs within walking or shuttle distance. Verified student landlords, amenity tags, and transparent rent.',
      metric: '14 Verified Listings',
      badge: 'Shuttle Friendly'
    },
    {
      key: 'assignments' as FacilityKey,
      tab: 'assignments' as TabType,
      label: 'Assignment Help',
      tag: 'Earn ₹ & Peer Bounties',
      icon: IconFileText,
      headline: 'Upload Pending Problem Sets & Solve for Money',
      description: 'Upload pending homework, lab reports, or code assignments for verified peer help. Complete tasks for classmates to earn money safely locked in escrow.',
      metric: 'Bounties up to ₹1,500',
      badge: 'Escrow Protected'
    }
  ];

  return (
    <section className="py-10 sm:py-14 border-b border-[#e5e5ea] bg-[#fbfbfa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Header & Positioning */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f0f0f2] border border-[#e5e5ea] text-[11px] font-medium text-[#1d1d1f] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
            <span>Verified Intranet</span>
            <span className="text-[#86868b]">•</span>
            <span className="text-[#515154]">{user ? user.collegeName : 'Multi-Campus Student Ecosystem'}</span>
            <span className="text-[#86868b]">•</span>
            <span className="text-[#0071e3] font-semibold">{user ? `@${user.domain} Domain-Locked` : 'Multi-University Domain Isolation'}</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#1d1d1f] leading-[1.12] mb-5">
            The complete student ecosystem for your campus.
          </h1>

          <p className="text-sm sm:text-base text-[#515154] leading-relaxed max-w-2xl mx-auto mb-6">
            Everything students need in one verified network: peer tutoring, course notes exchange, commute carpooling, lab hardware rental, collaborative study squads, roommate matching, and verified campus housing.
          </p>

          {/* Quick Access Portal Actions (Registration & Login) */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-7">
            <button
              onClick={() => onOpenRegister && onOpenRegister()}
              className="px-5 py-2.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <IconGraduation className="w-4 h-4" />
              <span>Register Student Account</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onOpenLogin && onOpenLogin('student')}
              className="px-4 py-2.5 rounded-lg bg-[#ffffff] hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] text-xs font-medium transition flex items-center gap-2 cursor-pointer"
            >
              <span>Student Login (Username / Admission No)</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => onSelectTab && onSelectTab('admin')}
                className="px-4 py-2.5 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#e5e5ea] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <IconShield className="w-3.5 h-3.5 text-[#1d1d1f]" />
                <span>Campus Moderation Portal</span>
              </button>
            )}

            <button
              onClick={() => handleNavigate('profile')}
              className="px-4 py-2.5 rounded-lg bg-[#ffffff] hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <IconUser className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>My Profile & ID Status</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f0f7ff] border border-[#d0e5ff] text-[11px] text-[#0051a8] mb-8">
            <IconCheck className="w-3.5 h-3.5 text-[#0071e3]" />
            <span><strong>Universal Student Role:</strong> Any student can tutor peers, host carpool rides, exchange notes, and rent lab equipment — without restricted single-feature locks.</span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2 pb-2">
            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-lg p-3 text-center">
              <div className="text-base sm:text-lg font-bold text-[#1d1d1f]">7 Modules</div>
              <div className="text-[11px] text-[#86868b]">Unified Campus Network</div>
            </div>
            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-lg p-3 text-center">
              <div className="text-base sm:text-lg font-bold text-[#137333]">100% Escrow</div>
              <div className="text-[11px] text-[#86868b]">Zero Payment Risk</div>
            </div>
            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-lg p-3 text-center">
              <div className="text-base sm:text-lg font-bold text-[#1d1d1f]">Institutional</div>
              <div className="text-[11px] text-[#86868b]">Domain-Locked Auth</div>
            </div>
            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-lg p-3 text-center">
              <div className="text-base sm:text-lg font-bold text-[#0071e3]">Live WebRTC</div>
              <div className="text-[11px] text-[#86868b]">Built-in Video Tutoring</div>
            </div>
          </div>
        </div>

        {/* The Interactive Multi-Feature Console */}
        <div id="product-console" className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl shadow-xs overflow-hidden">
          {/* Console Header with all 7 Tabs */}
          <div className="px-4 sm:px-6 py-3 border-b border-[#e5e5ea] bg-[#f5f5f7]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#1d1d1f]">Interactive Feature Showcase:</span>
                <span className="text-xs text-[#86868b]">Select any module to preview live data & actions</span>
              </div>

              {/* 7-Feature Tab Bar */}
              <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
                {facilityCatalog.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeFacility === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveFacility(item.key)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#1d1d1f] text-[#ffffff] shadow-xs'
                          : 'bg-[#ffffff] text-[#515154] hover:text-[#1d1d1f] border border-[#e5e5ea]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Console Body: 1. Peer Tutoring */}
          {activeFacility === 'tutoring' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">1-on-1 Peer Tutoring & Live Video</h3>
                  <p className="text-xs text-[#515154]">Book senior mentors from your department with automated escrow protection.</p>
                </div>
                <button
                  onClick={() => handleNavigate('tutoring')}
                  className="text-xs font-medium text-[#0071e3] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Open Full Tutoring Hub</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Tutor Roster */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs uppercase font-medium tracking-wider text-[#86868b]">
                    Select Department Senior
                  </div>
                  {featuredTutors.map((tutor, idx) => {
                    const isSelected = activeTutorIndex === idx;
                    return (
                      <div
                        key={tutor.id}
                        onClick={() => {
                          setActiveTutorIndex(idx);
                          setSelectedSlot(tutor.availableSlots[0]);
                        }}
                        className={`p-4 rounded-lg border text-left cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#0071e3] bg-[#fbfbfa]'
                            : 'border-[#e5e5ea] hover:bg-[#fbfbfa]'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5">
                          <img
                            src={tutor.avatar}
                            alt={tutor.name}
                            className="w-11 h-11 rounded-full object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-[#1d1d1f] truncate">{tutor.name}</h4>
                              <span className="text-sm font-medium text-[#1d1d1f]">${tutor.hourlyRate}/hr</span>
                            </div>
                            <p className="text-xs text-[#515154] mt-0.5">{tutor.role}</p>
                            <div className="flex items-center space-x-2 mt-2 text-[11px] text-[#86868b]">
                              <span className="text-[#1d1d1f] font-medium">{tutor.gpa}</span>
                              <span>•</span>
                              <span className="flex items-center text-[#1d1d1f]">
                                <IconStar className="w-3 h-3 text-[#f5a623] mr-0.5" />
                                {tutor.rating} ({tutor.reviewsCount} reviews)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded-md text-xs text-[#515154] flex items-start space-x-2">
                    <IconShield className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#1d1d1f]">Escrow Security:</strong> ${currentTutor.hourlyRate} is held in neutral escrow until session completion.
                    </span>
                  </div>
                </div>

                {/* Right: Slot Booking Console */}
                <div className="lg:col-span-7 bg-[#fbfbfa] border border-[#e5e5ea] rounded-lg p-5 sm:p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#1d1d1f]">Reserve Session with {currentTutor.name}</h4>
                    <p className="text-xs text-[#515154]">Pick a slot. A private WebRTC video room link is generated instantly upon confirmation.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Subject Specialization</label>
                    <div className="text-xs font-medium text-[#1d1d1f] bg-[#ffffff] border border-[#d2d2d7] rounded-md px-3 py-2">
                      {currentTutor.subjects[0]}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Available Calendar Slots</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {currentTutor.availableSlots.map((slot) => {
                        const isSlotSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-2 rounded-md text-xs font-medium border text-center transition-colors cursor-pointer ${
                              isSlotSelected
                                ? 'border-[#0071e3] bg-[#ffffff] text-[#0071e3] font-semibold'
                                : 'border-[#e5e5ea] bg-[#ffffff] text-[#515154] hover:border-[#d2d2d7]'
                            }`}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <IconClock className="w-3 h-3 text-[#86868b]" />
                              <span>{slot}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e5e5ea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-xs text-[#86868b]">Escrow Authorization</div>
                      <div className="text-lg font-semibold text-[#1d1d1f]">${currentTutor.hourlyRate}.00</div>
                    </div>
                    <button
                      onClick={handleQuickBook}
                      disabled={bookingLoading}
                      className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      {bookingLoading ? <span>Reserving...</span> : (
                        <>
                          <span>Book Slot into Escrow</span>
                          <IconArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Console Body: 2. Course Notes */}
          {activeFacility === 'notes' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">Course-Tested Notes & Solved Problem Sets</h3>
                  <p className="text-xs text-[#515154]">Preview first 3 pages before purchase. Instant PDF access with student royalties.</p>
                </div>
                <button
                  onClick={() => handleNavigate('notes')}
                  className="text-xs font-medium text-[#0071e3] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Explore Full Notes Catalog</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-[#e5e5ea] rounded-lg p-5 flex flex-col justify-between hover:border-[#d2d2d7] transition-colors bg-[#ffffff]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f]">
                          {note.courseCode}
                        </span>
                        <span className="text-base font-semibold text-[#1d1d1f]">
                          {note.price === 0 ? 'Free' : `$${note.price}.00`}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-[#1d1d1f] leading-snug mb-1">{note.title}</h4>
                      <p className="text-xs text-[#515154] mb-3">
                        {note.professor} • {note.semester} • Authored by {note.sellerName}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-[#86868b] mb-4">
                        <span>{note.pages} pages</span>
                        <span>•</span>
                        <span className="flex items-center text-[#1d1d1f]">
                          <IconStar className="w-3 h-3 text-[#f5a623] mr-1" />
                          {note.rating} ({note.reviewsCount})
                        </span>
                        <span>•</span>
                        <span className="text-[#137333]">Verified Student Author</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#e5e5ea] flex items-center justify-between">
                      <button
                        onClick={() => onPreviewNote(note)}
                        className="text-xs text-[#515154] hover:text-[#1d1d1f] font-medium underline-offset-2 hover:underline cursor-pointer"
                      >
                        Preview First 3 Pages
                      </button>
                      <button
                        onClick={() => handleQuickBuyNote(note)}
                        className="px-3.5 py-1.5 bg-[#1d1d1f] hover:bg-[#333336] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                      >
                        {note.price === 0 ? 'Download Free Notes' : `Acquire Notes ($${note.price})`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console Body: 3. Ride Pooling */}
          {activeFacility === 'carpool' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">Campus Ride Pooling & Commute Sharing</h3>
                  <p className="text-xs text-[#515154]">Split gas costs with fellow student drivers heading to train stations, grocery stores, and tech offices.</p>
                </div>
                <button
                  onClick={() => handleNavigate('carpool')}
                  className="text-xs font-medium text-[#0071e3] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All Rides & Post Route</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredRides.map((ride) => (
                  <div key={ride.id} className="border border-[#e5e5ea] rounded-lg p-5 bg-[#ffffff] space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={ride.driverAvatar} alt={ride.driverName} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="text-sm font-semibold text-[#1d1d1f]">{ride.driverName}</h4>
                          <p className="text-xs text-[#515154]">{ride.vehicle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-[#1d1d1f]">${ride.pricePerSeat} <span className="text-xs font-normal text-[#86868b]">/ seat</span></div>
                        <span className="text-[11px] font-medium text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded">
                          {ride.seatsAvailable} seats available
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#fbfbfa] p-3 rounded-md border border-[#e5e5ea] text-xs space-y-1.5">
                      <div className="flex items-center space-x-2 text-[#1d1d1f]">
                        <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
                        <span className="font-medium">Origin:</span> <span>{ride.source}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[#1d1d1f]">
                        <span className="w-2 h-2 rounded-full bg-[#c62828]"></span>
                        <span className="font-medium">Destination:</span> <span>{ride.destination}</span>
                      </div>
                      <div className="text-[#86868b] pt-1 flex items-center space-x-2">
                        <IconClock className="w-3.5 h-3.5" />
                        <span>{ride.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-[#515154] italic">"{ride.notes}"</span>
                      <button
                        onClick={() => handleNavigate('carpool')}
                        className="px-3 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Reserve Seat (₹{ride.pricePerSeat})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console Body: 4. Lab & Equipment */}
          {activeFacility === 'equipment' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">Lab Hardware & Equipment Lending</h3>
                  <p className="text-xs text-[#515154]">Borrow graphing calculators, micro-controller sensor kits, and DSLR cameras with escrow deposit lock.</p>
                </div>
                <button
                  onClick={() => handleNavigate('equipment')}
                  className="text-xs font-medium text-[#0071e3] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All 28 Lab Tools</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featuredEquipment.map((item) => (
                  <div key={item.id} className="border border-[#e5e5ea] rounded-lg overflow-hidden bg-[#ffffff] flex flex-col justify-between">
                    <img src={item.image} alt={item.name} className="w-full h-36 object-cover" />
                    <div className="p-4 space-y-2 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea]">
                          {item.category}
                        </span>
                        <span className="text-[#137333] font-medium">{item.condition}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#1d1d1f] line-clamp-2 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-[#515154] line-clamp-2">{item.description}</p>
                    </div>
                    <div className="p-4 border-t border-[#e5e5ea] bg-[#fbfbfa] flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#1d1d1f]">${item.dailyRate}/day</div>
                        <div className="text-[10px] text-[#86868b]">${item.deposit} deposit in escrow</div>
                      </div>
                      <button
                        onClick={() => handleNavigate('equipment')}
                        className="px-3 py-1.5 bg-[#1d1d1f] hover:bg-[#333336] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Borrow Gear
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console Body: 5. Study Groups */}
          {activeFacility === 'study' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">Collaborative Midterm Sprints & Study Squads</h3>
                  <p className="text-xs text-[#515154]">Join weekly problem-solving groups, share practice exams, and book group study rooms.</p>
                </div>
                <button
                  onClick={() => handleNavigate('study')}
                  className="text-xs font-medium text-[#0071e3] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Explore All Study Squads</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredStudyGroups.map((group) => (
                  <div key={group.id} className="border border-[#e5e5ea] rounded-lg p-5 bg-[#ffffff] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#f0f0f2] text-[#1d1d1f]">
                          {group.subject}
                        </span>
                        <h4 className="text-sm font-semibold text-[#1d1d1f] mt-1.5">{group.name}</h4>
                      </div>
                      <span className="text-xs font-medium text-[#0071e3] bg-[#e8f0fe] px-2.5 py-1 rounded-full">
                        {group.membersCount}/{group.maxMembers} Members
                      </span>
                    </div>

                    <p className="text-xs text-[#515154]">Focus: {group.topic}</p>

                    <div className="p-3 bg-[#fbfbfa] border border-[#e5e5ea] rounded-md text-xs space-y-1 text-[#1d1d1f]">
                      <div className="flex items-center space-x-2">
                        <IconCalendar className="w-3.5 h-3.5 text-[#86868b]" />
                        <span>Next Session: {group.nextMeeting}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IconBuilding className="w-3.5 h-3.5 text-[#86868b]" />
                        <span>Location: {group.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-[#86868b]">Created by {group.creatorName}</span>
                      <button
                        onClick={() => handleNavigate('study')}
                        className="px-3.5 py-1.5 bg-[#1d1d1f] hover:bg-[#333336] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Join Study Sprint
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console Body: 6. Roommates */}
          {activeFacility === 'roommates' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">Verified Roommate Matcher & Lifestyle Compatibility</h3>
                  <p className="text-xs text-[#515154]">Find peers matching your sleep schedule, cleanliness preferences, and monthly rent budget.</p>
                </div>
                <button
                  onClick={() => handleNavigate('roommates')}
                  className="text-xs font-medium text-[#0071e3] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Take Lifestyle Quiz & Match</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredRoommates.map((rm) => (
                  <div key={rm.id} className="border border-[#e5e5ea] rounded-lg p-5 bg-[#ffffff] space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3.5">
                        <img src={rm.avatar} alt={rm.name} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                          <h4 className="text-sm font-semibold text-[#1d1d1f]">{rm.name}</h4>
                          <p className="text-xs text-[#515154]">{rm.course}</p>
                          <span className="text-[11px] text-[#86868b]">{rm.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded">
                          {rm.matchScore}% Match
                        </div>
                        <div className="text-xs font-medium text-[#1d1d1f] mt-1">{rm.budget}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-[#fbfbfa] rounded border border-[#e5e5ea]">
                        <div className="text-[10px] text-[#86868b]">Sleep</div>
                        <div className="font-medium text-[#1d1d1f] text-[11px] truncate">{rm.sleepHabit}</div>
                      </div>
                      <div className="p-2 bg-[#fbfbfa] rounded border border-[#e5e5ea]">
                        <div className="text-[10px] text-[#86868b]">Cleanliness</div>
                        <div className="font-medium text-[#1d1d1f] text-[11px] truncate">{rm.cleanliness}</div>
                      </div>
                      <div className="p-2 bg-[#fbfbfa] rounded border border-[#e5e5ea]">
                        <div className="text-[10px] text-[#86868b]">Study Style</div>
                        <div className="font-medium text-[#1d1d1f] text-[11px] truncate">{rm.studyHabit}</div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleNavigate('roommates')}
                        className="px-4 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                      >
                        Connect & Compare Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console Body: 7. Campus Housing */}
          {activeFacility === 'pgs' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">Verified Off-Campus Flats & PGs</h3>
                  <p className="text-xs text-[#515154]">Student-reviewed apartments, sublets, and PGs within quick biking or shuttle reach.</p>
                </div>
                <button
                  onClick={() => handleNavigate('pgs')}
                  className="text-xs font-medium text-[#0071e3] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Browse All Verified Housing</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredHousing.map((h) => (
                  <div key={h.id} className="border border-[#e5e5ea] rounded-lg overflow-hidden bg-[#ffffff]">
                    <img src={h.image} alt={h.title} className="w-full h-44 object-cover" />
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-medium text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded">
                            {h.distance}
                          </span>
                          <h4 className="text-sm font-semibold text-[#1d1d1f] mt-1.5">{h.title}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-[#1d1d1f]">${h.rent} <span className="text-xs font-normal text-[#86868b]">/ mo</span></div>
                          <span className="text-[11px] text-[#515154]">{h.type}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {h.amenities.map((am) => (
                          <span key={am} className="text-[10px] bg-[#f5f5f7] border border-[#e5e5ea] px-2 py-0.5 rounded text-[#515154]">
                            {am}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-[#e5e5ea] flex items-center justify-between">
                        <span className="text-xs text-[#86868b]">{h.landlord}</span>
                        <button
                          onClick={() => handleNavigate('pgs')}
                          className="px-3.5 py-1.5 bg-[#1d1d1f] hover:bg-[#333336] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                        >
                          View Listing Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console Body: 8. Assignment Help */}
          {activeFacility === 'assignments' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e5e5ea]">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">Assignment Help & Peer Bounty Board</h3>
                  <p className="text-xs text-[#515154]">Upload pending problem sets or code assignments. Classmates solve them for cash rewards held safely in escrow.</p>
                </div>
                <button
                  onClick={() => handleNavigate('assignments')}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  <span>Open Assignment Board</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#e5e5ea] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded">CS106B • Algorithms</span>
                    <span className="text-xs font-bold text-[#34c759]">₹800 Bounty</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#1d1d1f]">Red-Black Balanced Trees Analysis</h4>
                  <p className="text-[11px] text-[#515154] line-clamp-2">Complete the rotation logic for balanced search trees with runtime benchmark report.</p>
                  <div className="pt-2 border-t border-[#e5e5ea] flex items-center justify-between text-[10px] text-[#86868b]">
                    <span>Due in 18 hrs</span>
                    <span className="text-emerald-700 font-bold">Escrow Secured</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#e5e5ea] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded">MATH51 • Calculus</span>
                    <span className="text-xs font-bold text-[#34c759]">₹650 Bounty</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#1d1d1f]">Gram-Schmidt & Eigenvalues Problem Set</h4>
                  <p className="text-[11px] text-[#515154] line-clamp-2">Detailed step-by-step intermediate algebra derivations with LaTeX or clean PDF.</p>
                  <div className="pt-2 border-t border-[#e5e5ea] flex items-center justify-between text-[10px] text-[#86868b]">
                    <span>Due tomorrow</span>
                    <span className="text-emerald-700 font-bold">Escrow Secured</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#e5e5ea] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded">ME201 • Thermodynamics</span>
                    <span className="text-xs font-bold text-[#34c759]">₹1,000 Bounty</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#1d1d1f]">Rankine Cycle Simulation & Lab Report</h4>
                  <p className="text-[11px] text-[#515154] line-clamp-2">Complete the enthalpy balance equations, Excel calculations, and T-s diagram plots.</p>
                  <div className="pt-2 border-t border-[#e5e5ea] flex items-center justify-between text-[10px] text-[#86868b]">
                    <span>Due Friday</span>
                    <span className="text-emerald-700 font-bold">Escrow Secured</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Ecosystem Grid: Showcasing All Facilities Directly */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">All Campus Facilities at a Glance</h2>
            <p className="text-xs sm:text-sm text-[#515154] mt-1">
              Select any campus facility below to immediately jump into its dedicated module.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {facilityCatalog.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-5 hover:border-[#d2d2d7] hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center text-[#1d1d1f]">
                        <Icon className="w-5 h-5 text-[#0071e3]" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded">
                        {card.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
                        {card.tag}
                      </span>
                      <h3 className="text-sm font-semibold text-[#1d1d1f] mt-0.5">{card.label}</h3>
                    </div>

                    <p className="text-xs text-[#515154] leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#e5e5ea] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#86868b]">{card.metric}</span>
                    <button
                      onClick={() => handleNavigate(card.tab)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] hover:underline cursor-pointer"
                    >
                      <span>Explore</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 8th Card: Institutional Escrow & Wallet Security */}
            <div className="bg-[#1d1d1f] text-white rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#333336] flex items-center justify-center text-white">
                    <IconLock className="w-5 h-5 text-[#34a853]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#34a853] bg-[#34a853]/20 px-2 py-0.5 rounded">
                    Security Layer
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
                    Campus Trust
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-0.5">Automated Escrow & Wallet</h3>
                </div>

                <p className="text-xs text-[#a1a1a6] leading-relaxed">
                  Every transaction across tutoring, equipment deposits, and carpools uses institutional escrow holding funds until both parties confirm delivery.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#333336] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#86868b]">Balance: ${user?.walletBalance ?? 250}.00</span>
                <span className="text-xs font-medium text-[#34a853] flex items-center space-x-1">
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Protected</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Trust Pillars Banner */}
        <div className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-full bg-[#ffffff] border border-[#e5e5ea] flex items-center justify-center shrink-0 mt-0.5">
                <IconShield className="w-4 h-4 text-[#0071e3]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">Institutional Domain-Locked</h4>
                <p className="text-xs text-[#515154] mt-1">
                  {user ? (
                    <>Only students with verified <code>@{user.domain}</code> email addresses can view listings, send messages, or reserve services.</>
                  ) : (
                    <>Students access their private campus network using their verified university email domain (.edu, .ac.in, etc.).</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-full bg-[#ffffff] border border-[#e5e5ea] flex items-center justify-center shrink-0 mt-0.5">
                <IconLock className="w-4 h-4 text-[#137333]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">Automated Escrow Vault</h4>
                <p className="text-xs text-[#515154] mt-1">
                  Funds for tutoring hours, notes, and lab security deposits are held in escrow and released only after verified delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-full bg-[#ffffff] border border-[#e5e5ea] flex items-center justify-center shrink-0 mt-0.5">
                <IconWallet className="w-4 h-4 text-[#1d1d1f]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">Peer Accountability Ledger</h4>
                <p className="text-xs text-[#515154] mt-1">
                  Verified student profiles, course history, and peer reviews create transparent accountability without commercial middlemen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
