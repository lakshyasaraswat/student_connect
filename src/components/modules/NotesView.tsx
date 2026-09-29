import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Note } from '../../types.ts';
import {
  BookOpen,
  Plus,
  Search,
  Download,
  Eye,
  Star,
  DollarSign,
  ShieldCheck,
  Tag,
  CheckCircle,
  FileText,
  TrendingUp,
  CreditCard,
  MessageSquare
} from '../icons.tsx';

export const NotesView: React.FC = () => {
  const { user, showAlert } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'dashboard'>('browse');

  // Filters
  const [campusFilter, setCampusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [reviewNote, setReviewNote] = useState<Note | null>(null);

  // Seller Dashboard data
  const [sellerDashboard, setSellerDashboard] = useState<any>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('Fall 2025');
  const [professor, setProfessor] = useState('');
  const [examType, setExamType] = useState('Midterm + Final Prep');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState(250);
  const [tags, setTags] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState('');

  // Multiple Preview Pages State
  const [previewPages, setPreviewPages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80'
  ]);
  const [customPreviewUrl, setCustomPreviewUrl] = useState('');

  // Sample page templates for quick preview addition
  const SAMPLE_PREVIEW_TEMPLATES = [
    { label: 'Lecture Summary & Notes', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80' },
    { label: 'Solved Past Exam Questions', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80' },
    { label: 'Formulas & Cheat Sheet', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80' },
    { label: 'Lab & Project Code Guide', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80' }
  ];

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Preview Page Actions
  const handleAddPreviewUrl = () => {
    if (!customPreviewUrl.trim()) return;
    setPreviewPages(prev => [...prev, customPreviewUrl.trim()]);
    setCustomPreviewUrl('');
    showAlert('Preview page added successfully!', 'info');
  };

  const handleRemovePreviewPage = (indexToRemove: number) => {
    setPreviewPages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePreviewFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showAlert('Preview image size should be less than 3MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewPages(prev => [...prev, reader.result as string]);
        showAlert('Preview page image uploaded!', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocName(file.name);
    setFileUrl(`https://campus-notes-storage.internal/files/${file.name}`);
    showAlert(`Notes document "${file.name}" attached successfully.`, 'info');
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (campusFilter !== 'all') params.campusId = campusFilter;
      if (searchTerm) params.search = searchTerm;
      if (subjectFilter) params.subject = subjectFilter;
      if (freeOnly) params.freeOnly = 'true';

      const res = await api.getNotes(params);
      if (res.success) {
        setNotes(res.notes);
      }
    } catch (err) {
      console.warn('Notes fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.getNotesDashboard();
      if (res.success) {
        setSellerDashboard(res.dashboard);
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'browse') {
      fetchNotes();
    } else {
      fetchDashboard();
    }
  }, [campusFilter, activeSubTab, freeOnly]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewPages.length === 0) {
      showAlert('Please provide at least 1 preview page so peers can inspect sample pages.', 'error');
      return;
    }
    try {
      const res = await api.createNote({
        title,
        subject,
        semester,
        professor,
        examType,
        isFree,
        price: isFree ? 0 : Number(price),
        tags,
        previewPages,
        fileUrl: fileUrl || undefined
      });

      if (res.success) {
        showAlert(`"${title}" published with ${previewPages.length} watermarked preview pages!`, 'success');
        setShowUploadModal(false);
        fetchNotes();
        // reset
        setTitle('');
        setSubject('');
        setFileUrl('');
        setUploadedDocName('');
      }
    } catch (err: any) {
      showAlert(err.message || 'Upload failed', 'error');
    }
  };

  const handlePurchaseNote = async (note: Note) => {
    try {
      const res = await api.purchaseNote(note.id);
      if (res.success) {
        showAlert(`Purchased "${note.title}"! Full PDF unlocked for study.`, 'success');
        fetchNotes();
      }
    } catch (err: any) {
      showAlert(err.message || 'Payment failed', 'error');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNote) return;
    try {
      const res = await api.addNoteReview(reviewNote.id, reviewRating, reviewComment);
      if (res.success) {
        showAlert('Review and rating posted!', 'success');
        setReviewNote(null);
        fetchNotes();
      }
    } catch (err: any) {
      showAlert(err.message || 'Review submission failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
              <span>📚 Campus Notes Sharing</span>
              <span>•</span>
              <span>Peer-to-Peer Academic Marketplace</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Buy & Sell Quality Course Notes with Watermark Preview
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Preview the first 2 pages before buying. Monetize your study guides, lecture summaries, and solved exams directly within {user?.collegeName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/20">
              <button
                onClick={() => setActiveSubTab('browse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'browse' ? 'bg-white text-indigo-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => setActiveSubTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === 'dashboard' ? 'bg-white text-indigo-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Seller Dashboard
              </button>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload & Sell Notes
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'browse' ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchNotes()}
                placeholder="Search across all universities by topic, course, professor (e.g. CS161, Algorithms, 6.046J)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">University:</span>
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">🌐 All Universities (Cross-College)</option>
                  <option value="campus_stanford">Stanford University</option>
                  <option value="campus_berkeley">UC Berkeley</option>
                  <option value="campus_mit">MIT</option>
                  <option value="campus_iitd">IIT Delhi</option>
                </select>
              </div>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Free Notes Only</span>
              </label>

              <button
                onClick={fetchNotes}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Notes Grid */}
          {loading ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              Loading campus notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="font-bold text-slate-700 text-base">No notes found for this filter</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Upload your semester notes to help classmates and earn study pocket money!
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Upload Course Notes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {notes.map((note) => {
                const isAuthor = note.sellerId === user?.id;
                const isUnlocked = note.isFree || isAuthor || note.purchasedBy.includes(user?.id || '');

                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Note Card Header with Document Preview Thumbnail */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden group">
                      <img
                        src={note.previewPages[0] || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'}
                        alt={note.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {/* Watermark Overlay for non-purchased paid items */}
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4 text-center">
                          <span className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-white/30 mb-1">
                            WATERMARKED PREVIEW
                          </span>
                          <span className="text-xs font-semibold text-white/90">
                            First 2 pages viewable for free
                          </span>
                        </div>
                      )}

                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-lg shadow-sm ${
                            note.isFree
                              ? 'bg-emerald-500 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {note.isFree ? 'FREE' : `₹${note.price}`}
                        </span>
                      </div>

                      {/* Semester Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                          {note.semester}
                        </span>
                      </div>
                    </div>

                    {/* Note Content Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            {note.subject}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {note.rating} ({note.reviewsCount})
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mt-1.5 leading-snug">
                          {note.title}
                        </h3>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                            🏛️ {note.collegeName || 'Verified University'}
                          </span>
                          {note.collegeName && user?.collegeName && note.collegeName !== user.collegeName && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                              🌐 Cross-Campus
                            </span>
                          )}
                        </div>

                        {note.professor && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Instructor: <span className="font-medium text-slate-700">{note.professor}</span>
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {note.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Seller Profile & Download/Buy Controls */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={note.sellerAvatar}
                            alt={note.sellerName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                            {note.sellerName}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setPreviewNote(note)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Preview Watermark (First 2 Pages)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isUnlocked ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  showAlert(`Downloading original notes PDF for "${note.title}"...`, 'success');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </button>
                              <button
                                onClick={() => setReviewNote(note)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="Rate & Review Notes"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePurchaseNote(note)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Buy (₹{note.price})
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Seller Dashboard */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Notes Seller Dashboard</h2>
              <p className="text-xs text-slate-500">
                Track revenue, sales records, and uploaded study materials.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Upload New Notes
            </button>
          </div>

          {/* Stats Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Total Notes Listed
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {sellerDashboard?.totalNotesListed ?? 0}
              </span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">
                Total Earnings (₹)
              </span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">
                ₹{sellerDashboard?.totalSalesEarnings ?? 0}
              </span>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <span className="text-xs text-indigo-700 font-semibold uppercase tracking-wider block">
                Classmate Purchases
              </span>
              <span className="text-2xl font-black text-indigo-800 mt-1 block">
                {sellerDashboard?.totalPurchasesCount ?? 0}
              </span>
            </div>
          </div>

          {/* Uploaded Notes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Total Sold</th>
                  <th className="py-3 px-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellerDashboard?.notes?.map((n: Note) => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-800 max-w-xs truncate">{n.title}</td>
                    <td className="py-3 px-3 text-slate-600">{n.subject}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{n.isFree ? 'FREE' : `₹${n.price}`}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{n.purchasedBy.length} copies</td>
                    <td className="py-3 px-3 text-amber-600 font-bold">★ {n.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Watermarked Preview Modal (Multi-Page Preview) */}
      {previewNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Watermarked Sample Preview ({previewNote.previewPages?.length || 1} Pages Available)
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">{previewNote.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                    🏛️ {previewNote.collegeName || 'Verified University'}
                  </span>
                  {previewNote.collegeName && user?.collegeName && previewNote.collegeName !== user.collegeName && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                      🌐 Cross-Campus Notes
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Multi-Page Watermark Simulation */}
            <div className="space-y-4 my-4">
              {(previewNote.previewPages && previewNote.previewPages.length > 0
                ? previewNote.previewPages
                : ['https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80']
              ).map((pageUrl, pIdx) => (
                <div key={pIdx} className="relative border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <img
                    src={pageUrl}
                    alt={`Page ${pIdx + 1} Preview`}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="transform -rotate-12 text-2xl font-black text-slate-900/30 tracking-widest select-none border-4 border-slate-900/20 p-4 rounded-xl">
                      STUDENT_CONNECT • PREVIEW
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Preview Page {pIdx + 1} of {previewNote.previewPages?.length || 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-800">
                  Like this preview? Unlock complete full-resolution PDF
                </div>
                <div className="text-slate-500 text-[11px]">
                  Instant access to all solved problem sets and formula cheatsheets.
                </div>
              </div>
              <button
                onClick={() => {
                  handlePurchaseNote(previewNote);
                  setPreviewNote(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                {previewNote.isFree ? 'Download Free' : `Unlock Full Notes (₹${previewNote.price})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Notes Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Upload Study Notes</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg p-2.5 text-xs mt-3 flex items-center justify-between">
              <div>
                <span className="font-bold">Author Campus:</span> {user?.collegeName || 'Verified University'}
              </div>
              <span className="text-[10px] bg-indigo-200/70 text-indigo-800 font-bold px-2 py-0.5 rounded">
                🌐 Cross-College Enabled
              </span>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CS161 Algorithms Complete Midterm Formula & Proofs"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject / Course Code *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Algorithms"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester *</label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. Fall 2025"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Professor (Optional)</label>
                  <input
                    type="text"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="e.g. Prof. Roughgarden"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Type</label>
                  <input
                    type="text"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    placeholder="e.g. Midterm + Finals"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 1. File Attachment Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">1. Attach Full Notes Document (PDF/Doc)</span>
                  {uploadedDocName && (
                    <span className="text-[11px] text-emerald-600 font-semibold truncate max-w-[180px]">
                      ✓ {uploadedDocName}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-medium cursor-pointer shadow-2xs transition flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-indigo-600 rotate-180" />
                    <span>Choose Notes Document File</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg"
                      onChange={handleDocumentFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">PDF, DOCX up to 25MB</span>
                </div>
              </div>

              {/* 2. Preview Pages Section */}
              <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-950 block">2. Add Watermarked Preview Pages</span>
                    <span className="text-[11px] text-slate-600 block">
                      Add sample pages that peers can preview for free before purchasing.
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    {previewPages.length} {previewPages.length === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>

                {/* Upload or Add URL Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-lg font-bold cursor-pointer transition shadow-2xs flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Page Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePreviewFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customPreviewUrl}
                    onChange={(e) => setCustomPreviewUrl(e.target.value)}
                    placeholder="Or paste page image URL (https://...)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreviewUrl}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer transition shrink-0"
                  >
                    Add Page
                  </button>
                </div>

                {/* Sample Templates Quick-Add */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Quick Sample Page Templates:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PREVIEW_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.label}
                        type="button"
                        onClick={() => {
                          setPreviewPages(prev => [...prev, tmpl.url]);
                          showAlert(`Added "${tmpl.label}" preview page!`, 'info');
                        }}
                        className="text-[11px] bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100/50 px-2 py-1 rounded-md transition cursor-pointer font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-indigo-500" />
                        <span>{tmpl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Pages Thumbnail List */}
                {previewPages.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100">
                    <div className="text-[11px] font-bold text-slate-700 mb-2">
                      Attached Preview Pages (Watermark Applied Automatically):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {previewPages.map((pageUrl, idx) => (
                        <div key={idx} className="relative group border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                          <img
                            src={pageUrl}
                            alt={`Preview Page ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Page {idx + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePreviewPage(idx)}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer shadow-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Free Option */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-bold text-slate-800">Share as Free Notes</span>
                </label>

                {!isFree && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      placeholder="e.g. 250"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. CS161, Algorithms, Dynamic Programming, Cheatsheet"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  Upload & Publish Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Rate & Review Notes</h3>
              <button onClick={() => setReviewNote(null)} className="text-slate-400 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Comment</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How did these notes help you study?"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewNote(null)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg"
                >
                  Post Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
