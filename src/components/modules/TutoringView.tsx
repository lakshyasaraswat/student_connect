import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { TutorProfile, TutoringSession } from '../../types.ts';
import {
  GraduationCap,
  Plus,
  Search,
  Star,
  Video,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Users,
  Award,
  DollarSign,
  Play
} from '../icons.tsx';
import { MessageSquare, ThumbsUp, Sparkles, Edit3, X, Check } from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge.tsx';

const FEEDBACK_TAGS = [
  'Clear Concept Breakdown',
  'Patient with Questions',
  'Solved Difficult Problems',
  'Exam Prep Strategies',
  'Punctual & Prepared',
  'Friendly & Encouraging',
  'Great Code & Notes'
];

const getRatingDescriptor = (score: number) => {
  switch (score) {
    case 5:
      return { title: 'Outstanding (5/5)', desc: 'Exceptional teaching, highly recommended for any student!' };
    case 4:
      return { title: 'Very Good (4/5)', desc: 'Clear explanations and answered all questions patiently.' };
    case 3:
      return { title: 'Good (3/5)', desc: 'Helpful session, successfully covered the target syllabus.' };
    case 2:
      return { title: 'Fair (2/5)', desc: 'Pacing was fast or some key concepts needed more clarity.' };
    case 1:
      return { title: 'Poor (1/5)', desc: 'Did not meet expectations or was unprepared for the topic.' };
    default:
      return { title: 'Select a Star Rating', desc: 'Click on a star to rate this tutoring session.' };
  }
};

interface TutoringViewProps {
  onJoinVideoRoom: (session: TutoringSession) => void;
}

export const TutoringView: React.FC<TutoringViewProps> = ({ onJoinVideoRoom }) => {
  const { user, showAlert } = useAuth();
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'find_tutors' | 'my_sessions'>('find_tutors');

  // Cross-college filters & search
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');

  // Booking Modal
  const [bookingTutor, setBookingTutor] = useState<TutorProfile | null>(null);
  const [bookSubject, setBookSubject] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('04:00 PM');
  const [bookDuration, setBookDuration] = useState(1);
  const [bookType, setBookType] = useState<'1-on-1' | 'Group'>('1-on-1');
  const [bookNotes, setBookNotes] = useState('');

  // Become Tutor Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [subjectsStr, setSubjectsStr] = useState('Algorithms, Operating Systems, Linear Algebra');
  const [bio, setBio] = useState('');
  const [availabilityStr, setAvailabilityStr] = useState('Mon/Wed/Fri Evenings, Weekends');

  // Reviewing & Rating Sessions
  const [completingSession, setCompletingSession] = useState<TutoringSession | null>(null);
  const [ratingModalSession, setRatingModalSession] = useState<TutoringSession | null>(null);
  const [viewingReviewsTutor, setViewingReviewsTutor] = useState<TutorProfile | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (campusFilter !== 'all') params.campusId = campusFilter;
      if (searchQuery) params.search = searchQuery;
      if (subjectQuery) params.subject = subjectQuery;

      const res = await api.getTutors(params);
      if (res.success) {
        setTutors(res.tutors);
      }
    } catch (err) {
      console.warn('Tutors fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.getSessions();
      if (res.success) {
        setSessions(res.sessions);
      }
    } catch (err) {
      console.warn('Sessions fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchTutors();
    fetchSessions();
  }, [campusFilter, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTutors();
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTutor) return;
    try {
      const res = await api.bookSession({
        tutorId: bookingTutor.userId,
        subject: bookSubject || bookingTutor.subjects[0],
        date: bookDate,
        time: bookTime,
        durationHours: Number(bookDuration),
        sessionType: bookType,
        notes: bookNotes
      });

      if (res.success) {
        showAlert(
          `Tutoring session booked! $${res.session.amount} placed in Escrow Guarantee.`,
          'success'
        );
        setBookingTutor(null);
        fetchSessions();
        setActiveTab('my_sessions');
      }
    } catch (err: any) {
      showAlert(err.message || 'Booking failed', 'error');
    }
  };

  const handleSaveTutorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateTutorProfile({
        subjects: subjectsStr.split(',').map((s) => s.trim()).filter(Boolean),
        hourlyRate: Number(hourlyRate),
        bio,
        availability: availabilityStr.split(',').map((s) => s.trim()).filter(Boolean)
      });

      if (res.success) {
        showAlert('Peer tutor profile updated! You are now listed on campus.', 'success');
        setShowProfileModal(false);
        fetchTutors();
      }
    } catch (err: any) {
      showAlert(err.message || 'Profile update failed', 'error');
    }
  };

  const toggleFeedbackTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const openCompletionModal = (session: TutoringSession) => {
    setCompletingSession(session);
    setRating(session.studentRating || 5);
    setHoverRating(0);
    setFeedback(session.studentFeedback || '');
    setSelectedTags([]);
  };

  const openRatingModal = (session: TutoringSession) => {
    setRatingModalSession(session);
    setRating(session.studentRating || 5);
    setHoverRating(0);
    setFeedback(session.studentFeedback || '');
    setSelectedTags([]);
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingSession) return;
    try {
      setIsSubmittingRating(true);
      const combinedFeedback = selectedTags.length > 0 
        ? `${feedback.trim() ? feedback.trim() + ' • ' : ''}Highlights: ${selectedTags.join(', ')}`
        : feedback.trim();

      const res = await api.completeSession(completingSession.id, rating, combinedFeedback);
      if (res.success) {
        showAlert(
          `Session marked complete! Escrow funds ($${res.session.amount}) released to tutor ${completingSession.tutorName}. Thank you for your ${rating}-star feedback!`,
          'success'
        );
        setCompletingSession(null);
        setFeedback('');
        setSelectedTags([]);
        setRating(5);
        fetchSessions();
        fetchTutors();
      }
    } catch (err: any) {
      showAlert(err.message || 'Completion failed', 'error');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleRateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalSession) return;
    try {
      setIsSubmittingRating(true);
      const combinedFeedback = selectedTags.length > 0 
        ? `${feedback.trim() ? feedback.trim() + ' • ' : ''}Highlights: ${selectedTags.join(', ')}`
        : feedback.trim();

      const res = await api.rateSession(ratingModalSession.id, rating, combinedFeedback);
      if (res.success) {
        showAlert(
          `Feedback submitted! You rated ${ratingModalSession.tutorName} ${rating} stars.`,
          'success'
        );
        setRatingModalSession(null);
        setFeedback('');
        setSelectedTags([]);
        setRating(5);
        fetchSessions();
        fetchTutors();
      }
    } catch (err: any) {
      showAlert(err.message || 'Rating submission failed', 'error');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-teal-200 text-xs font-semibold uppercase tracking-wider">
              <span>🎓 Peer Tutoring & Mentorship</span>
              <span>•</span>
              <span>Smart Escrow Payment Protection</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Learn from Top Peers or Monetize Your Academic Strengths
            </h1>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              Book 1-on-1 peer tutoring with video call links. Payment is locked securely in escrow and only transferred to the tutor after you complete the study session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/20">
              <button
                onClick={() => setActiveTab('find_tutors')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'find_tutors' ? 'bg-white text-teal-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Find Tutors
              </button>
              <button
                onClick={() => setActiveTab('my_sessions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'my_sessions' ? 'bg-white text-teal-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Booked Sessions ({sessions.length})
              </button>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Award className="w-4 h-4" />
              Become a Tutor
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'find_tutors' ? (
        /* Tutors Grid */
        <div className="space-y-4">
          {/* Cross-College Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tutors across all universities by name, subjects (e.g. CS161, Algorithms, ML)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">University:</span>
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full md:w-auto px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="all">🌐 All Universities (Cross-College)</option>
                <option value="campus_stanford">Stanford University</option>
                <option value="campus_berkeley">UC Berkeley</option>
                <option value="campus_mit">MIT</option>
                <option value="campus_iitd">IIT Delhi</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              Loading verified campus tutors...
            </div>
          ) : tutors.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="font-bold text-slate-700 text-base">No tutors found</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No peer tutors registered under this filter yet. Be the first to list your tutoring profile!
              </p>
              <button
                onClick={() => setShowProfileModal(true)}
                className="mt-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Create Tutor Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tutors.map((tutor) => {
                const isMe = tutor.userId === user?.id;
                const isCrossCollege = Boolean(tutor.collegeName && user?.collegeName && tutor.collegeName !== user.collegeName);

                return (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Tutor Profile Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={tutor.tutorAvatar}
                            alt={tutor.tutorName}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/20"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                              <span>{tutor.tutorName}</span>
                              <VerifiedBadge isVerified={true} showLabel={false} size="xs" />
                              {isMe && (
                                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {tutor.branch} • {tutor.year}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                                🏛️ {tutor.collegeName || 'Verified University'}
                              </span>
                              {isCrossCollege && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                                  🌐 Cross-Campus
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-slate-900 text-base">
                            ${tutor.hourlyRate}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold">/ HOUR</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {tutor.bio}
                      </p>

                      {/* Subjects Offered */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Teaches
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {tutor.subjects.map((sub, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] bg-teal-50 text-teal-800 font-medium px-2 py-0.5 rounded border border-teal-100"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-semibold">RATING</span>
                          <button
                            type="button"
                            onClick={() => setViewingReviewsTutor(tutor)}
                            className="font-bold text-amber-600 flex items-center justify-center gap-1 hover:text-amber-700 hover:underline cursor-pointer mx-auto transition"
                            title="Click to view student reviews and testimonials"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{Number(tutor.rating).toFixed(1)}</span>
                            <span className="text-slate-500 text-[11px] font-normal">({tutor.reviewsCount})</span>
                          </button>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-semibold">COMPLETED</span>
                          <span className="font-bold text-slate-800">
                            {tutor.sessionsCompleted} sessions
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {isMe ? (
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                        >
                          Edit Tutor Profile
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setBookingTutor(tutor);
                            setBookSubject(tutor.subjects[0] || 'General');
                          }}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Book with Escrow Protection
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Booked Sessions View */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Your Tutoring Sessions</h2>
            <p className="text-xs text-slate-500">
              Join live video tutoring calls, leave star ratings and reviews, and approve escrow release once your session concludes.
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No tutoring sessions booked yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => {
                const isStudent = session.studentId === user?.id;

                return (
                  <div
                    key={session.id}
                    className="py-4 space-y-3 text-xs"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">{session.subject}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                              session.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : session.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {session.status.replace('_', ' ')}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                            {session.sessionType}
                          </span>
                        </div>

                        <div className="text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                          <span>
                            Tutor: <strong className="text-slate-800">{session.tutorName}</strong>
                            {session.tutorCollege && <span className="text-slate-500 text-[11px] ml-1">({session.tutorCollege})</span>}
                          </span>
                          <span>•</span>
                          <span>
                            Student: <strong className="text-slate-800">{session.studentName}</strong>
                            {session.studentCollege && <span className="text-slate-500 text-[11px] ml-1">({session.studentCollege})</span>}
                          </span>
                          {session.isCrossCollege && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                              🌐 Cross-College Session
                            </span>
                          )}
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            Amount: ${session.amount} (Escrow: {session.escrowStatus.toUpperCase()})
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-slate-500 mt-1.5 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {session.date} at {session.time}
                          </span>
                          <span>({session.durationHours} hr)</span>
                        </div>
                      </div>

                      {/* Actions: Join Video Room, Complete Escrow, or Rate Session */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onJoinVideoRoom(session)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Video className="w-4 h-4" />
                          Join Video Call
                        </button>

                        {isStudent && session.status !== 'completed' && (
                          <button
                            onClick={() => openCompletionModal(session)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition cursor-pointer shadow-xs"
                          >
                            Complete & Release Escrow
                          </button>
                        )}

                        {isStudent && session.status === 'completed' && (
                          <button
                            onClick={() => openRatingModal(session)}
                            className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold px-3.5 py-2 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{session.studentRating ? 'Edit Review' : 'Rate Session'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Star Rating & Student Feedback Display for Completed Sessions */}
                    {session.status === 'completed' && (
                      <div>
                        {session.studentRating ? (
                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-bold text-amber-900">
                                <div className="flex items-center text-amber-400">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3.5 h-3.5 ${
                                        star <= (session.studentRating || 0)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span>{session.studentRating} / 5 Stars</span>
                                <span className="text-[10px] text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded font-semibold">
                                  Your Student Feedback
                                </span>
                              </div>
                              {session.studentFeedback ? (
                                <p className="text-slate-700 text-xs italic">
                                  "{session.studentFeedback}"
                                </p>
                              ) : (
                                <p className="text-slate-400 text-[11px] italic">
                                  No written feedback provided.
                                </p>
                              )}
                            </div>
                            {isStudent && (
                              <button
                                type="button"
                                onClick={() => openRatingModal(session)}
                                className="text-[11px] text-teal-800 hover:text-teal-950 font-bold underline flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit Review
                              </button>
                            )}
                          </div>
                        ) : (
                          isStudent && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex text-amber-400">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                                <div>
                                  <span className="font-bold text-emerald-950">
                                    Tutoring session completed!
                                  </span>
                                  <span className="text-emerald-800 ml-1">
                                    How was your experience with <strong>{session.tutorName}</strong>? Leave a star rating and review.
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => openRatingModal(session)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                              >
                                <Star className="w-3.5 h-3.5 fill-slate-950" />
                                Rate Tutor & Leave Feedback
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Book Tutor Modal */}
      {bookingTutor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Book {bookingTutor.tutorName}</h3>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>🏛️ {bookingTutor.collegeName || 'Partner University'}</span>
                  {bookingTutor.collegeName && user?.collegeName && bookingTutor.collegeName !== user.collegeName && (
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded text-[10px] border border-indigo-200">
                      🌐 Cross-College Tutoring
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setBookingTutor(null)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={bookSubject}
                  onChange={(e) => setBookSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {bookingTutor.subjects.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session Date</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    required
                    value={bookDuration}
                    onChange={(e) => setBookDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={bookType}
                    onChange={(e) => setBookType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="1-on-1">1-on-1 Mentorship</option>
                    <option value="Group">Group Study Tutoring</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specific Topics / Problem Sets</label>
                <textarea
                  rows={2}
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="e.g. Help with Dijkstra algorithm proofs and homework set 3"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              {/* Escrow Lock Notice */}
              <div className="bg-teal-50 p-3.5 rounded-xl border border-teal-200 text-teal-900 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total Escrow Amount:</span>
                  <span className="text-base font-black">${bookDuration * bookingTutor.hourlyRate}</span>
                </div>
                <p className="text-[10px] text-teal-800 leading-tight">
                  🛡️ Escrow Guarantee: Payment is deducted from your wallet but safely locked. The tutor will only receive this money when you mark the session complete.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingTutor(null)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Lock Escrow & Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Become Tutor / Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Campus Tutor Profile</h3>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveTutorProfile} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hourly Rate (₹ / hr)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subjects Taught (Comma-separated)</label>
                <input
                  type="text"
                  required
                  value={subjectsStr}
                  onChange={(e) => setSubjectsStr(e.target.value)}
                  placeholder="e.g. Data Structures, Calculus II, Organic Chemistry"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tutor Bio & Achievements</label>
                <textarea
                  required
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. 4.0 GPA in CS core courses. Ex-TA for CS106B. I focus on intuitive problem solving."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Weekly Availability</label>
                <input
                  type="text"
                  value={availabilityStr}
                  onChange={(e) => setAvailabilityStr(e.target.value)}
                  placeholder="e.g. Mon-Wed 6-9 PM, Weekends"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Session & Release Escrow Modal */}
      {completingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Complete Session & Rate Tutor</h3>
                <p className="text-[11px] text-slate-500">
                  {completingSession.subject} with {completingSession.tutorName}
                </p>
              </div>
              <button
                onClick={() => setCompletingSession(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="mt-4 space-y-4 text-xs">
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  You are about to release <strong>${completingSession.amount}.00</strong> held in Escrow to tutor <strong>{completingSession.tutorName}</strong>. Please rate your learning experience below.
                </div>
              </div>

              {/* Interactive 5-Star Rating Component */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Star Rating <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-amber-600">
                    {(hoverRating || rating).toFixed(1)} / 5.0
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= (hoverRating || rating);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(starValue)}
                        className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-hidden"
                        aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-9 h-9 transition-colors duration-150 ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300 fill-slate-100 hover:text-slate-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-center pt-2 border-t border-slate-200/70">
                  <p className="text-xs font-bold text-slate-800">
                    {getRatingDescriptor(hoverRating || rating).title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {getRatingDescriptor(hoverRating || rating).desc}
                  </p>
                </div>
              </div>

              {/* Quick Feedback Tags */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 text-xs flex items-center justify-between">
                  <span>Session Highlights</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click to toggle tags</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleFeedbackTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Written Feedback */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 text-xs">
                  Written Feedback / Testimonial
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share details about their teaching style, homework help, patience, or clarity..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none leading-relaxed"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Helps other students choose trustworthy campus tutors.</span>
                  <span>{feedback.length} characters</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingSession(null)}
                  disabled={isSubmittingRating}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmittingRating ? 'Releasing Funds...' : 'Release Escrow & Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Rating & Feedback Modal (for Completed Sessions) */}
      {ratingModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {ratingModalSession.studentRating ? 'Edit Review & Rating' : 'Rate Tutoring Session'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {ratingModalSession.subject} with {ratingModalSession.tutorName} ({ratingModalSession.tutorCollege || 'Campus Tutor'})
                </p>
              </div>
              <button
                onClick={() => setRatingModalSession(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRateSession} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{ratingModalSession.subject} Session</span>
                  <span className="text-[11px] text-slate-500">
                    {ratingModalSession.date} at {ratingModalSession.time} • {ratingModalSession.durationHours} hr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">TUTOR</span>
                  <span className="font-bold text-slate-800">{ratingModalSession.tutorName}</span>
                </div>
              </div>

              {/* Interactive 5-Star Rating Component */}
              <div className="space-y-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Your Rating <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-amber-700">
                    {(hoverRating || rating).toFixed(1)} / 5.0 Stars
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= (hoverRating || rating);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(starValue)}
                        className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-hidden"
                        aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-9 h-9 transition-colors duration-150 ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300 fill-slate-100 hover:text-slate-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-center pt-2 border-t border-amber-200/70">
                  <p className="text-xs font-bold text-amber-950">
                    {getRatingDescriptor(hoverRating || rating).title}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {getRatingDescriptor(hoverRating || rating).desc}
                  </p>
                </div>
              </div>

              {/* Quick Feedback Tags */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 text-xs flex items-center justify-between">
                  <span>Session Highlights</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click to toggle tags</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleFeedbackTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Written Feedback */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 text-xs">
                  Written Feedback / Testimonial
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share details about their teaching style, homework help, patience, or clarity..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none leading-relaxed"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Your feedback will be visible on the tutor's campus profile.</span>
                  <span>{feedback.length} characters</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRatingModalSession(null)}
                  disabled={isSubmittingRating}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 fill-slate-950" />
                  {isSubmittingRating ? 'Saving Review...' : 'Submit Rating & Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutor Reviews & Feedback Testimonials Modal */}
      {viewingReviewsTutor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <img
                  src={viewingReviewsTutor.tutorAvatar}
                  alt={viewingReviewsTutor.tutorName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {viewingReviewsTutor.tutorName}
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span>{viewingReviewsTutor.collegeName || 'Verified University'}</span>
                    <span>•</span>
                    <span>{viewingReviewsTutor.branch}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingReviewsTutor(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Rating Banner */}
            <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-800 font-bold block uppercase tracking-wider">
                  Campus Peer Rating
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-amber-950">
                    {Number(viewingReviewsTutor.rating).toFixed(1)}
                  </span>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(viewingReviewsTutor.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 block">
                  {viewingReviewsTutor.reviewsCount} Student Reviews
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {viewingReviewsTutor.sessionsCompleted} Sessions Completed
                </span>
              </div>
            </div>

            {/* Reviews List */}
            <div className="mt-4 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Student Testimonials
              </h4>

              {(() => {
                const tutorReviews = sessions.filter(
                  (s) =>
                    (s.tutorId === viewingReviewsTutor.id || s.tutorId === viewingReviewsTutor.userId) &&
                    s.studentRating
                );

                if (tutorReviews.length === 0) {
                  return (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                      <Star className="w-6 h-6 text-amber-400 fill-amber-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Student Reviews Yet</p>
                      <p className="text-[11px] text-slate-400">
                        Be the first student to book a tutoring session and leave feedback!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {tutorReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {rev.studentAvatar ? (
                              <img
                                src={rev.studentAvatar}
                                alt={rev.studentName}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {rev.studentName[0]}
                              </div>
                            )}
                            <span className="font-bold text-slate-800">{rev.studentName}</span>
                            {rev.studentCollege && (
                              <span className="text-[10px] text-slate-400">({rev.studentCollege})</span>
                            )}
                          </div>

                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= (rev.studentRating || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Subject: <span className="font-semibold text-slate-700">{rev.subject}</span> • {rev.date}
                        </div>

                        {rev.studentFeedback && (
                          <p className="text-slate-700 text-xs italic bg-white p-2 rounded-lg border border-slate-100">
                            "{rev.studentFeedback}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingReviewsTutor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
