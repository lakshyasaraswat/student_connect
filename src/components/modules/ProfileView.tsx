import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { TutoringSession, Note } from '../../types.ts';
import { TabType } from '../NavigationTabs.tsx';
import {
  IconUser,
  IconShield,
  IconCheck,
  IconVerifiedBadge,
  IconClock,
  IconCalendar,
  IconBook,
  IconGraduation,
  IconVideo,
  IconDownload,
  IconWallet,
  IconEdit,
  IconUpload,
  IconFileText,
  IconCar,
  IconWrench,
  IconUsers,
  IconAlert,
  IconArrowRight,
  IconEye
} from '../icons.tsx';
import { VerifiedBadge } from '../common/VerifiedBadge.tsx';

interface ProfileViewProps {
  onJoinVideoRoom: (session: TutoringSession) => void;
  onNavigateTab: (tab: TabType) => void;
  onOpenWallet: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onJoinVideoRoom,
  onNavigateTab,
  onOpenWallet
}) => {
  const { user, refreshUser, showAlert } = useAuth();

  // Activity & stats state
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);

  // Active section tabs
  const [activeTab, setActiveTab] = useState<'tutoring' | 'notes' | 'verification' | 'activity' | 'edit'>('tutoring');
  const [tutoringSubTab, setTutoringSubTab] = useState<'student' | 'tutor'>('student');
  const [notesSubTab, setNotesSubTab] = useState<'purchased' | 'uploaded'>('purchased');

  // ID Verification Form state
  const [idCardUrl, setIdCardUrl] = useState(user?.collegeIdCardUrl || '');
  const [admissionNo, setAdmissionNo] = useState(user?.admissionNumber || '');
  const [collegeName, setCollegeName] = useState(user?.collegeName || '');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [previewCardModal, setPreviewCardModal] = useState(false);

  // Edit Profile Form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCourse, setEditCourse] = useState(user?.course || '');
  const [editYear, setEditYear] = useState(user?.year || '');
  const [editBranch, setEditBranch] = useState(user?.branch || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editHostelStatus, setEditHostelStatus] = useState<'Hostelite' | 'Day Scholar'>(user?.hostelStatus || 'Hostelite');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Avatar presets
  const AVATAR_PRESETS = [
    { label: 'Alex', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { label: 'Jordan', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
    { label: 'Maya', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya' },
    { label: 'Sam', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
    { label: 'Rohan', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
    { label: 'Priya', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
    { label: 'Aarav', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav' },
    { label: 'Ananya', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya' }
  ];

  // Sample ID Card images for quick testing
  const sampleIdCards = [
    { label: 'Official Student ID Card', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80' },
    { label: 'Campus Smart Badge (Chip & Barcode)', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80' },
    { label: 'University Library & Hall Pass', url: 'https://images.unsplash.com/photo-1584697964190-71c1b12b5962?auto=format&fit=crop&w=600&q=80' }
  ];

  const fetchActivity = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getUserActivity();
      if (res.success) {
        setActivity(res.activity);
      }
    } catch (err: any) {
      console.warn('User activity fetch notice:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActivity();
      setIdCardUrl(user.collegeIdCardUrl || '');
      setAdmissionNo(user.admissionNumber || '');
      setCollegeName(user.collegeName || '');
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditCourse(user.course || '');
      setEditYear(user.year || '');
      setEditBranch(user.branch || '');
      setEditBio(user.bio || '');
      setEditHostelStatus(user.hostelStatus || 'Hostelite');
      setEditAvatar(user.avatar || '');
    } else {
      setLoading(false);
    }
  }, [user]);

  // Handle avatar file upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Avatar image file size must be less than 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
        showAlert('Avatar loaded! Click "Save Changes" to apply.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  // ID Verification Update Handler - strictly submitted to administrator portal
  const handleUpdateIdVerification = async () => {
    if (!admissionNo.trim()) {
      showAlert('Please provide your official student admission number.', 'error');
      return;
    }
    if (!idCardUrl.trim()) {
      showAlert('Please attach or select a college ID card document.', 'error');
      return;
    }

    try {
      setVerificationLoading(true);
      const res = await api.updateIdVerification({
        collegeIdCardUrl: idCardUrl.trim(),
        admissionNumber: admissionNo.trim(),
        collegeName: collegeName.trim()
      });

      if (res.success) {
        showAlert('College ID submitted for institutional review. Verification will be processed against university records.', 'success');
        await refreshUser();
        await fetchActivity();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to submit ID verification.', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const res = await api.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        course: editCourse.trim(),
        year: editYear.trim(),
        branch: editBranch.trim(),
        bio: editBio.trim(),
        hostelStatus: editHostelStatus,
        avatar: editAvatar.trim() || undefined
      });

      if (res.success) {
        showAlert('Profile & Avatar updated successfully.', 'success');
        await refreshUser();
        setActiveTab('activity');
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Complete session handler
  const handleCompleteSession = async (sessionId: string) => {
    try {
      const res = await api.completeSession(sessionId, 5, 'Great session! Concepts thoroughly understood.');
      if (res.success) {
        showAlert('Session completed. Escrow disbursed to tutor.', 'success');
        await refreshUser();
        await fetchActivity();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to complete session.', 'error');
    }
  };

  // Cancel session handler
  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Escrow funds will be refunded to your wallet.')) return;
    try {
      const res = await api.cancelSession(sessionId);
      if (res.success) {
        showAlert('Booking cancelled. Escrow refunded.', 'info');
        await refreshUser();
        await fetchActivity();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to cancel session.', 'error');
    }
  };

  // Note download simulated handler
  const handleDownloadNote = (note: Note) => {
    showAlert(`Starting PDF download for "${note.title}"...`, 'info');
    setTimeout(() => {
      showAlert(`Verified watermarked notes for ${note.subject} saved to downloads.`, 'success');
    }, 1000);
  };

  const studentSessions: TutoringSession[] = activity?.tutoring?.asStudent || [];
  const tutorSessions: TutoringSession[] = activity?.tutoring?.asTutor || [];
  const purchasedNotes: Note[] = activity?.notes?.purchased || [];
  const uploadedNotes: Note[] = activity?.notes?.uploaded || [];

  if (!user) {
    return (
      <div className="bg-white border border-[#e5e5ea] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-4 my-8">
        <div className="w-16 h-16 bg-[#0071e3]/10 text-[#0071e3] rounded-2xl flex items-center justify-center mx-auto">
          <IconUser className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1d1d1f]">Institutional Sign-In Required</h2>
          <p className="text-xs text-[#515154] mt-1.5 leading-relaxed">
            StudentConnect operates as a closed intranet accessible only by validated campus students and administrators.
            Please sign in with your official university credentials to access your verified profile, wallet, and ID records.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
          <button
            onClick={() => onNavigateTab('tutoring')}
            className="px-5 py-2.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold shadow-xs transition cursor-pointer"
          >
            Explore Peer Academic Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Banner */}
      <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={user?.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#e5e5ea] shadow-xs"
              />
              <span className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-white shadow-xs ${
                user?.isVerified ? 'bg-[#137333] text-white' : 'bg-[#e37400] text-white'
              }`} title={user?.isVerified ? 'College ID Verified by Administrator' : 'ID Verification Pending Review'}>
                {user?.isVerified ? <IconVerifiedBadge className="w-3.5 h-3.5" /> : <IconClock className="w-3.5 h-3.5" />}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="absolute inset-0 bg-black/45 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium cursor-pointer"
                title="Change Avatar"
              >
                <IconUpload className="w-4 h-4 mb-0.5" />
                Avatar
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] flex items-center gap-2">
                  <span>{user?.name}</span>
                  <VerifiedBadge isVerified={user?.isVerified} role={user?.role} showLabel={false} size="md" />
                </h1>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  user?.role === 'admin'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#e8f0fe] text-[#1967d2]'
                }`}>
                  {user?.role === 'admin' ? 'Administrator' : 'Student Account'}
                </span>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  user?.isVerified
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}>
                  {user?.isVerified ? (
                    <IconVerifiedBadge className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <IconClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span>{user?.isVerified ? 'Verified by Administrator' : 'Administrator Review Pending'}</span>
                </span>
              </div>

              <div className="text-xs text-[#515154] flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                <span>@{user?.username || 'username'}</span>
                <span>•</span>
                <span>Adm No: <strong className="text-[#1d1d1f]">{user?.admissionNumber || 'N/A'}</strong></span>
                <span>•</span>
                <span>{user?.email}</span>
                {user?.phone && (
                  <>
                    <span>•</span>
                    <span>{user?.phone}</span>
                  </>
                )}
              </div>

              <div className="text-xs text-[#515154] flex flex-wrap items-center gap-2 pt-0.5">
                <span className="font-medium text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded border border-[#e5e5ea]">
                  🏫 {user?.collegeName}
                </span>
                {user?.course && (
                  <span className="bg-[#f5f5f7] px-2 py-0.5 rounded border border-[#e5e5ea]">
                    📚 {user?.course} {user?.year && `• ${user?.year}`}
                  </span>
                )}
                {user?.hostelStatus && (
                  <span className="bg-[#f5f5f7] px-2 py-0.5 rounded border border-[#e5e5ea]">
                    🏠 {user?.hostelStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Balance & Action Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-lg p-3 text-left min-w-[170px]">
              <div className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                <IconWallet className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Student Balance</span>
              </div>
              <div className="text-lg font-bold text-[#1d1d1f] mt-0.5">
                ₹{user?.walletBalance ?? 0}
              </div>
              <div className="text-[10px] text-[#515154] flex items-center justify-between mt-1">
                <span>In Escrow:</span>
                <span className="font-semibold text-[#0071e3]">₹{user?.escrowBalance ?? 0}</span>
              </div>
              <button
                onClick={onOpenWallet}
                className="w-full mt-2 py-1 bg-[#ffffff] hover:bg-[#eaeaea] text-[#0071e3] border border-[#d2d2d7] rounded text-[11px] font-medium transition cursor-pointer text-center"
              >
                Top up Escrow
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab(activeTab === 'edit' ? 'activity' : 'edit')}
                className="px-3.5 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <IconEdit className="w-3.5 h-3.5" />
                <span>{activeTab === 'edit' ? 'View Profile' : 'Edit Profile'}</span>
              </button>

              <button
                onClick={() => setActiveTab('verification')}
                className="px-3.5 py-2 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <IconShield className="w-3.5 h-3.5" />
                <span>Manage ID Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bio preview if available */}
        {user?.bio && (
          <p className="mt-4 pt-4 border-t border-[#e5e5ea] text-xs text-[#515154] leading-relaxed">
            <strong className="text-[#1d1d1f]">About:</strong> {user.bio}
          </p>
        )}
      </div>

      {/* 2. Top Navigation Tabs for Profile Details */}
      <div className="border-b border-[#e5e5ea] flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none bg-[#ffffff] px-2 py-1 rounded-lg">
        <button
          onClick={() => setActiveTab('tutoring')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'tutoring'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-[#515154] hover:bg-[#f5f5f7]'
          }`}
        >
          <IconGraduation className="w-4 h-4" />
          <span>Tutoring Bookings</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {studentSessions.length + tutorSessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-[#515154] hover:bg-[#f5f5f7]'
          }`}
        >
          <IconBook className="w-4 h-4" />
          <span>Owned Notes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {purchasedNotes.length + uploadedNotes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'verification'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-[#515154] hover:bg-[#f5f5f7]'
          }`}
        >
          <IconShield className="w-4 h-4" />
          <span>College ID Verification</span>
          {user?.isVerified ? (
            <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#e37400]"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-[#515154] hover:bg-[#f5f5f7]'
          }`}
        >
          <IconCalendar className="w-4 h-4" />
          <span>Personal Activity</span>
        </button>

        <button
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'edit'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-[#515154] hover:bg-[#f5f5f7]'
          }`}
        >
          <IconEdit className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: TUTORING BOOKINGS */}
      {activeTab === 'tutoring' && (
        <div className="space-y-5">
          {/* Sub-toggle: As Student vs As Peer Tutor */}
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] text-xs font-medium">
              <button
                onClick={() => setTutoringSubTab('student')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  tutoringSubTab === 'student'
                    ? 'bg-[#ffffff] text-[#1d1d1f] shadow-2xs font-semibold'
                    : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                Bookings as Student ({studentSessions.length})
              </button>
              <button
                onClick={() => setTutoringSubTab('tutor')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  tutoringSubTab === 'tutor'
                    ? 'bg-[#ffffff] text-[#1d1d1f] shadow-2xs font-semibold'
                    : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                Sessions as Tutor ({tutorSessions.length})
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('tutoring')}
              className="text-xs text-[#0071e3] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Explore More Peer Tutors</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Escrow assurance callout */}
          <div className="bg-[#f0f7ff] border border-[#d0e5ff] rounded-xl p-3.5 text-xs text-[#0051a8] flex items-start gap-2.5">
            <IconShield className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Institutional Escrow Protection:</strong> When you book a tutoring session, your fee is held safely in campus escrow. The tutor only receives the funds after you verify and complete the video lesson, eliminating financial fraud on campus.
            </div>
          </div>

          {tutoringSubTab === 'student' ? (
            studentSessions.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-10 text-center space-y-3">
                <IconGraduation className="w-10 h-10 text-[#86868b] mx-auto" />
                <h3 className="text-base font-semibold text-[#1d1d1f]">No Current Tutoring Bookings</h3>
                <p className="text-xs text-[#515154] max-w-md mx-auto">
                  You have not scheduled any tutoring sessions yet. Browse verified seniors in your subjects to get 1-on-1 exam prep and algorithmic review.
                </p>
                <button
                  onClick={() => onNavigateTab('tutoring')}
                  className="px-4 py-2 rounded-lg bg-[#0071e3] text-white text-xs font-medium hover:bg-[#0077ed] transition cursor-pointer"
                >
                  Browse Tutors
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4.5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#f0f0f2] flex items-center justify-center font-bold text-sm text-[#1d1d1f]">
                          {session.tutorName?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#1d1d1f]">
                            Tutor: {session.tutorName}
                          </div>
                          <div className="text-[11px] text-[#515154]">
                            {session.subject}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        session.status === 'completed'
                          ? 'bg-[#e6f4ea] text-[#137333]'
                          : session.status === 'cancelled'
                          ? 'bg-[#fce8e6] text-[#c62828]'
                          : 'bg-[#e8f0fe] text-[#1967d2]'
                      }`}>
                        {session.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-[#f5f5f7] rounded-lg p-2.5 text-xs text-[#515154] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <IconCalendar className="w-3.5 h-3.5 text-[#86868b]" />
                          {session.date} • {session.time}
                        </span>
                        <span className="font-semibold text-[#1d1d1f]">
                          {session.durationHours || 1} hr session
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#e5e5ea]/60">
                        <span className="flex items-center gap-1 text-[11px]">
                          <IconShield className="w-3 h-3 text-[#0071e3]" />
                          Escrow: ₹{session.amount} ({session.escrowStatus || 'held'})
                        </span>
                        <span className="text-[11px] font-medium text-[#137333]">
                          Funds Secured
                        </span>
                      </div>
                    </div>

                    {session.notes && (
                      <p className="text-[11px] text-[#515154] italic">
                        "{session.notes}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {session.status === 'booked' && (
                        <>
                          <button
                            onClick={() => onJoinVideoRoom(session)}
                            className="flex-1 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <IconVideo className="w-3.5 h-3.5" />
                            <span>Join Video Call</span>
                          </button>
                          <button
                            onClick={() => handleCompleteSession(session.id)}
                            className="py-1.5 px-3 rounded-lg border border-[#34a853] text-[#137333] hover:bg-[#e6f4ea] text-xs font-medium transition cursor-pointer"
                            title="Confirm session finished and release funds to tutor"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            className="py-1.5 px-2.5 rounded-lg border border-[#e5e5ea] text-[#c62828] hover:bg-[#fce8e6] text-xs font-medium transition cursor-pointer"
                            title="Cancel booking"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {session.status === 'completed' && (
                        <div className="w-full text-center text-xs text-[#137333] font-medium py-1 bg-[#e6f4ea] rounded-md">
                          ✓ Session Completed • Escrow Disbursed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            tutorSessions.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-10 text-center space-y-3">
                <IconGraduation className="w-10 h-10 text-[#86868b] mx-auto" />
                <h3 className="text-base font-semibold text-[#1d1d1f]">No Tutoring Sessions Conducted Yet</h3>
                <p className="text-xs text-[#515154] max-w-md mx-auto">
                  Any student can tutor! Publish your academic courses and hourly rate on the Peer Tutoring tab to help peers and earn escrow payments.
                </p>
                <button
                  onClick={() => onNavigateTab('tutoring')}
                  className="px-4 py-2 rounded-lg bg-[#1d1d1f] text-white text-xs font-medium hover:bg-black transition cursor-pointer"
                >
                  Create Tutor Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#1d1d1f]">
                        Student: {session.studentName}
                      </div>
                      <span className="text-xs font-bold text-[#137333]">
                        +₹{session.amount}
                      </span>
                    </div>
                    <div className="text-xs text-[#515154]">
                      Subject: {session.subject}
                    </div>
                    <div className="text-[11px] text-[#86868b]">
                      Scheduled: {session.date} • {session.time}
                    </div>
                    <button
                      onClick={() => onJoinVideoRoom(session)}
                      className="w-full py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <IconVideo className="w-3.5 h-3.5" />
                      <span>Start Tutoring Call</span>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 2: OWNED NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] text-xs font-medium">
              <button
                onClick={() => setNotesSubTab('purchased')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  notesSubTab === 'purchased'
                    ? 'bg-[#ffffff] text-[#1d1d1f] shadow-2xs font-semibold'
                    : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                Purchased & Free Library ({purchasedNotes.length})
              </button>
              <button
                onClick={() => setNotesSubTab('uploaded')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  notesSubTab === 'uploaded'
                    ? 'bg-[#ffffff] text-[#1d1d1f] shadow-2xs font-semibold'
                    : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                My Uploaded Notes ({uploadedNotes.length})
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('notes')}
              className="text-xs text-[#0071e3] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Course Repository</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {notesSubTab === 'purchased' ? (
            purchasedNotes.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-10 text-center space-y-3">
                <IconBook className="w-10 h-10 text-[#86868b] mx-auto" />
                <h3 className="text-base font-semibold text-[#1d1d1f]">No Notes in Your Library Yet</h3>
                <p className="text-xs text-[#515154] max-w-md mx-auto">
                  Browse lecture notes, exam formula sheets, and past problem sets curated by high-scoring seniors.
                </p>
                <button
                  onClick={() => onNavigateTab('notes')}
                  className="px-4 py-2 rounded-lg bg-[#0071e3] text-white text-xs font-medium hover:bg-[#0077ed] transition cursor-pointer"
                >
                  Browse Course Notes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchasedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4.5 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-[#f0f0f2] text-[#1d1d1f] rounded">
                          {note.subject}
                        </span>
                        <span className="text-[11px] font-semibold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded">
                          {note.isFree ? 'Free Access' : `Owned (₹${note.price})`}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#1d1d1f] mt-2 line-clamp-2">
                        {note.title}
                      </h4>

                      <div className="text-xs text-[#515154] mt-1 space-y-0.5">
                        <div>Author: <strong className="text-[#1d1d1f]">{note.sellerName}</strong></div>
                        {note.professor && <div>Professor: {note.professor}</div>}
                        {note.semester && <div>Semester: {note.semester}</div>}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#e5e5ea] flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadNote(note)}
                        className="flex-1 py-1.5 rounded-lg bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <IconDownload className="w-3.5 h-3.5" />
                        <span>Download Full PDF</span>
                      </button>

                      <button
                        onClick={() => onNavigateTab('notes')}
                        className="py-1.5 px-3 rounded-lg border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs font-medium transition cursor-pointer"
                        title="View details & write a review"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            uploadedNotes.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-10 text-center space-y-3">
                <IconFileText className="w-10 h-10 text-[#86868b] mx-auto" />
                <h3 className="text-base font-semibold text-[#1d1d1f]">No Uploaded Notes Yet</h3>
                <p className="text-xs text-[#515154] max-w-md mx-auto">
                  Earn extra campus income or share notes freely with peers. Upload your handwritten summaries, solved problem sheets, or formula guides.
                </p>
                <button
                  onClick={() => onNavigateTab('notes')}
                  className="px-4 py-2 rounded-lg bg-[#0071e3] text-white text-xs font-medium hover:bg-[#0077ed] transition cursor-pointer"
                >
                  Upload New Notes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4.5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-[#f0f0f2] text-[#1d1d1f] rounded">
                        {note.subject}
                      </span>
                      <span className="text-xs font-bold text-[#1d1d1f]">
                        {note.isFree ? 'Free' : `₹${note.price}`}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#1d1d1f] line-clamp-2">
                      {note.title}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#f5f5f7] p-2 rounded-lg">
                      <div>
                        <div className="text-[#86868b] text-[10px]">Total Downloads</div>
                        <div className="font-semibold text-[#1d1d1f]">{note.downloadsCount || 0} students</div>
                      </div>
                      <div>
                        <div className="text-[#86868b] text-[10px]">Estimated Earnings</div>
                        <div className="font-semibold text-[#137333]">
                          ₹{(note.downloadsCount || 0) * (note.price || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 3: COLLEGE ID VERIFICATION MANAGEMENT */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* Main Status Hero Card */}
          <div className={`border rounded-xl p-5 sm:p-6 ${
            user?.isVerified
              ? 'bg-[#f6fbf7] border-[#ceead6]'
              : 'bg-[#fffcf0] border-[#feefc3]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  user?.isVerified ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fef7e0] text-[#b06000]'
                }`}>
                  <IconShield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#1d1d1f]">
                      College ID Verification Status
                    </h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                      user?.isVerified
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      <IconVerifiedBadge className="w-3.5 h-3.5" />
                      <span>{user?.isVerified ? 'VERIFIED BY ADMINISTRATOR' : 'PENDING ADMINISTRATOR REVIEW'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#515154] mt-1 leading-relaxed">
                    {user?.isVerified
                      ? 'Your institutional identity and college ID card have been verified. You enjoy unrestricted access to peer tutoring escrow, ride pooling, notes monetization, and equipment borrowing.'
                      : 'Your ID card is currently awaiting institutional check. Complete or refresh your credentials below to enjoy verified campus status.'}
                  </p>
                </div>
              </div>

              {user?.collegeIdCardUrl && (
                <button
                  onClick={() => setPreviewCardModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                >
                  <IconEye className="w-3.5 h-3.5" />
                  <span>Inspect ID Card</span>
                </button>
              )}
            </div>

            {/* Checklist of validation vectors */}
            <div className="mt-5 pt-4 border-t border-[#e5e5ea] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/80 border border-[#e5e5ea] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#86868b] uppercase font-semibold">1. Domain Lock</div>
                <div className="font-medium text-[#1d1d1f] flex items-center gap-1 mt-0.5">
                  <IconCheck className="w-3.5 h-3.5 text-[#137333]" />
                  <span>@{user?.domain || 'campus.edu'} Validated</span>
                </div>
              </div>

              <div className="bg-white/80 border border-[#e5e5ea] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#86868b] uppercase font-semibold">2. Admission Number</div>
                <div className="font-medium text-[#1d1d1f] flex items-center gap-1 mt-0.5">
                  <IconCheck className="w-3.5 h-3.5 text-[#137333]" />
                  <span>{user?.admissionNumber || 'Not recorded'}</span>
                </div>
              </div>

              <div className="bg-white/80 border border-[#e5e5ea] p-2.5 rounded-lg">
                <div className="text-[10px] text-[#86868b] uppercase font-semibold">3. Document Status</div>
                <div className="font-medium text-[#1d1d1f] flex items-center gap-1 mt-0.5">
                  {user?.collegeIdCardUrl ? (
                    <>
                      <IconCheck className="w-3.5 h-3.5 text-[#137333]" />
                      <span>Photo ID on File</span>
                    </>
                  ) : (
                    <>
                      <IconAlert className="w-3.5 h-3.5 text-[#c62828]" />
                      <span>ID Card Missing</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Form Card */}
          <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1f]">
                Update College ID Card Document
              </h3>
              <p className="text-xs text-[#515154] mt-0.5">
                Students can update their physical student card photo, rectify admission roll numbers, or request immediate institutional verification.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    Student Admission / Roll Number *
                  </label>
                  <input
                    type="text"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
                    placeholder="e.g. ST-2023-0104 or 2023CSB108"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] font-mono"
                  />
                  <p className="text-[10px] text-[#86868b] mt-1">
                    Must match your official university registrar records.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    College / University Name *
                  </label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Your College / University Name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  College ID Card Image URL or File *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={idCardUrl}
                    onChange={(e) => setIdCardUrl(e.target.value)}
                    placeholder="https://example.com/my-student-id-card.jpg"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  />
                  {idCardUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewCardModal(true)}
                      className="px-3 py-2 border border-[#d2d2d7] hover:bg-[#f5f5f7] rounded-lg text-xs font-medium text-[#1d1d1f] cursor-pointer"
                    >
                      Preview
                    </button>
                  )}
                </div>

                {/* Quick Presets for Demo / Instant Attachment */}
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-[#86868b] mb-1.5">
                    Or select a verified sample ID template:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sampleIdCards.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setIdCardUrl(sample.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border text-left transition cursor-pointer ${
                          idCardUrl === sample.url
                            ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
                            : 'bg-[#f5f5f7] text-[#515154] border-[#e5e5ea] hover:bg-[#eaeaea]'
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ID Card Image Preview Box */}
              {idCardUrl && (
                <div className="border border-[#e5e5ea] rounded-xl p-3 bg-[#fbfbfa]">
                  <div className="text-[11px] font-semibold text-[#1d1d1f] mb-2 flex items-center justify-between">
                    <span>Attached College ID Preview:</span>
                    <span className="text-[10px] text-[#137333] font-medium">✓ Ready for Verification</span>
                  </div>
                  <div className="relative max-h-48 overflow-hidden rounded-lg border border-[#e5e5ea]">
                    <img
                      src={idCardUrl}
                      alt="Student ID Card Preview"
                      className="w-full h-44 object-cover"
                      onError={() => showAlert('Image URL could not be loaded. Please ensure it is a valid public image URL.', 'error')}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      {admissionNo || 'ADMISSION NO'}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit for Official Verification */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  disabled={verificationLoading}
                  onClick={() => handleUpdateIdVerification()}
                  className="px-5 py-2.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <IconShield className="w-4 h-4" />
                  <span>{verificationLoading ? 'Submitting verification...' : 'Submit ID for Institutional Verification'}</span>
                </button>

                <p className="text-[11px] text-[#86868b] leading-tight">
                  Verification is processed securely to validate official college enrolment roster records.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERSONAL CAMPUS ACTIVITY STATS */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4 shadow-2xs">
              <div className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                <IconGraduation className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Tutoring Sessions</span>
              </div>
              <div className="text-xl font-bold text-[#1d1d1f] mt-1">
                {studentSessions.length + tutorSessions.length}
              </div>
              <div className="text-[10px] text-[#515154] mt-0.5">
                {studentSessions.filter(s => s.status === 'completed').length} completed
              </div>
            </div>

            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4 shadow-2xs">
              <div className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                <IconBook className="w-3.5 h-3.5 text-[#34a853]" />
                <span>Notes in Library</span>
              </div>
              <div className="text-xl font-bold text-[#1d1d1f] mt-1">
                {purchasedNotes.length}
              </div>
              <div className="text-[10px] text-[#515154] mt-0.5">
                {uploadedNotes.length} authored notes
              </div>
            </div>

            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4 shadow-2xs">
              <div className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                <IconCar className="w-3.5 h-3.5 text-[#f2994a]" />
                <span>Rides & Commutes</span>
              </div>
              <div className="text-xl font-bold text-[#1d1d1f] mt-1">
                {(activity?.carpooling?.offered?.length || 0) + (activity?.carpooling?.joined?.length || 0)}
              </div>
              <div className="text-[10px] text-[#515154] mt-0.5">
                {activity?.carpooling?.offered?.length || 0} offered • {activity?.carpooling?.joined?.length || 0} joined
              </div>
            </div>

            <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-4 shadow-2xs">
              <div className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                <IconUsers className="w-3.5 h-3.5 text-[#9b51e0]" />
                <span>Study Squads</span>
              </div>
              <div className="text-xl font-bold text-[#1d1d1f] mt-1">
                {activity?.studyGroups?.joined?.length || 0}
              </div>
              <div className="text-[10px] text-[#515154] mt-0.5">
                Exam revision squads
              </div>
            </div>
          </div>

          {/* Activity Breakdown List */}
          <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              Campus Engagement Timeline
            </h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#f5f5f7]">
                <div className="p-2 rounded-md bg-[#ffffff] border border-[#e5e5ea] text-[#0071e3]">
                  <IconShield className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-[#1d1d1f]">Campus Domain Verification</div>
                  <div className="text-[#515154]">
                    Authenticated under @{user?.domain || 'campus.edu'} institutional directory with Admission ID {user?.admissionNumber || 'N/A'}.
                  </div>
                  <div className="text-[10px] text-[#86868b] mt-1">Active status • Zero restrictions</div>
                </div>
              </div>

              {studentSessions.length > 0 && (
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#f5f5f7]">
                  <div className="p-2 rounded-md bg-[#ffffff] border border-[#e5e5ea] text-[#137333]">
                    <IconGraduation className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-semibold text-[#1d1d1f]">Peer Mentorship Bookings</div>
                    <div className="text-[#515154]">
                      {studentSessions.length} active or scheduled peer tutoring sessions with escrow holding.
                    </div>
                  </div>
                </div>
              )}

              {purchasedNotes.length > 0 && (
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#f5f5f7]">
                  <div className="p-2 rounded-md bg-[#ffffff] border border-[#e5e5ea] text-[#34a853]">
                    <IconBook className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-semibold text-[#1d1d1f]">Course Notes Exchange</div>
                    <div className="text-[#515154]">
                      {purchasedNotes.length} lecture guide(s) currently saved in your digital campus binder.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EDIT PROFILE */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile} className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#1d1d1f]">Edit Student Profile & Avatar</h3>
            <p className="text-xs text-[#515154] mt-0.5">
              Keep your campus directory information and profile picture up to date so peers and faculty can recognize you.
            </p>
          </div>

          {/* Profile Avatar Selection & Upload Section */}
          <div className="bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative shrink-0 mx-auto sm:mx-0">
                <img
                  src={editAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt="Profile Avatar Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-xs"
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="text-xs font-bold text-[#1d1d1f]">Profile Picture / Avatar</div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg bg-white border border-[#d2d2d7] hover:bg-[#eaeaea] text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 cursor-pointer shadow-2xs transition">
                    <IconUpload className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-[#86868b]">PNG, JPG, WebP up to 2MB</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="Or paste avatar image URL (e.g. https://...)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#d2d2d7] bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div className="pt-2 border-t border-[#e5e5ea]">
              <div className="text-[11px] font-semibold text-[#515154] mb-2">
                Or select an instant student avatar preset:
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEditAvatar(preset.url)}
                    className={`relative p-1 rounded-full border-2 transition cursor-pointer hover:scale-105 ${
                      editAvatar === preset.url ? 'border-[#0071e3] ring-2 ring-[#0071e3]/30' : 'border-transparent hover:border-[#d2d2d7]'
                    }`}
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-10 h-10 rounded-full object-cover bg-white"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1d1d1f] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1d1d1f] mb-1">Phone Number</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+1 (650) 555-0100"
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1d1d1f] mb-1">Degree / Course</label>
              <input
                type="text"
                value={editCourse}
                onChange={(e) => setEditCourse(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1d1d1f] mb-1">Year of Study</label>
              <select
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] bg-white"
              >
                <option value="1st Year">1st Year (Freshman)</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
                <option value="Graduate / Masters">Graduate / Masters</option>
                <option value="PhD Candidate">PhD Candidate</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1d1d1f] mb-1">Department / Branch</label>
              <input
                type="text"
                value={editBranch}
                onChange={(e) => setEditBranch(e.target.value)}
                placeholder="e.g. Systems & Artificial Intelligence"
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1d1d1f] mb-1">Residence Status</label>
              <select
                value={editHostelStatus}
                onChange={(e) => setEditHostelStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3] bg-white"
              >
                <option value="Hostelite">Campus Resident (Hostelite / Dorm)</option>
                <option value="Day Scholar">Off-Campus / Day Scholar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">Short Bio</label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Share your academic interests, study group focus, or tutoring areas..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#d2d2d7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('tutoring')}
              className="px-4 py-2 text-xs font-medium text-[#515154] hover:text-[#1d1d1f] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ID Card Full Inspect Modal */}
      {previewCardModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#e5e5ea] animate-in zoom-in-95">
            <div className="p-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IconShield className="w-4 h-4 text-[#0071e3]" />
                <span className="font-semibold text-sm text-[#1d1d1f]">Institutional ID Card</span>
              </div>
              <button
                onClick={() => setPreviewCardModal(false)}
                className="text-[#86868b] hover:text-[#1d1d1f] text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <img
                src={idCardUrl || user?.collegeIdCardUrl || sampleIdCards[0].url}
                alt="College Student ID Card"
                className="w-full rounded-xl border border-[#e5e5ea] shadow-xs object-cover"
              />

              <div className="bg-[#f5f5f7] p-3 rounded-lg text-xs space-y-1 text-[#515154]">
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Student Name:</span>
                  <span className="font-semibold text-[#1d1d1f]">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Admission Number:</span>
                  <span className="font-mono font-semibold text-[#1d1d1f]">{user?.admissionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">College:</span>
                  <span className="font-medium text-[#1d1d1f]">{user?.collegeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Institutional Domain:</span>
                  <span className="font-mono text-[#0071e3]">@{user?.domain}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#fbfbfa] border-t border-[#e5e5ea] flex justify-end">
              <button
                onClick={() => setPreviewCardModal(false)}
                className="px-4 py-2 bg-[#1d1d1f] hover:bg-black text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
