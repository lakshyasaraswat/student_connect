import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Assignment, AssignmentProposal } from '../../types.ts';
import {
  IconSearch,
  IconCheck,
  IconAlert,
  IconClock,
  IconStar,
  IconShield,
  IconUser,
  IconClose,
  IconDownload,
  IconFileText,
  IconCreditCard,
  IconEye
} from '../icons.tsx';
import {
  Upload,
  Sparkles,
  Paperclip,
  CheckCircle,
  MessageSquare,
  Flame,
  Send,
  Calendar,
  DollarSign,
  Briefcase,
  FileCheck,
  AlertCircle,
  Clock,
  Trash2,
  ChevronRight,
  ExternalLink,
  Award,
  Phone,
  Mail,
  MapPin,
  User,
  Copy,
  Tag,
  Handshake,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge.tsx';

const SUBJECT_OPTIONS = [
  'All Subjects',
  'Computer Science',
  'Mathematics & Statistics',
  'Mechanical Engineering',
  'Electrical & Electronics',
  'Economics & Finance',
  'Physics & Chemistry',
  'Civil Engineering',
  'Humanities & Law'
];

export const AssignmentHelpView: React.FC = () => {
  const { user, showAlert, openChat } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'my_posted' | 'my_accepted'>('browse');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedAssignmentForApply, setSelectedAssignmentForApply] = useState<Assignment | null>(null);

  const [isProposalsModalOpen, setIsProposalsModalOpen] = useState(false);
  const [selectedAssignmentForProposals, setSelectedAssignmentForProposals] = useState<Assignment | null>(null);

  // Counter Offer Modal state
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [selectedAssignmentForCounter, setSelectedAssignmentForCounter] = useState<Assignment | null>(null);
  const [selectedProposalForCounter, setSelectedProposalForCounter] = useState<AssignmentProposal | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterPreviousPrice, setCounterPreviousPrice] = useState(0);
  const [counterNote, setCounterNote] = useState('');
  const [counterProposedTime, setCounterProposedTime] = useState('Within 24 hours');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  // Accept Offer & Work Modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedAssignmentForClaim, setSelectedAssignmentForClaim] = useState<Assignment | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [submittingClaimId, setSubmittingClaimId] = useState<string | null>(null);

  const [isSubmitSolutionModalOpen, setIsSubmitSolutionModalOpen] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState<Assignment | null>(null);

  const [isAttachmentPreviewOpen, setIsAttachmentPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type?: string } | null>(null);

  // Form states: Post Assignment
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Computer Science');
  const [formCourseCode, setFormCourseCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formBounty, setFormBounty] = useState('500');
  const [formDeadline, setFormDeadline] = useState('');
  const [formUrgency, setFormUrgency] = useState<'Normal' | 'High' | 'Urgent (Within 24h)'>('Normal');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('+1 (650) 498-2041');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactLocation, setFormContactLocation] = useState('Campus Quad / Student Hall');
  const [formPreferredContact, setFormPreferredContact] = useState<'chat' | 'phone' | 'email' | 'whatsapp'>('chat');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Form states: Apply / Proposal
  const [applyPitch, setApplyPitch] = useState('');
  const [applyProposedTime, setApplyProposedTime] = useState('Within 24 hours');
  const [applyOfferedPrice, setApplyOfferedPrice] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Form states: Submit Solution
  const [solutionNotes, setSolutionNotes] = useState('');
  const [solutionFileUrl, setSolutionFileUrl] = useState('');
  const [solutionFileName, setSolutionFileName] = useState('');
  const [submittingSolution, setSubmittingSolution] = useState(false);

  // Form states: Review Solution
  const [reviewAction, setReviewAction] = useState<'approve' | 'request_revision'>('approve');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('Great work, thorough and clearly explained!');
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const solutionFileInputRef = useRef<HTMLInputElement>(null);

  // Set default deadline to 48 hours from now
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(23, 59, 0, 0);
    // YYYY-MM-DDTHH:mm
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormDeadline(localIso);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.email) setFormContactEmail(user.email);
      if ((user as any).phone) setFormContactPhone((user as any).phone);
      if (user.collegeName) setFormContactLocation(`${user.collegeName} Quad / Hostel 4`);
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.getAssignments();
      if (res.success && Array.isArray(res.assignments)) {
        setAssignments(res.assignments);
      }
    } catch (err: any) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.campusId]);

  // Handle file upload for assignment problem set
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showAlert('File is too large (max 8MB). Please choose a smaller file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormAttachmentUrl(base64);
      setFormAttachmentName(file.name);
      showAlert(`Attached "${file.name}" successfully!`, 'success');
    };
    reader.onerror = () => {
      showAlert('Could not read the uploaded file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Handle file upload for solution
  const handleSolutionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showAlert('File is too large (max 10MB).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSolutionFileUrl(base64);
      setSolutionFileName(file.name);
      showAlert(`Solution file "${file.name}" attached!`, 'success');
    };
    reader.onerror = () => {
      showAlert('Could not read file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Preset templates to help the user post quickly
  const handleApplyPreset = (type: 'cs' | 'math' | 'physics') => {
    if (type === 'cs') {
      setFormTitle('Data Structures: Red-Black Tree Implementation & Analysis');
      setFormSubject('Computer Science');
      setFormCourseCode('CS106B');
      setFormDescription('Need help completing the rotation logic for balanced search trees and writing the complexity analysis report with benchmark runtime graphs.');
      setFormRequirements('1. Java or C++ source code\n2. Clean inline comments explaining left & right rotation\n3. 2-page brief performance summary');
      setFormBounty('800');
      setFormUrgency('High');
      setFormAttachmentName('CS106B_Assignment_4_Rubric.pdf');
      setFormAttachmentUrl('data:text/plain;base64,Q1MxMDZCIExhYiA0OiBSZWQtQmxhY2sgVHJlZXMgSW1wbGVtZW50YXRpb24gR3VpZGUgYW5kIEJlbmNobWFya2luZyBTcGVjcw==');
    } else if (type === 'math') {
      setFormTitle('Linear Algebra & Multivariable Calculus Problem Set 6');
      setFormSubject('Mathematics & Statistics');
      setFormCourseCode('MATH51');
      setFormDescription('Five questions regarding Gram-Schmidt orthogonalization, eigenvalues/eigenvectors and Lagrange multipliers with step-by-step mathematical proofs.');
      setFormRequirements('1. Step-by-step LaTeX or clean handwritten PDF\n2. Detailed intermediate algebra steps\n3. Verification of boundary values');
      setFormBounty('650');
      setFormUrgency('Urgent (Within 24h)');
      setFormAttachmentName('Math51_PSet6_Questions.pdf');
      setFormAttachmentUrl('data:text/plain;base64,TWF0aCA1MSBQcm9ibGVtIFNldCA2OiBPcnRob2dvbmFsaXR5IGFuZCBFYWxndmFsdWVz');
    } else {
      setFormTitle('Engineering Thermodynamics Lab Report & Cycle Efficiency');
      setFormSubject('Mechanical Engineering');
      setFormCourseCode('ME201');
      setFormDescription('Complete the Rankine cycle calculations, enthalpy balance equations, and T-s diagram plots for steam turbine simulation.');
      setFormRequirements('1. Excel spreadsheet with thermodynamic calculations\n2. Word/PDF report with generated T-s diagrams\n3. Executive summary of turbine isentropic efficiency');
      setFormBounty('1000');
      setFormUrgency('Normal');
      setFormAttachmentName('ME201_LabReport_Template.docx');
      setFormAttachmentUrl('data:text/plain;base64,TWVjaGFuaWNhbCBFbmdpbmVlcmluZyBMYWIgUmVwb3J0IFRlbXBsYXRl');
    }
    showAlert('Loaded sample assignment template! You can customize before posting.', 'info');
  };

  // Submit Post Assignment
  const handlePostAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showAlert('Please sign in with your campus account to post an assignment.', 'error');
      return;
    }

    if (!formTitle.trim() || !formSubject.trim() || !formDescription.trim()) {
      showAlert('Please enter the assignment title, subject, and description.', 'error');
      return;
    }

    try {
      setSubmittingPost(true);
      const res = await api.createAssignment({
        title: formTitle.trim(),
        subject: formSubject.trim(),
        courseCode: formCourseCode.trim() || undefined,
        description: formDescription.trim(),
        requirements: formRequirements.trim(),
        bounty: Number(formBounty) || 0,
        deadline: formDeadline,
        urgency: formUrgency,
        contactPhone: formContactPhone.trim(),
        contactEmail: formContactEmail.trim() || user.email,
        contactLocation: formContactLocation.trim(),
        preferredContactMethod: formPreferredContact,
        attachmentUrl: formAttachmentUrl || undefined,
        attachmentName: formAttachmentName || undefined,
        attachmentType: formAttachmentName?.endsWith('.pdf') ? 'pdf' : 'doc'
      });

      if (res.success) {
        showAlert(
          `Assignment posted! Bounty of ₹${Number(formBounty).toLocaleString()} safely held in escrow.`,
          'success'
        );
        setIsPostModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormDescription('');
        setFormRequirements('');
        setFormCourseCode('');
        setFormAttachmentUrl('');
        setFormAttachmentName('');
        await fetchAssignments();
        setActiveSubTab('my_posted');
      } else {
        showAlert(res.message || 'Failed to post assignment.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'An error occurred while posting.', 'error');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Submit Apply / Proposal
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showAlert('Please sign in to offer help on assignments.', 'error');
      return;
    }
    if (!selectedAssignmentForApply) return;

    if (!applyPitch.trim()) {
      showAlert('Please explain how you plan to complete this assignment.', 'error');
      return;
    }

    try {
      setSubmittingApply(true);
      const res = await api.applyOrBidAssignment(selectedAssignmentForApply.id, {
        pitch: applyPitch.trim(),
        proposedTime: applyProposedTime.trim(),
        offeredPrice: applyOfferedPrice ? Number(applyOfferedPrice) : selectedAssignmentForApply.bounty
      });

      if (res.success) {
        showAlert('Proposal submitted! The student has been notified.', 'success');
        setIsApplyModalOpen(false);
        setSelectedAssignmentForApply(null);
        setApplyPitch('');
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Failed to submit proposal.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Could not submit proposal.', 'error');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Open counter offer modal (Available to other users, not to the user who listed the help)
  const handleOpenCounterOffer = (assignment: Assignment, proposal?: AssignmentProposal | null) => {
    if (!user) {
      showAlert('Please log in with your campus account to propose a counter offer.', 'info');
      return;
    }
    const isOwner = assignment.studentId === user.id || (user as any)?.userId === assignment.studentId;
    if (isOwner) {
      showAlert('As the assignment author, you set the bounty. Other users can propose counter offers.', 'info');
      return;
    }
    const prevAmount = proposal
      ? (proposal.counterPrice || proposal.offeredPrice || assignment.bounty)
      : assignment.bounty;
    setSelectedAssignmentForCounter(assignment);
    setSelectedProposalForCounter(proposal || null);
    setCounterPreviousPrice(prevAmount);
    setCounterPrice(String(prevAmount));
    setCounterNote('I can complete this assignment on time with detailed walkthrough comments and test validation at this proposed rate.');
    setCounterProposedTime(proposal?.proposedTime || 'Within 24 hours');
    setIsCounterModalOpen(true);
  };

  // Submit counter offer
  const handleSubmitCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForCounter) return;

    const priceNum = Number(counterPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showAlert('Please enter a valid counter price in ₹.', 'error');
      return;
    }

    try {
      setSubmittingCounter(true);
      const res = await api.counterAssignmentOffer(selectedAssignmentForCounter.id, {
        proposalId: selectedProposalForCounter?.id,
        counterPrice: priceNum,
        counterNote: counterNote.trim(),
        proposedTime: counterProposedTime.trim()
      });

      if (res.success) {
        showAlert(
          `Counter offer of ₹${priceNum.toLocaleString()} (Previous: ₹${counterPreviousPrice.toLocaleString()}) submitted successfully!`,
          'success'
        );
        setIsCounterModalOpen(false);
        setSelectedAssignmentForCounter(null);
        setSelectedProposalForCounter(null);
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Failed to submit counter offer.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error submitting counter offer.', 'error');
    } finally {
      setSubmittingCounter(false);
    }
  };

  // Accept Offer & Work on Assignment (Other user claims listed assignment)
  const handleClaimAssignment = async (assignment: Assignment) => {
    if (!user) {
      showAlert('Please log in with your campus account to accept this offer.', 'error');
      return;
    }
    const isOwner = assignment.studentId === user.id || (user as any)?.userId === assignment.studentId;
    if (isOwner) {
      showAlert('You listed this assignment. Other campus peers can accept and complete this work.', 'info');
      return;
    }
    try {
      setSubmittingClaimId(assignment.id);
      setSubmittingClaim(true);
      const res = await api.claimAssignment(assignment.id);
      if (res.success) {
        showAlert(
          `🎉 Offer accepted! You are now assigned to work on "${assignment.title}" for ₹${assignment.bounty.toLocaleString()}. Check "My Solved / In Progress" to view details and submit results.`,
          'success'
        );
        setIsClaimModalOpen(false);
        setSelectedAssignmentForClaim(null);
        await fetchAssignments();
        setActiveSubTab('my_accepted');
      } else {
        showAlert(res.message || 'Failed to accept assignment offer.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error accepting assignment offer.', 'error');
    } finally {
      setSubmittingClaim(false);
      setSubmittingClaimId(null);
    }
  };

  // Assign Solver / Accept Offer
  const handleAssignSolver = async (
    assignmentId: string,
    proposalId: string,
    solverName: string,
    solverId?: string
  ) => {
    try {
      const res = await api.assignSolver(assignmentId, { proposalId, solverId });
      if (res.success) {
        showAlert(`Offer accepted! ${solverName} is now assigned to complete your assignment.`, 'success');
        setIsProposalsModalOpen(false);
        setSelectedAssignmentForProposals(null);
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Failed to accept offer.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error accepting offer.', 'error');
    }
  };

  // Add demo offer for fast testing
  const handleAddDemoProposal = async (assignmentId: string) => {
    try {
      const res = await api.addDemoOffer(assignmentId);
      if (res.success) {
        showAlert(res.message || 'Sample peer offer added! You can now accept this offer.', 'success');
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Could not add sample offer.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error adding sample offer.', 'error');
    }
  };

  // Quick fill sample solution for fast verification
  const handleFillSampleSolution = () => {
    setSolutionNotes(
      'Completed all assignment questions and lab specs with annotated code comments, step-by-step mathematical proofs, and comprehensive test suite validation.\n\nDeliverables:\n1. Verified implementation code & unit test suite.\n2. PDF analysis report with graphs.\n3. Verified output matches test cases.'
    );
    setSolutionFileName('Completed_Assignment_Results.pdf');
    setSolutionFileUrl('data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJzLzcxTSEssKi7ILyqpVHDk0vd39vfzV/BLLUlMz8wDABfQCRUKZW5kc3RyZWFtCmVuZG9iag==');
    showAlert('Sample completed solution loaded! You can customize before submitting.', 'info');
  };

  // Submit Solution
  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForSubmit) return;

    if (!solutionNotes.trim() && !solutionFileUrl) {
      showAlert('Please enter solution notes or upload your completed solution file.', 'error');
      return;
    }

    try {
      setSubmittingSolution(true);
      const res = await api.submitAssignmentSolution(selectedAssignmentForSubmit.id, {
        solutionNotes: solutionNotes.trim(),
        solutionFileUrl: solutionFileUrl || undefined,
        solutionFileName: solutionFileName || undefined
      });

      if (res.success) {
        showAlert('Solution submitted! The student will review and release your payout.', 'success');
        setIsSubmitSolutionModalOpen(false);
        setSelectedAssignmentForSubmit(null);
        setSolutionNotes('');
        setSolutionFileUrl('');
        setSolutionFileName('');
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Failed to submit solution.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error submitting solution.', 'error');
    } finally {
      setSubmittingSolution(false);
    }
  };

  // Review Solution
  const handleReviewSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForReview) return;

    try {
      setSubmittingReview(true);
      const res = await api.reviewAssignmentSolution(selectedAssignmentForReview.id, {
        action: reviewAction,
        rating: reviewAction === 'approve' ? reviewRating : undefined,
        review: reviewAction === 'approve' ? reviewComment.trim() : undefined,
        revisionFeedback: reviewAction === 'request_revision' ? revisionFeedback.trim() : undefined
      });

      if (res.success) {
        if (reviewAction === 'approve') {
          showAlert(
            `Solution approved! ₹${selectedAssignmentForReview.bounty.toLocaleString()} has been transferred from escrow to the solver.`,
            'success'
          );
        } else {
          showAlert('Revision request sent to the solver.', 'info');
        }
        setIsReviewModalOpen(false);
        setSelectedAssignmentForReview(null);
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Failed to process review.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error reviewing solution.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Cancel Assignment
  const handleCancelAssignment = async (assignment: Assignment) => {
    if (!confirm(`Are you sure you want to cancel "${assignment.title}"? Any held bounty of ₹${assignment.bounty} will be refunded to your wallet.`)) {
      return;
    }

    try {
      const res = await api.cancelAssignment(assignment.id);
      if (res.success) {
        showAlert('Assignment cancelled. Bounty funds returned to your wallet.', 'success');
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Failed to cancel.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error cancelling assignment.', 'error');
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!confirm(`Delete "${assignment.title}"?`)) return;

    try {
      const res = await api.deleteAssignment(assignment.id);
      if (res.success) {
        showAlert('Assignment deleted.', 'success');
        await fetchAssignments();
      } else {
        showAlert(res.message || 'Failed to delete.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error deleting assignment.', 'error');
    }
  };

  // Filtered lists
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Sub-tab view filtering
      if (activeSubTab === 'my_posted') {
        const isMyPost =
          a.studentId === user?.id || (user as any)?.userId === a.studentId;
        if (!isMyPost) return false;
      } else if (activeSubTab === 'my_accepted') {
        const isSolver =
          a.solverId === user?.id ||
          (user as any)?.userId === a.solverId ||
          a.proposals.some(
            (p) => p.solverId === user?.id || p.solverId === (user as any)?.userId
          );
        if (!isSolver) return false;
      }

      // Subject
      if (selectedSubject !== 'All Subjects') {
        if (!a.subject.toLowerCase().includes(selectedSubject.toLowerCase())) {
          return false;
        }
      }

      // Urgency
      if (selectedUrgency !== 'all') {
        if (a.urgency !== selectedUrgency) return false;
      }

      // Status
      if (selectedStatus !== 'all') {
        if (a.status !== selectedStatus) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          a.title.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q) ||
          (a.courseCode && a.courseCode.toLowerCase().includes(q)) ||
          a.description.toLowerCase().includes(q) ||
          a.studentName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [assignments, activeSubTab, selectedSubject, selectedUrgency, selectedStatus, searchQuery, user?.id]);

  // Statistics
  const openCount = useMemo(() => assignments.filter((a) => a.status === 'open').length, [assignments]);
  const inProgressCount = useMemo(
    () => assignments.filter((a) => a.status === 'assigned' || a.status === 'submitted').length,
    [assignments]
  );
  const totalBounties = useMemo(
    () => assignments.reduce((sum, a) => sum + (a.bounty || 0), 0),
    [assignments]
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner with Restrained Campus Intranet Styling */}
      <div className="bg-[#1d1d1f] text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium backdrop-blur-xs">
            <IconShield className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Campus Escrow Protected • Guaranteed Payout on Approval</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Assignment Help & Peer Bounty Board
          </h1>
          <p className="text-sm text-[#86868b] leading-relaxed">
            Need assistance on a tough problem set, lab report, or code debugging? Upload your pending assignment
            and set a reward. Verified peers complete the work, and payment is released from escrow only when you approve!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!user) {
                  showAlert('Please log in with your campus ID to post an assignment.', 'error');
                  return;
                }
                setIsPostModalOpen(true);
              }}
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Post Pending Assignment</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('browse');
                setSelectedStatus('open');
              }}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-[#34c759]" />
              <span>Browse Open Tasks to Earn ₹</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{openCount}</div>
            <div className="text-xs text-[#86868b]">Open for Solvers</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#ff9f0a]">{inProgressCount}</div>
            <div className="text-xs text-[#86868b]">In Progress / Review</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-[#34c759]">₹{totalBounties.toLocaleString()}</div>
            <div className="text-xs text-[#86868b]">Total Campus Bounties</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">100%</div>
            <div className="text-xs text-[#86868b]">Escrow Protected</div>
          </div>
        </div>
      </div>

      {/* Main Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#e5e5ea] pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('browse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === 'browse'
                ? 'bg-[#1d1d1f] text-white'
                : 'text-[#515154] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
            }`}
          >
            Browse All Assignments ({assignments.length})
          </button>
          <button
            onClick={() => {
              if (!user) {
                showAlert('Please log in to view your posted assignments.', 'info');
                return;
              }
              setActiveSubTab('my_posted');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'my_posted'
                ? 'bg-[#1d1d1f] text-white'
                : 'text-[#515154] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
            }`}
          >
            <span>My Posted Tasks</span>
            {user && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                {assignments.filter((a) => a.studentId === user.id || (user as any)?.userId === a.studentId).length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (!user) {
                showAlert('Please log in to view tasks you are working on.', 'info');
                return;
              }
              setActiveSubTab('my_accepted');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'my_accepted'
                ? 'bg-[#1d1d1f] text-white'
                : 'text-[#515154] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
            }`}
          >
            <span>My Solved / In Progress</span>
            {user && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                {
                  assignments.filter(
                    (a) =>
                      a.solverId === user.id ||
                      (user as any)?.userId === a.solverId ||
                      a.proposals.some((p) => p.solverId === user.id || p.solverId === (user as any)?.userId)
                  ).length
                }
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => {
            if (!user) {
              showAlert('Please log in to post an assignment.', 'error');
              return;
            }
            setIsPostModalOpen(true);
          }}
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Pending Assignment</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#f5f5f7] p-3 sm:p-4 rounded-xl space-y-3 border border-[#e5e5ea]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, course code (e.g. CS106B), or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-[#e5e5ea] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
              >
                <IconClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Subject Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border border-[#e5e5ea] text-xs rounded-lg px-3 py-2 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] cursor-pointer"
          >
            {SUBJECT_OPTIONS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-[#e5e5ea] text-xs rounded-lg px-3 py-2 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open (Seeking Helpers)</option>
            <option value="assigned">In Progress (Assigned)</option>
            <option value="submitted">Submitted (Under Review)</option>
            <option value="completed">Completed (Paid)</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="bg-white border border-[#e5e5ea] text-xs rounded-lg px-3 py-2 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] cursor-pointer"
          >
            <option value="all">All Urgencies</option>
            <option value="Urgent (Within 24h)">🔥 Urgent (Within 24h)</option>
            <option value="High">⚡ High Urgency</option>
            <option value="Normal">Normal Pace</option>
          </select>
        </div>
      </div>

      {/* Assignment Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#86868b]">Loading campus assignments & bounties...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="border border-dashed border-[#e5e5ea] bg-white rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-[#0071e3] rounded-full flex items-center justify-center mx-auto">
            <IconFileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1d1d1f]">No assignments found</h3>
          <p className="text-xs text-[#86868b] max-w-md mx-auto">
            {activeSubTab === 'my_posted'
              ? 'You have not uploaded any pending assignments yet. Upload your homework or lab report to find a helper!'
              : activeSubTab === 'my_accepted'
              ? 'You have not claimed or solved any assignments yet. Browse open assignments to earn money!'
              : 'There are currently no assignments matching your selected filter criteria. Be the first to post one!'}
          </p>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="bg-[#0071e3] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#0077ed] transition cursor-pointer"
          >
            Post an Assignment Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => {
            const isAuthor =
              assignment.studentId === user?.id || (user as any)?.userId === assignment.studentId;
            const isAssignedSolver =
              assignment.solverId === user?.id || (user as any)?.userId === assignment.solverId;
            const hasApplied = assignment.proposals.some(
              (p) => p.solverId === user?.id || p.solverId === (user as any)?.userId
            );

            // Format deadline date
            const deadlineDate = new Date(assignment.deadline);
            const isOverdue = deadlineDate.getTime() < Date.now() && assignment.status !== 'completed';
            const formattedDeadline = isNaN(deadlineDate.getTime())
              ? assignment.deadline
              : deadlineDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-xl border border-[#e5e5ea] hover:border-[#0071e3]/40 transition shadow-xs flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top: Badges & Bounty */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-slate-100 text-[#515154] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {assignment.subject}
                        </span>
                        {assignment.courseCode && (
                          <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {assignment.courseCode}
                          </span>
                        )}
                        {assignment.urgency === 'Urgent (Within 24h)' ? (
                          <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-rose-600" />
                            <span>Urgent</span>
                          </span>
                        ) : assignment.urgency === 'High' ? (
                          <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            High Priority
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-sm font-semibold text-[#1d1d1f] line-clamp-2 leading-snug pt-1">
                        {assignment.title}
                      </h3>
                    </div>

                    {/* Bounty Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-[#34c759]">
                        ₹{assignment.bounty.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#86868b] flex items-center justify-end gap-0.5">
                        <IconShield className="w-2.5 h-2.5 text-[#34c759]" />
                        <span>Escrow</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#515154] line-clamp-3 leading-relaxed">
                    {assignment.description}
                  </p>

                  {/* Attachment Preview if attached */}
                  {assignment.attachmentName && (
                    <div className="bg-[#f5f5f7] p-2.5 rounded-lg flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                        <span className="text-[#1d1d1f] font-medium truncate" title={assignment.attachmentName}>
                          {assignment.attachmentName}
                        </span>
                      </div>
                      {assignment.attachmentUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewAttachment({
                              url: assignment.attachmentUrl!,
                              name: assignment.attachmentName!,
                              type: assignment.attachmentType
                            });
                            setIsAttachmentPreviewOpen(true);
                          }}
                          className="text-[#0071e3] hover:underline font-semibold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <IconEye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Deadline & Status Details */}
                  <div className="pt-2 border-t border-[#e5e5ea] flex items-center justify-between text-[11px] text-[#86868b]">
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                      <IconClock className="w-3 h-3" />
                      <span>Due: {formattedDeadline}</span>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`font-bold px-2 py-0.5 rounded capitalize ${
                        assignment.status === 'open'
                          ? 'bg-blue-50 text-blue-700'
                          : assignment.status === 'assigned'
                          ? 'bg-amber-50 text-amber-800'
                          : assignment.status === 'submitted'
                          ? 'bg-purple-50 text-purple-800'
                          : assignment.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {assignment.status === 'open'
                        ? 'Open for Offers'
                        : assignment.status === 'assigned'
                        ? 'In Progress'
                        : assignment.status === 'submitted'
                        ? 'Review Pending'
                        : assignment.status === 'completed'
                        ? 'Completed'
                        : 'Cancelled'}
                    </span>
                  </div>

                  {/* Student Poster Info */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          assignment.studentAvatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={assignment.studentName}
                        className="w-6 h-6 rounded-full object-cover border border-[#e5e5ea]"
                      />
                      <div className="leading-none">
                        <div className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1">
                          <span>{assignment.studentName}</span>
                          <VerifiedBadge isVerified={assignment.studentVerified ?? true} showLabel={false} size="xs" />
                          {isAuthor && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#86868b]">{assignment.studentCollege}</div>
                      </div>
                    </div>

                    {/* Assigned Solver Info if assigned */}
                    {assignment.solverName && (
                      <div className="text-right">
                        <span className="text-[10px] text-[#86868b]">Solver: </span>
                        <span className="text-xs font-semibold text-[#1d1d1f] inline-flex items-center gap-1">
                          <span>{isAssignedSolver ? 'You' : assignment.solverName}</span>
                          <VerifiedBadge isVerified={assignment.solverVerified ?? true} showLabel={false} size="xs" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lister Contact Details (Visible to peers so they can contact the lister directly) */}
                  <div className="bg-[#f8f9fa] border border-[#e5e5ea] rounded-xl p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
                        <span className="text-[11px] font-bold text-[#1d1d1f]">Lister Contact Details</span>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-[#0071e3] font-semibold px-2 py-0.5 rounded border border-blue-200">
                        Prefers {assignment.preferredContactMethod === 'whatsapp' ? 'WhatsApp' : assignment.preferredContactMethod === 'phone' ? 'Phone' : assignment.preferredContactMethod === 'email' ? 'Campus Email' : 'Live Chat'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#515154]">
                      {/* Phone & WhatsApp */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-[11px] text-[#86868b]">Phone:</span>
                          <a
                            href={`tel:${assignment.studentPhone || '+1 (650) 498-2041'}`}
                            className="font-semibold text-[#1d1d1f] hover:text-[#0071e3] hover:underline truncate"
                            title="Call Lister"
                          >
                            {assignment.studentPhone || '+1 (650) 498-2041'}
                          </a>
                        </div>
                        <a
                          href={`https://wa.me/${(assignment.studentPhone || '16504982041').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-200 transition shrink-0 flex items-center gap-1"
                          title="Message Lister on WhatsApp"
                        >
                          <span>WhatsApp</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      {/* Campus Email */}
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="text-[11px] text-[#86868b]">Email:</span>
                        <a
                          href={`mailto:${assignment.studentEmail || `${assignment.studentName.toLowerCase().replace(/\s+/g, '.')}@${user?.domain || 'college.edu'}`}`}
                          className="font-medium text-[#1d1d1f] hover:text-[#0071e3] hover:underline truncate"
                          title="Email Lister"
                        >
                          {assignment.studentEmail || `${assignment.studentName.toLowerCase().replace(/\s+/g, '.')}@${user?.domain || 'college.edu'}`}
                        </a>
                      </div>

                      {/* Campus Location */}
                      <div className="flex items-center gap-1.5 truncate text-[11px] text-[#86868b]">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{assignment.studentLocation || 'Campus Quad / Student Hostel'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Offers Section for Open Assignments */}
                  {assignment.status === 'open' && (
                    <div className="mt-2.5">
                      {assignment.proposals.length > 0 ? (
                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-xs font-bold text-amber-950">
                                Offers Received ({assignment.proposals.length})
                              </span>
                            </div>
                            <span className="text-[10px] text-amber-800 font-medium">
                              {isAuthor ? 'Choose an offer to accept' : 'Classmates have offered'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {assignment.proposals.map((prop) => {
                              const isMyOffer = user && prop.solverId === user.id;
                              return (
                                <div
                                  key={prop.id}
                                  className="bg-white border border-amber-200/90 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <img
                                      src={
                                        prop.solverAvatar ||
                                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                                      }
                                      alt={prop.solverName}
                                      className="w-7 h-7 rounded-full object-cover border border-amber-200 shrink-0"
                                    />
                                    <div className="leading-tight truncate">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-[#1d1d1f] truncate">
                                          {prop.solverName}
                                        </span>
                                        <VerifiedBadge isVerified={prop.solverVerified ?? true} showLabel={false} size="xs" />
                                        {isMyOffer && (
                                          <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                            Your Offer
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        ⏱️ {prop.proposedTime} • "{prop.pitch}"
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    <div className="text-right">
                                      <span className="text-[10px] text-slate-400 block sm:hidden">Offered:</span>
                                      {prop.counterPrice ? (
                                        <div>
                                          <div className="text-[10px] text-slate-400 line-through">
                                            ₹{(prop.offeredPrice || assignment.bounty).toLocaleString()}
                                          </div>
                                          <div className="text-xs font-extrabold text-[#ff9f0a]">
                                            ₹{prop.counterPrice.toLocaleString()}
                                          </div>
                                          <div className="text-[9px] text-amber-700 font-semibold">
                                            Counter by {prop.counterBy === 'poster' ? 'Lister' : 'Helper'}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-extrabold text-[#34c759]">
                                          ₹{(prop.offeredPrice || assignment.bounty).toLocaleString()}
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons: Assign Helper for Author */}
                                    {isAuthor || (user && user.role === 'admin') ? (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() =>
                                            handleAssignSolver(
                                              assignment.id,
                                              prop.id,
                                              prop.solverName,
                                              prop.solverId
                                            )
                                          }
                                          className="bg-[#34c759] hover:bg-[#2db84d] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                          title="Assign this helper to the assignment"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          <span>Assign Helper</span>
                                        </button>
                                      </div>
                                    ) : isMyOffer ? (
                                      <div className="flex items-center gap-1.5">
                                        {prop.counterBy === 'poster' && prop.counterStatus === 'pending' ? (
                                          <>
                                            <button
                                              onClick={() =>
                                                handleAssignSolver(
                                                  assignment.id,
                                                  prop.id,
                                                  prop.solverName,
                                                  prop.solverId
                                                )
                                              }
                                              className="bg-[#34c759] hover:bg-[#2db84d] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                              title="Accept lister's counter offer and start work"
                                            >
                                              <CheckCircle className="w-3.5 h-3.5" />
                                              <span>Accept Counter</span>
                                            </button>
                                            <button
                                              onClick={() => handleOpenCounterOffer(assignment, prop)}
                                              className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
                                            >
                                              Counter Back
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => handleOpenCounterOffer(assignment, prop)}
                                            className="text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1 active:scale-95"
                                          >
                                            <ArrowRightLeft className="w-3 h-3 text-amber-700" />
                                            <span>Counter Offer</span>
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenCounterOffer(assignment)}
                                        className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                                        title="Counter offer the previous amount"
                                      >
                                        <ArrowRightLeft className="w-3 h-3" />
                                        <span>Counter Offer</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        isAuthor && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Awaiting offers from campus peers.</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="bg-[#f5f5f7] px-4 py-3 border-t border-[#e5e5ea] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Chat with Poster or Solver */}
                    <button
                      onClick={() => {
                        const chatPartner = isAuthor
                          ? assignment.solverName
                            ? `Solver: ${assignment.solverName}`
                            : 'Assignment Inquiry'
                          : `Author: ${assignment.studentName}`;
                        openChat(
                          `assignment_${assignment.id}`,
                          `Assignment: ${assignment.title}`,
                          `${assignment.courseCode || assignment.subject} • Bounty: ₹${assignment.bounty.toLocaleString()} (${chatPartner})`
                        );
                      }}
                      className="p-1.5 rounded-lg border border-[#e5e5ea] bg-white hover:bg-slate-50 text-[#515154] hover:text-[#1d1d1f] transition cursor-pointer"
                      title="Open Live Chat Room"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Author Management or Cancellation */}
                    {isAuthor && assignment.status === 'open' && (
                      <button
                        onClick={() => handleCancelAssignment(assignment)}
                        className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Admin / Author Delete */}
                    {user && (isAuthor || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteAssignment(assignment)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Primary Workflow Actions */}
                  <div>
                    {isAuthor ? (
                      /* Poster controls */
                      assignment.status === 'open' ? (
                        assignment.proposals.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedAssignmentForProposals(assignment);
                              setIsProposalsModalOpen(true);
                            }}
                            className="bg-[#0071e3] hover:bg-[#0077ed] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Handshake className="w-3.5 h-3.5" />
                            <span>View Offers ({assignment.proposals.length})</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Awaiting Offers</span>
                          </span>
                        )
                      ) : assignment.status === 'submitted' ? (
                        <button
                          onClick={() => {
                            setSelectedAssignmentForReview(assignment);
                            setIsReviewModalOpen(true);
                          }}
                          className="bg-[#34c759] hover:bg-[#30b753] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Review & Release (₹{assignment.bounty})</span>
                        </button>
                      ) : assignment.status === 'assigned' ? (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          Solver Working...
                        </span>
                      ) : assignment.status === 'completed' ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Paid ₹{assignment.bounty}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#86868b]">Closed</span>
                      )
                    ) : isAssignedSolver ? (
                      /* Solver controls */
                      assignment.status === 'assigned' ? (
                        <button
                          onClick={() => {
                            setSelectedAssignmentForSubmit(assignment);
                            setIsSubmitSolutionModalOpen(true);
                          }}
                          className="bg-[#34c759] hover:bg-[#2db84d] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Submit Result</span>
                        </button>
                      ) : assignment.status === 'submitted' ? (
                        <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-purple-600" />
                          <span>Result Submitted • In Review</span>
                        </span>
                      ) : assignment.status === 'completed' ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <Award className="w-3.5 h-3.5" />
                          <span>₹{assignment.bounty} Credited</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#86868b]">Closed</span>
                      )
                    ) : (
                      /* Peer / Potential helper controls: Counter Offer, Submit Result */
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Counter Offer Button for Other Users */}
                        {assignment.status === 'open' && (
                          <button
                            onClick={() => handleOpenCounterOffer(assignment)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Counter offer the previous bounty amount"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Counter Offer</span>
                          </button>
                        )}

                        {/* Submit Result Button */}
                        {(assignment.status === 'open' || assignment.status === 'assigned') && (
                          <button
                            onClick={() => {
                              if (!user) {
                                showAlert('Please log in with your campus account to submit a result.', 'error');
                                return;
                              }
                              setSelectedAssignmentForSubmit(assignment);
                              setIsSubmitSolutionModalOpen(true);
                            }}
                            className="border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[#1d1d1f] px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer active:scale-95"
                            title="Directly upload completed assignment result"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#0071e3]" />
                            <span>Submit Result</span>
                          </button>
                        )}

                        {assignment.status !== 'open' && assignment.status !== 'assigned' && (
                          <span className="text-[11px] text-[#86868b]">Unavailable</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: POST AN ASSIGNMENT */}
      {/* ========================================================================= */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">Post Pending Assignment</h2>
                <p className="text-xs text-[#86868b]">
                  Upload instructions & problem set. Bounty is held in escrow until you approve the solution.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="bg-[#f5f5f7] px-6 py-2.5 border-b border-[#e5e5ea] flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <span className="text-[#86868b] shrink-0 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Quick Templates:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('cs')}
                  className="bg-white hover:bg-slate-50 border border-[#e5e5ea] text-[#1d1d1f] px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer"
                >
                  💻 CS Lab Project
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('math')}
                  className="bg-white hover:bg-slate-50 border border-[#e5e5ea] text-[#1d1d1f] px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer"
                >
                  📐 Math Problem Set
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('physics')}
                  className="bg-white hover:bg-slate-50 border border-[#e5e5ea] text-[#1d1d1f] px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer"
                >
                  ⚙️ Mech/Thermo Lab
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePostAssignment} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Assignment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures Lab 3: Balanced Search Trees"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* Subject & Course Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    Subject / Discipline <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] cursor-pointer"
                  >
                    {SUBJECT_OPTIONS.filter((s) => s !== 'All Subjects').map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS106B or MATH51"
                    value={formCourseCode}
                    onChange={(e) => setFormCourseCode(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Detailed Instructions / Brief <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what needs to be solved, language/software requirements, or specific equations..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Specific Deliverables / Requirements (One per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g.&#10;1. Working Python code with comments&#10;2. Step-by-step PDF derivation&#10;3. Screenshot of test cases passing"
                  value={formRequirements}
                  onChange={(e) => setFormRequirements(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* File Attachment Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Attach Problem Set / Questions (PDF, DOCX, Code, Images)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.zip,.txt,.py,.java,.cpp,.jpg,.jpeg,.png"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 border border-[#e5e5ea] hover:bg-[#f5f5f7] rounded-lg text-xs font-semibold text-[#1d1d1f] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>{formAttachmentName ? 'Change Attached File' : 'Upload Assignment File'}</span>
                  </button>

                  {formAttachmentName && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 truncate">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{formAttachmentName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormAttachmentName('');
                          setFormAttachmentUrl('');
                        }}
                        className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                      >
                        <IconClose className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bounty Reward & Escrow info */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconCreditCard className="w-4 h-4 text-[#34c759]" />
                    <span className="text-xs font-bold text-emerald-950">
                      Offered Reward / Bounty (₹)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-emerald-300">
                    <span className="text-xs font-bold text-[#34c759]">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={formBounty}
                      onChange={(e) => setFormBounty(e.target.value)}
                      className="w-20 text-xs font-extrabold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-900 leading-snug">
                  🛡️ <strong>Campus Escrow Guarantee:</strong> This reward is held safely in institutional escrow. The helper does not receive payment until you inspect and approve their completed solution.
                </p>
              </div>

              {/* Deadline & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    Due Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] cursor-pointer"
                  >
                    <option value="Normal">Normal (Standard turnaround)</option>
                    <option value="High">High (Needs prompt attention)</option>
                    <option value="Urgent (Within 24h)">🔥 Urgent (Within 24 Hours)</option>
                  </select>
                </div>
              </div>

              {/* Lister Contact Information (Visible to peers so they can reach you directly) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#0071e3]" />
                    <span className="text-xs font-bold text-[#1d1d1f]">
                      Your Contact Details (Visible to Helpers)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Peers will use this to call, WhatsApp, or email you
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1d1d1f] mb-1">
                      Phone / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+1 (650) 498-2041 or +91 98765 43210"
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1d1d1f] mb-1">
                      Campus Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@college.edu"
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1d1d1f] mb-1">
                      Hostel / Campus Room / Dept
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stern Hall, Room 314"
                      value={formContactLocation}
                      onChange={(e) => setFormContactLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1d1d1f] mb-1">
                      Preferred Contact Channel
                    </label>
                    <select
                      value={formPreferredContact}
                      onChange={(e) => setFormPreferredContact(e.target.value as any)}
                      className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] cursor-pointer"
                    >
                      <option value="chat">Intranet Live Chat (Recommended)</option>
                      <option value="whatsapp">WhatsApp Message</option>
                      <option value="phone">Direct Phone Call</option>
                      <option value="email">Campus Email</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#e5e5ea] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e5ea] rounded-lg text-xs font-semibold text-[#515154] hover:bg-[#f5f5f7] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingPost ? (
                    <span>Securing Escrow & Posting...</span>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Post Assignment (Lock ₹{formBounty})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: APPLY / GIVE OFFER TO COMPLETE */}
      {/* ========================================================================= */}
      {isApplyModalOpen && selectedAssignmentForApply && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f]">Give an Offer to Complete Assignment</h3>
                <p className="text-xs text-[#86868b]">
                  {selectedAssignmentForApply.title} • Listed Bounty: ₹{selectedAssignmentForApply.bounty.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#1d1d1f]">
                    Why are you qualified to complete this? (Pitch) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setApplyPitch(
                        'Completed this exact course last semester with an A grade. I will deliver well-commented code, comprehensive test suite runs, and a step-by-step PDF report.'
                      )
                    }
                    className="text-[10px] text-[#0071e3] font-bold hover:underline cursor-pointer"
                  >
                    ⚡ Fill Sample Pitch
                  </button>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. I got an A+ in CS106B last term and have implemented Red-Black Trees before. Will provide clear comments and unit tests."
                  value={applyPitch}
                  onChange={(e) => setApplyPitch(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    When can you submit? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Within 12 hours / By 6 PM"
                    value={applyProposedTime}
                    onChange={(e) => setApplyProposedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {['Within 12 hours', 'Within 24 hours', 'Tonight'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setApplyProposedTime(time)}
                        className="text-[10px] bg-[#f5f5f7] hover:bg-slate-200 text-[#515154] px-1.5 py-0.5 rounded cursor-pointer transition"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    Price Offer (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Matches bounty (₹${selectedAssignmentForApply.bounty})`}
                    value={applyOfferedPrice}
                    onChange={(e) => setApplyOfferedPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setApplyOfferedPrice(String(selectedAssignmentForApply.bounty))}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer"
                    >
                      ₹{selectedAssignmentForApply.bounty}
                    </button>
                    {selectedAssignmentForApply.bounty > 100 && (
                      <button
                        type="button"
                        onClick={() =>
                          setApplyOfferedPrice(String(Math.max(50, selectedAssignmentForApply.bounty - 50)))
                        }
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        -₹50 Discount
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <IconShield className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>Escrow Payout Guarantee</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  The student’s ₹{selectedAssignmentForApply.bounty.toLocaleString()} bounty is held safely in escrow. If they accept your offer, the assignment is awarded to you and payout is released upon result submission.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e5ea] rounded-lg text-xs font-semibold text-[#515154] hover:bg-[#f5f5f7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{submittingApply ? 'Submitting Offer...' : 'Give Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW PROPOSALS & ACCEPT AN OFFER */}
      {/* ========================================================================= */}
      {isProposalsModalOpen && selectedAssignmentForProposals && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  Offers Received ({selectedAssignmentForProposals.proposals.length}) • Accept an Offer
                </h3>
                <p className="text-xs text-[#86868b] truncate max-w-sm">
                  {selectedAssignmentForProposals.title} • Escrow: ₹{selectedAssignmentForProposals.bounty.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsProposalsModalOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedAssignmentForProposals.proposals.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#86868b] space-y-3">
                  <p>No peers have submitted an offer yet.</p>
                  <button
                    type="button"
                    onClick={() => handleAddDemoProposal(selectedAssignmentForProposals.id)}
                    className="bg-blue-50 text-[#0071e3] hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>+ Simulate Peer Offer (Demo)</span>
                  </button>
                </div>
              ) : (
                selectedAssignmentForProposals.proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7]/60 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={prop.solverAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={prop.solverName}
                          className="w-8 h-8 rounded-full object-cover border border-[#e5e5ea]"
                        />
                        <div>
                          <div className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1">
                            <span>{prop.solverName}</span>
                            <VerifiedBadge isVerified={prop.solverVerified ?? true} showLabel={false} size="xs" />
                          </div>
                          <div className="text-[10px] text-[#86868b]">{prop.solverCollege || 'Campus Peer'}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {prop.counterPrice ? (
                          <div>
                            <div className="text-xs text-slate-400 line-through">
                              ₹{(prop.offeredPrice || selectedAssignmentForProposals.bounty).toLocaleString()}
                            </div>
                            <div className="text-sm font-extrabold text-[#ff9f0a]">
                              ₹{prop.counterPrice.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-amber-700 font-semibold">
                              Counter by {prop.counterBy === 'poster' ? 'Lister' : 'Helper'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-[#34c759]">
                            ₹{(prop.offeredPrice || selectedAssignmentForProposals.bounty).toLocaleString()}
                          </div>
                        )}
                        <div className="text-[10px] text-[#86868b]">Due: {prop.proposedTime}</div>
                      </div>
                    </div>

                    <p className="text-xs text-[#515154] bg-white p-3 rounded-lg border border-[#e5e5ea] leading-relaxed">
                      "{prop.pitch}"
                    </p>

                    {prop.counterNote && (
                      <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <span className="font-bold">Counter Note: </span>
                        <span>{prop.counterNote}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          openChat(
                            `assignment_${selectedAssignmentForProposals.id}`,
                            `Assignment Help: ${prop.solverName}`,
                            `Discussing ${selectedAssignmentForProposals.title}`
                          );
                        }}
                        className="text-xs text-[#0071e3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with {prop.solverName}</span>
                      </button>

                      {prop.status === 'accepted' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded">
                          Assigned Helper ✓
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleAssignSolver(
                                selectedAssignmentForProposals.id,
                                prop.id,
                                prop.solverName,
                                prop.solverId
                              )
                            }
                            className="bg-[#34c759] hover:bg-[#2db84d] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Accept Offer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SUBMIT SOLUTION / RESULT (SOLVER WORKFLOW) */}
      {/* ========================================================================= */}
      {isSubmitSolutionModalOpen && selectedAssignmentForSubmit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f]">Submit Completed Result</h3>
                <p className="text-xs text-[#86868b] truncate max-w-sm">
                  {selectedAssignmentForSubmit.title} • Bounty: ₹{selectedAssignmentForSubmit.bounty.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsSubmitSolutionModalOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSolution} className="p-6 space-y-4">
              {/* Lister Contact Preview */}
              <div className="bg-[#f8f9fa] border border-[#e5e5ea] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1d1d1f] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>Lister / Submitting To: {selectedAssignmentForSubmit.studentName}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Escrow Locked: ₹{selectedAssignmentForSubmit.bounty.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#515154]">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <a
                      href={`tel:${selectedAssignmentForSubmit.studentPhone || '+1 (650) 498-2041'}`}
                      className="hover:underline font-medium text-[#1d1d1f]"
                    >
                      {selectedAssignmentForSubmit.studentPhone || '+1 (650) 498-2041'}
                    </a>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <a
                      href={`mailto:${selectedAssignmentForSubmit.studentEmail || 'student@university.edu'}`}
                      className="hover:underline font-medium text-[#1d1d1f]"
                    >
                      {selectedAssignmentForSubmit.studentEmail || 'student@university.edu'}
                    </a>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{selectedAssignmentForSubmit.studentLocation || 'Campus Quad'}</span>
                  </div>
                </div>
              </div>

              {/* Quick sample button */}
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#1d1d1f]">
                  Solution Notes & Result Walkthrough <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleFillSampleSolution}
                  className="text-[11px] text-[#0071e3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Fill Sample Result</span>
                </button>
              </div>

              <textarea
                required
                rows={4}
                placeholder="Explain your approach, assumptions made, formulas used, or instructions for running the code..."
                value={solutionNotes}
                onChange={(e) => setSolutionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
              />

              {/* Upload solution files */}
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Attach Solution Files (PDF, ZIP, Code, DOCX)
                </label>
                <input
                  type="file"
                  ref={solutionFileInputRef}
                  onChange={handleSolutionFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.zip,.txt,.py,.java,.cpp,.jpg,.png"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => solutionFileInputRef.current?.click()}
                    className="px-3.5 py-2 border border-[#e5e5ea] hover:bg-[#f5f5f7] rounded-lg text-xs font-semibold text-[#1d1d1f] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>{solutionFileName ? 'Change Result File' : 'Upload Result File'}</span>
                  </button>

                  {solutionFileName && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 truncate">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{solutionFileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSolutionFileName('');
                          setSolutionFileUrl('');
                        }}
                        className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                      >
                        <IconClose className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <IconShield className="w-3.5 h-3.5 text-[#34c759]" />
                  <span>Immediate Review & Escrow Release</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Upon clicking submit, {selectedAssignmentForSubmit.studentName} receives an instant notification to review your deliverables and release the ₹{selectedAssignmentForSubmit.bounty.toLocaleString()} payment.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitSolutionModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e5ea] rounded-lg text-xs font-semibold text-[#515154] hover:bg-[#f5f5f7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSolution}
                  className="bg-[#34c759] hover:bg-[#2db84d] text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{submittingSolution ? 'Submitting Result...' : 'Submit Result'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REVIEW SOLUTION & RELEASE BOUNTY (STUDENT POSTER WORKFLOW) */}
      {/* ========================================================================= */}
      {isReviewModalOpen && selectedAssignmentForReview && selectedAssignmentForReview.submission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f]">Review Solution & Release Payment</h3>
                <p className="text-xs text-[#86868b] truncate max-w-sm">
                  Submitted by {selectedAssignmentForReview.submission.solverName} • Escrow: ₹{selectedAssignmentForReview.bounty.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSolution} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Submission Details Display */}
              <div className="bg-[#f5f5f7] p-4 rounded-xl space-y-2 border border-[#e5e5ea]">
                <div className="text-xs font-bold text-[#1d1d1f]">Helper's Solution Notes:</div>
                <p className="text-xs text-[#515154] whitespace-pre-wrap leading-relaxed">
                  {selectedAssignmentForReview.submission.solutionNotes}
                </p>

                {selectedAssignmentForReview.submission.solutionFileName && (
                  <div className="mt-3 pt-3 border-t border-[#e5e5ea] flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate text-xs">
                      <Paperclip className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span className="font-semibold text-[#1d1d1f] truncate">
                        {selectedAssignmentForReview.submission.solutionFileName}
                      </span>
                    </div>

                    {selectedAssignmentForReview.submission.solutionFileUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewAttachment({
                            url: selectedAssignmentForReview.submission!.solutionFileUrl!,
                            name: selectedAssignmentForReview.submission!.solutionFileName!
                          });
                          setIsAttachmentPreviewOpen(true);
                        }}
                        className="bg-white hover:bg-slate-50 border border-[#e5e5ea] text-[#0071e3] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <IconEye className="w-3.5 h-3.5" />
                        <span>Inspect File</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#1d1d1f]">Your Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approve')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      reviewAction === 'approve'
                        ? 'border-[#34c759] bg-emerald-50/60 ring-2 ring-[#34c759]'
                        : 'border-[#e5e5ea] hover:bg-[#f5f5f7]'
                    }`}
                  >
                    <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-[#34c759]" />
                      <span>Approve & Pay</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      Release ₹{selectedAssignmentForReview.bounty.toLocaleString()} from escrow to solver.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('request_revision')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      reviewAction === 'request_revision'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500'
                        : 'border-[#e5e5ea] hover:bg-[#f5f5f7]'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Request Revision</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Ask for corrections before releasing funds.
                    </p>
                  </button>
                </div>
              </div>

              {/* Revision details if requesting revision */}
              {reviewAction === 'request_revision' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                    What needs to be revised? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Specify which parts of the solution need clarification or correction..."
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              ) : (
                /* Rating and praise if approving */
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                      Rate the Helper
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <IconStar
                            className={`w-5 h-5 ${
                              star <= reviewRating ? 'text-[#ff9f0a]' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                      Review Feedback
                    </label>
                    <input
                      type="text"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="e.g. Accurate solution, delivered right on time!"
                      className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e5e5ea]">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e5ea] rounded-lg text-xs font-semibold text-[#515154] hover:bg-[#f5f5f7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer text-white disabled:opacity-50 ${
                    reviewAction === 'approve'
                      ? 'bg-[#34c759] hover:bg-[#30b753]'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {submittingReview ? (
                    <span>Processing...</span>
                  ) : reviewAction === 'approve' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Release ₹{selectedAssignmentForReview.bounty.toLocaleString()} Escrow</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Send Revision Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ATTACHMENT / SOLUTION PREVIEW */}
      {/* ========================================================================= */}
      {isAttachmentPreviewOpen && previewAttachment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-4 h-4 text-[#0071e3]" />
                <span className="font-semibold text-xs text-[#1d1d1f] truncate">
                  {previewAttachment.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.name}
                  className="p-1.5 rounded-lg text-[#0071e3] hover:bg-blue-50 transition cursor-pointer"
                  title="Download File"
                >
                  <IconDownload className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setIsAttachmentPreviewOpen(false)}
                  className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
                >
                  <IconClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-[#f5f5f7] max-h-[65vh] overflow-auto flex flex-col items-center justify-center text-center">
              {previewAttachment.url.startsWith('data:image/') ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-96 rounded-lg shadow-sm border border-[#e5e5ea] object-contain"
                />
              ) : previewAttachment.url.startsWith('data:text/') ? (
                <div className="w-full text-left bg-white p-4 rounded-xl border border-[#e5e5ea] font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {(() => {
                    try {
                      const base64Data = previewAttachment.url.split(',')[1];
                      return atob(base64Data);
                    } catch {
                      return 'File content preview unavailable.';
                    }
                  })()}
                </div>
              ) : (
                <div className="py-12 space-y-4">
                  <div className="w-16 h-16 bg-blue-100 text-[#0071e3] rounded-2xl flex items-center justify-center mx-auto">
                    <IconFileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f]">{previewAttachment.name}</h4>
                    <p className="text-xs text-[#86868b] mt-1">
                      Ready to download and inspect.
                    </p>
                  </div>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="inline-flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <IconDownload className="w-4 h-4" />
                    <span>Download File ({previewAttachment.name})</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: COUNTER OFFER PREVIOUS AMOUNT */}
      {/* ========================================================================= */}
      {isCounterModalOpen && selectedAssignmentForCounter && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                  <span>Counter Offer Previous Amount</span>
                </h3>
                <p className="text-xs text-[#86868b] truncate max-w-sm">
                  {selectedAssignmentForCounter.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCounterModalOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCounterOffer} className="p-6 space-y-4">
              {/* Previous Amount Callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-amber-900 block">Previous Amount</span>
                  <span className="text-base font-extrabold text-amber-950">
                    ₹{counterPreviousPrice.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                    {selectedProposalForCounter ? `With ${selectedProposalForCounter.solverName}` : 'Listed Bounty'}
                  </span>
                </div>
              </div>

              {/* Counter Price Input & Quick Adjusters */}
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Your Counter Offer Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 border border-[#e5e5ea] rounded-lg text-sm font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                    placeholder="Enter counter price"
                  />
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setCounterPrice(String(counterPreviousPrice))}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition font-medium"
                  >
                    Reset (₹{counterPreviousPrice})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounterPrice(String(counterPreviousPrice + 50))}
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded cursor-pointer transition font-medium border border-emerald-200"
                  >
                    +₹50
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounterPrice(String(counterPreviousPrice + 100))}
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded cursor-pointer transition font-medium border border-emerald-200"
                  >
                    +₹100
                  </button>
                  {counterPreviousPrice > 50 && (
                    <button
                      type="button"
                      onClick={() => setCounterPrice(String(Math.max(50, counterPreviousPrice - 50)))}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded cursor-pointer transition font-medium border border-amber-200"
                    >
                      -₹50 Discount
                    </button>
                  )}
                </div>
              </div>

              {/* Turnaround Time */}
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Expected Delivery / Turnaround Time
                </label>
                <input
                  type="text"
                  value={counterProposedTime}
                  onChange={(e) => setCounterProposedTime(e.target.value)}
                  placeholder="e.g. Within 12 hours / Tonight"
                  className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* Counter Pitch / Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#1d1d1f]">
                    Reason / Counter Note
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCounterNote(
                        'I can complete this assignment thoroughly with verified unit tests, code comments, and detailed step-by-step PDF report at this proposed rate.'
                      )
                    }
                    className="text-[10px] text-[#0071e3] font-bold hover:underline cursor-pointer"
                  >
                    ⚡ Quick Sample Note
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="Explain your counter proposal..."
                  className="w-full px-3 py-2 border border-[#e5e5ea] rounded-lg text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <IconShield className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>Escrow Protection</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  When this counter offer is accepted, the agreed amount is secured in campus escrow. Payout is released once deliverables are submitted and approved.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e5e5ea]">
                <button
                  type="button"
                  onClick={() => setIsCounterModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e5ea] rounded-lg text-xs font-semibold text-[#515154] hover:bg-[#f5f5f7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCounter}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{submittingCounter ? 'Submitting Counter...' : `Submit Counter Offer (₹${counterPrice || 0})`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: ACCEPT OFFER & WORK (CLAIM MODAL FOR LISTED TAB) */}
      {/* ========================================================================= */}
      {isClaimModalOpen && selectedAssignmentForClaim && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Accept Offer & Start Working</span>
                </h3>
                <p className="text-xs text-[#86868b] truncate max-w-sm">
                  {selectedAssignmentForClaim.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1 rounded-full text-[#86868b] hover:bg-[#f5f5f7] cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Bounty & Escrow Highlight */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide block">
                    Bounty Locked in Escrow
                  </span>
                  <div className="text-2xl font-extrabold text-[#34c759]">
                    ₹{selectedAssignmentForClaim.bounty.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    Guaranteed payout released upon submitting verified solution
                  </span>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs border border-emerald-200">
                  <IconShield className="w-6 h-6 text-[#34c759]" />
                </div>
              </div>

              {/* Assignment Details Brief */}
              <div className="bg-[#f8f9fa] border border-[#e5e5ea] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#86868b]">
                  <span>Subject / Course:</span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {selectedAssignmentForClaim.subject} {selectedAssignmentForClaim.courseCode ? `(${selectedAssignmentForClaim.courseCode})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#86868b]">
                  <span>Posted by:</span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {selectedAssignmentForClaim.studentName} ({selectedAssignmentForClaim.studentCollege || 'Student'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#86868b]">
                  <span>Due Deadline:</span>
                  <span className="font-semibold text-rose-600">
                    {selectedAssignmentForClaim.deadline}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#e5e5ea] text-[#515154]">
                  <p className="line-clamp-3">{selectedAssignmentForClaim.description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={submittingClaim}
                  onClick={() => handleClaimAssignment(selectedAssignmentForClaim)}
                  className="w-full bg-[#34c759] hover:bg-[#2db84d] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {submittingClaim
                      ? 'Accepting Offer & Assigning...'
                      : `Accept Offer & Start Work (₹${selectedAssignmentForClaim.bounty.toLocaleString()})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const asgn = selectedAssignmentForClaim;
                    setIsClaimModalOpen(false);
                    handleOpenCounterOffer(asgn);
                  }}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                  <span>Want a different amount? Counter Offer previous amount</span>
                </button>
              </div>

              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="text-xs text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
