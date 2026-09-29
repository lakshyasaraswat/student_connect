import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { RoommatePost } from '../../types.ts';
import {
  Home,
  Plus,
  Search,
  Sparkles,
  MessageSquare,
  DollarSign,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle,
  Clock,
  HeartHandshake
} from '../icons.tsx';
import { Compass, ExternalLink, Navigation, MapPin, Trash2 } from 'lucide-react';

export const RoommateView: React.FC = () => {
  const { user, openChat, showAlert, openAIAssistant } = useAuth();
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [myPost, setMyPost] = useState<RoommatePost | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [breakdownPost, setBreakdownPost] = useState<RoommatePost | null>(null);

  // Form
  const [userGender, setUserGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [budgetMin, setBudgetMin] = useState(5000);
  const [budgetMax, setBudgetMax] = useState(12000);
  const [preferredLocation, setPreferredLocation] = useState('Near Campus / Student Hub');
  const [mapsUrl, setMapsUrl] = useState('');
  const [preferredGender, setPreferredGender] = useState<'Male' | 'Female' | 'Any'>('Female');
  const [smoking, setSmoking] = useState<'Non-Smoker' | 'Smoker' | 'Flexible'>('Non-Smoker');
  const [food, setFood] = useState<'Vegetarian' | 'Non-Vegetarian' | 'Any'>('Vegetarian');
  const [sleepSchedule, setSleepSchedule] = useState<'Early Bird (before 11 PM)' | 'Night Owl (after 1 AM)' | 'Flexible'>('Night Owl (after 1 AM)');
  const [cleanliness, setCleanliness] = useState<'Extremely Clean' | 'Moderate' | 'Relaxed'>('Extremely Clean');
  const [studyHabit, setStudyHabit] = useState<'Quiet Study' | 'Music / Background noise' | 'Group Study'>('Quiet Study');
  const [bio, setBio] = useState('');

  const fetchRoommates = async () => {
    try {
      setLoading(true);
      const res = await api.getRoommates();
      if (res.success) {
        setPosts(res.roommates);
        if (res.myPost) {
          setMyPost(res.myPost);
          // populate form defaults from myPost
          setBudgetMin(res.myPost.budgetMin);
          setBudgetMax(res.myPost.budgetMax);
          setPreferredLocation(res.myPost.preferredLocation);
          setMapsUrl(res.myPost.mapsUrl || '');
          setSmoking(res.myPost.preferences.smoking);
          setFood(res.myPost.preferences.food);
          setSleepSchedule(res.myPost.preferences.sleepSchedule);
          setCleanliness(res.myPost.preferences.cleanliness);
          setStudyHabit(res.myPost.preferences.studyHabit);
          setBio(res.myPost.bio);
        }
      }
    } catch (err) {
      console.warn('Roommates fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, [user?.campusId]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createRoommatePost({
        userGender,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        preferredLocation,
        mapsUrl: mapsUrl.trim() || undefined,
        preferences: {
          preferredGender,
          smoking,
          food,
          sleepSchedule,
          cleanliness,
          studyHabit
        },
        bio
      });

      if (res.success) {
        showAlert('Roommate profile saved! AI compatibility matching is now active.', 'success');
        setShowPostModal(false);
        fetchRoommates();
      }
    } catch (err: any) {
      showAlert(err.message || 'Post failed', 'error');
    }
  };

  const handleDeleteRoommatePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this roommate listing?')) return;
    try {
      const res = await api.deleteRoommatePost(postId);
      if (res.success) {
        showAlert('Roommate listing deleted successfully.', 'success');
        if (myPost?.id === postId) {
          setMyPost(null);
        }
        fetchRoommates();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete roommate listing', 'error');
    }
  };

  const handleToggleStatus = async (post: RoommatePost) => {
    try {
      const newStatus = post.status === 'looking' ? 'found' : 'looking';
      const res = await api.updateRoommateStatus(post.id, newStatus);
      if (res.success) {
        showAlert(`Status set to '${newStatus}'.`, 'info');
        fetchRoommates();
      }
    } catch (err: any) {
      showAlert(err.message || 'Update failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-700 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-200 text-xs font-semibold uppercase tracking-wider">
              <span>🏠 Roommate Compatibility Finder</span>
              <span>•</span>
              <span>Smart Habit & Budget Matching</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Find Verified Classmates for Off-Campus Flats & Dorms
            </h1>
            <p className="text-rose-100 text-sm mt-1 max-w-xl">
              Match with peers based on sleep schedules, cleanliness, dietary habits, study preferences, and budget overlap. Direct campus-locked chat.
            </p>
          </div>

          <button
            onClick={() => setShowPostModal(true)}
            className="bg-white hover:bg-rose-50 text-rose-900 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-600" />
            {myPost ? 'Edit My Roommate Profile' : 'Post Roommate Request'}
          </button>
        </div>
      </div>

      {/* My Roommate Profile Banner if exists */}
      {myPost && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-rose-200 text-rose-800 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-rose-950">
                Your Roommate Profile is Active ({myPost.status === 'looking' ? 'Looking for Flatmates' : 'Roommate Found'})
              </div>
              <div className="text-rose-700 text-[11px] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Budget: ₹{myPost.budgetMin.toLocaleString()} - ₹{myPost.budgetMax.toLocaleString()}</span>
                <span>•</span>
                <span>{myPost.preferredLocation}</span>
                {myPost.mapsUrl && (
                  <a
                    href={myPost.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 underline font-medium"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Google Maps</span>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={() =>
                openChat(
                  `roommate_${myPost.id}`,
                  `Roommate Chat: ${myPost.userName}`,
                  'Your Roommate Post Inquiries & Chat'
                )
              }
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Open your roommate chat room"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Roommate Chat</span>
            </button>
            <button
              onClick={() => handleToggleStatus(myPost)}
              className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 rounded-lg font-bold hover:bg-rose-100 transition cursor-pointer"
            >
              Mark as {myPost.status === 'looking' ? 'Found ✓' : 'Looking 🔍'}
            </button>
            <button
              onClick={() => setShowPostModal(true)}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteRoommatePost(myPost.id)}
              className="p-1.5 border border-rose-300 bg-white hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer"
              title="Delete your roommate post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Google Maps Roommate Neighborhoods & Commute Match Hub */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-rose-950 text-white p-4 rounded-xl shadow-sm border border-purple-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Compass className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white">Google Maps Roommate Neighborhood Advisor</span>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-semibold border border-purple-400/30">
                  Maps Grounded
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Discover student corridors, commute walking scores, and pair with flatmates moving to the same area around <span className="text-purple-300 font-semibold">{user?.collegeName || 'campus'}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Student residential neighborhoods cafes near ${user?.collegeName || 'campus'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span>Explore Neighborhoods ↗</span>
            </a>
            <button
              onClick={() =>
                openAIAssistant(
                  'roommate',
                  `Recommend top student neighborhoods, street corridors, and housing areas for matching roommates near ${user?.collegeName || 'campus'}`
                )
              }
              className="bg-purple-500 hover:bg-purple-600 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Neighborhood Match</span>
            </button>
          </div>
        </div>

        {/* Quick Area Filter Chips */}
        <div className="mt-3 pt-3 border-t border-purple-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] text-purple-300/80 font-medium shrink-0">Student Housing Corridors:</span>
          {[
            { name: 'College Terrace Corridor', query: `College Terrace student housing near ${user?.collegeName || 'University'}` },
            { name: 'Medical Center / West Campus', query: `Medical Center student apartments near ${user?.collegeName || 'University'}` },
            { name: 'University Ave & Downtown', query: `Downtown student cafes flats near ${user?.collegeName || 'University'}` }
          ].map((area, idx) => (
            <a
              key={idx}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-purple-200 px-2.5 py-1 rounded-md border border-purple-500/20 whitespace-nowrap flex items-center gap-1 transition shrink-0"
            >
              <MapPin className="w-2.5 h-2.5 text-purple-400" />
              <span>{area.name}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          ))}
        </div>
      </div>

      {/* Roommates Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Potential Roommate Matches</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
              {posts.length}
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            Sorted by <strong className="text-rose-700">AI Compatibility Score</strong>
          </span>
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
            Calculating roommate compatibility scores...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
            <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="font-bold text-slate-700 text-base">No roommate posts found</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Post your lifestyle habits and budget to let AI match you with prospective roommates!
            </p>
            <button
              onClick={() => setShowPostModal(true)}
              className="mt-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
            >
              Post Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => {
              const isMe = Boolean(
                (user?.id && post.userId === user.id) ||
                ((user as any)?.userId && post.userId === (user as any).userId) ||
                (user?.name && post.userName && user.name.trim().toLowerCase() === post.userName.trim().toLowerCase())
              );
              const score = post.compatibilityScore ?? 85;

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.userAvatar}
                          alt={post.userName}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/20"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                            {post.userName}
                            {isMe && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                                Your Post
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {post.course} • {post.year}
                          </div>
                        </div>
                      </div>

                      {/* Compatibility Badge */}
                      <button
                        onClick={() => setBreakdownPost(post)}
                        className={`text-right p-1.5 rounded-xl border transition cursor-pointer ${
                          score >= 90
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : score >= 75
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                        title="Click to view match breakdown"
                      >
                        <div className="flex items-center gap-1 font-black text-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          {score}%
                        </div>
                        <span className="text-[9px] font-bold block uppercase tracking-tight">
                          Match Score
                        </span>
                      </button>
                    </div>

                    {/* Bio */}
                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{post.bio}"
                    </p>

                    {/* Preferences Matrix */}
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">BUDGET</span>
                        <span className="font-bold text-slate-800">₹{post.budgetMin.toLocaleString()} - ₹{post.budgetMax.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">LOCATION</span>
                        <a
                          href={post.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${post.preferredLocation} near ${user?.collegeName || 'University'}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-rose-700 hover:underline truncate flex items-center gap-1"
                          title={post.mapsUrl ? "Open PG/Flat Location on Google Maps" : "View on Google Maps"}
                        >
                          <span className="truncate">{post.preferredLocation}</span>
                          {post.mapsUrl ? <Navigation className="w-2.5 h-2.5 text-blue-600 shrink-0" /> : <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />}
                        </a>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">SLEEP SCHEDULE</span>
                        <span className="font-medium text-slate-700 truncate block">{post.preferences.sleepSchedule}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">CLEANLINESS</span>
                        <span className="font-medium text-slate-700">{post.preferences.cleanliness}</span>
                      </div>
                    </div>

                    {/* Habit Pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {post.preferences.smoking}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {post.preferences.food}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {post.preferences.studyHabit}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${
                        post.status === 'looking'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {post.status === 'looking' ? 'Active Search' : 'Matched'}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setBreakdownPost(post)}
                        className="px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg font-semibold transition cursor-pointer"
                      >
                        Breakdown
                      </button>

                      <button
                        onClick={() =>
                          openChat(
                            `roommate_${post.id}`,
                            `Roommate Chat: ${post.userName}`,
                            isMe
                              ? 'Your Roommate Post Inquiries & Chat'
                              : `${post.course} • Budget: ₹${post.budgetMin.toLocaleString()}-${post.budgetMax.toLocaleString()}`
                          )
                        }
                        className={`${
                          isMe ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                        } text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs`}
                        title={isMe ? 'Open your Roommate Inquiries & Chat' : `Chat with ${post.userName}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isMe ? 'My Inquiries & Chat' : 'Chat'}</span>
                      </button>

                      {user && (post.userId === user.id || user.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteRoommatePost(post.id)}
                          className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete your roommate post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Match Breakdown Modal */}
      {breakdownPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Compatibility Analysis</h3>
                <div className="text-xs text-slate-500">
                  Comparing with {breakdownPost.userName} ({breakdownPost.compatibilityScore}% Match)
                </div>
              </div>
              <button onClick={() => setBreakdownPost(null)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {breakdownPost.compatibilityBreakdown?.map((cat, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{cat.category}</span>
                    <span className={cat.match ? 'text-emerald-700' : 'text-slate-500'}>
                      {cat.points} / {cat.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cat.match ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${(cat.points / cat.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-rose-900 text-[11px] leading-relaxed">
                ✨ <strong>Roommate Tip:</strong> High compatibility in sleep schedule and cleanliness predicts 90%+ roommate satisfaction across campus dormitories.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBreakdownPost(null)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = breakdownPost;
                    const isTargetMe = Boolean(
                      (user?.id && target.userId === user.id) ||
                      ((user as any)?.userId && target.userId === (user as any).userId) ||
                      (user?.name && target.userName && user.name.trim().toLowerCase() === target.userName.trim().toLowerCase())
                    );
                    setBreakdownPost(null);
                    openChat(
                      `roommate_${target.id}`,
                      `Roommate Chat: ${target.userName}`,
                      isTargetMe
                        ? 'Your Roommate Post Inquiries & Chat'
                        : `${target.course} • Budget: ₹${target.budgetMin.toLocaleString()}-${target.budgetMax.toLocaleString()}`
                    );
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5 text-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {(user?.id && breakdownPost.userId === user.id) || ((user as any)?.userId && breakdownPost.userId === (user as any).userId)
                      ? 'Open My Inquiries & Chat'
                      : 'Start Conversation'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Roommate Preferences Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Roommate Preferences</h3>
              </div>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Gender</label>
                  <select
                    value={userGender}
                    onChange={(e) => setUserGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Non-Binary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Roommate Gender</label>
                  <select
                    value={preferredGender}
                    onChange={(e) => setPreferredGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Female">Female Roommate</option>
                    <option value="Male">Male Roommate</option>
                    <option value="Any">Any Gender</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Budget Min (₹ / mo)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    placeholder="e.g. 5000"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Budget Max (₹ / mo)</label>
                  <input
                    type="number"
                    min="1500"
                    required
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    placeholder="e.g. 10000"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Location / Area</label>
                <input
                  type="text"
                  required
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  placeholder="e.g. Menlo Park / Near Medical Center / North Campus"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Google Maps Link of PG / Flat / Area (Optional)
                </label>
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
                <span className="text-[10px] text-slate-400">
                  Paste the Google Maps share link of the PG, flat, or preferred campus neighborhood
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sleep Schedule</label>
                  <select
                    value={sleepSchedule}
                    onChange={(e) => setSleepSchedule(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Early Bird (before 11 PM)">Early Bird (before 11 PM)</option>
                    <option value="Night Owl (after 1 AM)">Night Owl (after 1 AM)</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cleanliness</label>
                  <select
                    value={cleanliness}
                    onChange={(e) => setCleanliness(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Extremely Clean">Extremely Clean</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Relaxed">Relaxed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diet / Food</label>
                  <select
                    value={food}
                    onChange={(e) => setFood(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Any">Any Diet</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Smoking</label>
                  <select
                    value={smoking}
                    onChange={(e) => setSmoking(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Non-Smoker">Non-Smoker</option>
                    <option value="Smoker">Smoker</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bio / Personal Habits</label>
                <textarea
                  required
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. 2nd year CS master's student. Quiet during weekdays, love cooking on weekends."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Profile & Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
