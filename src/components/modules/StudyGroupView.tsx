import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { StudyGroup } from '../../types.ts';
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  MapPin,
  FileText,
  Lock,
  Globe,
  Trash2,
  Clock,
  Check,
  X,
  ShieldCheck,
  Send
} from 'lucide-react';

export const StudyGroupView: React.FC = () => {
  const { user, openChat, showAlert } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Private group request state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedGroupForRequest, setSelectedGroupForRequest] = useState<StudyGroup | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showManageRequestsModal, setShowManageRequestsModal] = useState(false);
  const [managingGroup, setManagingGroup] = useState<StudyGroup | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New Group Form
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(8);
  const [type, setType] = useState<'public' | 'private'>('public');
  const [locationType, setLocationType] = useState<'Campus Library' | 'Hostel Common Room' | 'Lab' | 'Online'>('Campus Library');

  // New Resource Form
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState<'pdf' | 'link' | 'code' | 'doc'>('pdf');

  // New Schedule Form
  const [schedTopic, setSchedTopic] = useState('');
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedTime, setSchedTime] = useState('06:00 PM');
  const [schedLoc, setSchedLoc] = useState('Green Library 2nd Floor Room 204');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      const res = await api.getStudyGroups(params);
      if (res.success) {
        setGroups(res.groups);
        // Keep the managing group fresh if the modal is open
        if (managingGroup) {
          const fresh = res.groups.find((g: StudyGroup) => g.id === managingGroup.id);
          if (fresh) setManagingGroup(fresh);
        }
      }
    } catch (err) {
      console.warn('Study groups fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user?.campusId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createStudyGroup({
        name,
        subject,
        topic,
        description,
        maxMembers: Number(maxMembers),
        type,
        locationType
      });

      if (res.success) {
        showAlert(
          type === 'private'
            ? 'Private study squad created! Classmates must request permission before entering.'
            : 'New public study group created! Classmates can now join directly.',
          'success'
        );
        setShowCreateModal(false);
        fetchGroups();
        setName('');
        setSubject('');
        setTopic('');
        setDescription('');
        setType('public');
      }
    } catch (err: any) {
      showAlert(err.message || 'Creation failed', 'error');
    }
  };

  // Public group: instant join
  const handleJoinPublic = async (groupId: string) => {
    try {
      const res = await api.joinStudyGroup(groupId);
      if (res.success) {
        showAlert('Joined study group successfully!', 'success');
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to join group', 'error');
    }
  };

  // Private group: send permission request
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForRequest) return;
    try {
      setActionLoading(true);
      const res = await api.joinStudyGroup(selectedGroupForRequest.id, {
        message: requestMessage.trim() || 'Requesting permission to enter private study squad.'
      });

      if (res.success) {
        showAlert(
          res.message || 'Permission requested! The group creator has been notified.',
          'success'
        );
        setShowRequestModal(false);
        setSelectedGroupForRequest(null);
        setRequestMessage('');
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to send join request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel pending request
  const handleCancelRequest = async (groupId: string) => {
    try {
      const res = await api.cancelStudyGroupRequest(groupId);
      if (res.success) {
        showAlert('Join request cancelled.', 'info');
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Action failed', 'error');
    }
  };

  // Creator approves/rejects
  const handleRespondRequest = async (groupId: string, requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      const res = await api.respondToStudyGroupRequest(groupId, requestId, action);
      if (res.success) {
        showAlert(res.message, action === 'approve' ? 'success' : 'info');
        if (res.group) setManagingGroup(res.group);
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async (groupId: string) => {
    try {
      const res = await api.leaveStudyGroup(groupId);
      if (res.success) {
        showAlert('Left study group.', 'info');
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Action failed', 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${groupName}"?`)) return;
    try {
      const res = await api.deleteStudyGroup(groupId);
      if (res.success) {
        showAlert('Study group deleted successfully.', 'success');
        if (selectedGroup?.id === groupId) setSelectedGroup(null);
        if (managingGroup?.id === groupId) {
          setShowManageRequestsModal(false);
          setManagingGroup(null);
        }
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete group', 'error');
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      const res = await api.addStudyResource(selectedGroup.id, {
        title: resTitle,
        url: resUrl,
        type: resType
      });
      if (res.success) {
        showAlert('Shared resource added!', 'success');
        setShowResourceModal(false);
        setResTitle('');
        setResUrl('');
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to add resource', 'error');
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      const res = await api.addStudySchedule(selectedGroup.id, {
        topic: schedTopic,
        date: schedDate,
        time: schedTime,
        location: schedLoc
      });
      if (res.success) {
        showAlert('Study session scheduled!', 'success');
        setShowScheduleModal(false);
        setSchedTopic('');
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to schedule', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-200 text-xs font-semibold uppercase tracking-wider">
              <span>📖 Collaborative Group Study</span>
              <span>•</span>
              <span>Public Squads & Private Permission Pods</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Study Together, Ace Midterms, Share Resources
            </h1>
            <p className="text-purple-100 text-sm mt-1 max-w-xl">
              Create exam prep pods, schedule study meetups, and collaborate in real-time. Private groups enforce permission verification before granting entry.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white hover:bg-purple-50 text-purple-900 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            Create Study Group
          </button>
        </div>
      </div>

      {/* Search Bar & Privacy Legend */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGroups()}
            placeholder="Search study groups by course or topic..."
            className="w-full px-2 py-1 text-xs focus:outline-none"
          />
          <button
            onClick={fetchGroups}
            className="bg-slate-900 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-100 shrink-0">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <Globe className="w-3.5 h-3.5 text-emerald-600" /> Public (Instant Entry)
          </span>
          <span className="flex items-center gap-1 text-amber-700 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-600" /> Private (Permission Required)
          </span>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
          Loading campus study groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="font-bold text-slate-700 text-base">No study groups found</div>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Form a study group with classmates preparing for the upcoming semester exams.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Start a Study Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((grp) => {
            const isMember = grp.isMember ?? grp.members.some((m) => m.userId === user?.id);
            const isCreator = grp.isCreator ?? (user ? (grp.creatorId === user.id || user.role === 'admin') : false);
            const pendingRequests = grp.joinRequests?.filter((r) => r.status === 'pending') || [];
            const userPendingRequest = grp.joinRequests?.find(
              (r) => r.userId === user?.id && r.status === 'pending'
            );

            return (
              <div
                key={grp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-100">
                          {grp.subject}
                        </span>
                        {grp.type === 'public' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                            <Globe className="w-3 h-3 text-emerald-600" />
                            <span>Public</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Private (Approval Needed)</span>
                          </span>
                        )}
                        {isMember && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded">
                            <span>✓ Enrolled</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{grp.name}</h3>
                      <div className="text-xs text-slate-500 font-medium">Topic: {grp.topic}</div>
                    </div>

                    <div className="text-right flex items-center gap-2.5">
                      <div>
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {grp.members.length} / {grp.maxMembers}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Members</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {grp.description}
                  </p>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      {grp.locationType}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Created by <strong className="text-slate-700">{grp.creatorName}</strong>
                    </span>
                  </div>

                  {/* Creator/Admin Pending Requests Banner */}
                  {isCreator && grp.type === 'private' && (
                    <div
                      className={`mt-3 p-2.5 rounded-lg border text-xs flex items-center justify-between ${pendingRequests.length > 0
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <ShieldCheck
                          className={`w-4 h-4 ${pendingRequests.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-500'
                            }`}
                        />
                        <span>
                          {pendingRequests.length > 0 ? (
                            <>
                              <strong className="text-amber-900">{pendingRequests.length} Student{pendingRequests.length > 1 ? 's' : ''}</strong> requested permission to enter
                            </>
                          ) : (
                            'Private Pod: You review and approve member entries'
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setManagingGroup(grp);
                          setShowManageRequestsModal(true);
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer ${pendingRequests.length > 0
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                      >
                        {pendingRequests.length > 0 ? 'Review & Approve' : 'Manage Requests'}
                      </button>
                    </div>
                  )}

                  {/* Non-Member Private Group Notice */}
                  {grp.type === 'private' && !isMember && (
                    <div className="mt-3 bg-amber-50/50 border border-amber-200/80 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Private Group Vault & Internal Discussions</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Course documents, internal study sessions, and live group chat are locked. You must request permission from <strong>{grp.creatorName}</strong> to be granted entry.
                      </p>
                    </div>
                  )}

                  {/* Scheduled Session (visible to members or public groups) */}
                  {(isMember || grp.type === 'public') && grp.schedule.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Upcoming Study Session</span>
                        {isMember && (
                          <button
                            onClick={() => {
                              setSelectedGroup(grp);
                              setShowScheduleModal(true);
                            }}
                            className="text-purple-600 hover:underline font-bold cursor-pointer"
                          >
                            + Schedule
                          </button>
                        )}
                      </div>
                      <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-xs space-y-0.5">
                        <div className="font-bold text-purple-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          {grp.schedule[0].topic}
                        </div>
                        <div className="text-[11px] text-purple-800">
                          {grp.schedule[0].date} at {grp.schedule[0].time} • {grp.schedule[0].location}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resources (visible to members or public groups) */}
                  {(isMember || grp.type === 'public') && (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Shared Resources ({grp.resources.length})</span>
                        {isMember && (
                          <button
                            onClick={() => {
                              setSelectedGroup(grp);
                              setShowResourceModal(true);
                            }}
                            className="text-purple-600 hover:underline font-bold cursor-pointer"
                          >
                            + Add File
                          </button>
                        )}
                      </div>
                      {grp.resources.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic">No resources uploaded yet.</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {grp.resources.slice(0, 3).map((r) => (
                            <a
                              key={r.id}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1 transition"
                            >
                              <FileText className="w-3 h-3 text-purple-600" />
                              <span className="truncate max-w-[120px]">{r.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members Avatars & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {grp.members.map((m) => (
                        <img
                          key={m.userId}
                          src={m.avatar}
                          alt={m.name}
                          title={m.name}
                          className="w-6 h-6 rounded-full ring-2 ring-white object-cover"
                        />
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Chat (members only) */}
                      {isMember && (
                        <button
                          onClick={() =>
                            openChat(`group_${grp.id}`, `Group Chat: ${grp.name}`, `${grp.subject} • ${grp.members.length} members`)
                          }
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Open Group Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          Chat
                        </button>
                      )}

                      {isMember ? (
                        <button
                          onClick={() => handleLeave(grp.id)}
                          className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 cursor-pointer"
                        >
                          Leave
                        </button>
                      ) : grp.type === 'private' ? (
                        userPendingRequest ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="bg-amber-100/90 text-amber-900 border border-amber-300 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs"
                              title="Waiting for group creator approval"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                              <span>Request Pending Approval</span>
                            </span>
                            <button
                              onClick={() => handleCancelRequest(grp.id)}
                              className="text-[11px] text-slate-400 hover:text-rose-600 hover:underline px-1 py-1 cursor-pointer"
                              title="Cancel your pending request"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedGroupForRequest(grp);
                              setRequestMessage('');
                              setShowRequestModal(true);
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                            title="Private group: request permission to enter"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Request Permission</span>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleJoinPublic(grp.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs"
                        >
                          Join Squad
                        </button>
                      )}

                      {/* Delete (creator or admin) */}
                      {isCreator && (
                        <button
                          onClick={() => handleDeleteGroup(grp.id, grp.name)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Delete study group (creator only)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
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

      {/* ─── CREATE GROUP MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Create Study Group</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Distributed Systems Lab Prep Squad"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject / Course</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. CS244B"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Raft Consensus & Paxos"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Goal / Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Weekly problem set walkthroughs and whiteboard reviews."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Members</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meeting Place</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Campus Library">Campus Library</option>
                    <option value="Hostel Common Room">Hostel Common Room</option>
                    <option value="Lab">Computer Lab</option>
                    <option value="Online">Online Video Call</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Privacy Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="public">🌐 Public (Open to All)</option>
                    <option value="private">🔒 Private (Permission Required)</option>
                  </select>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${type === 'private'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
              >
                {type === 'private' ? (
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Private Squad: Permission to Enter Required</strong>
                      Other students cannot directly join. They must submit a join request with a note, and you (as creator) can approve or decline entry.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Public Squad: Instant Campus Access</strong>
                      Any student on your campus can immediately join the squad without requiring manual approval.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs cursor-pointer">
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REQUEST PERMISSION MODAL ─── */}
      {showRequestModal && selectedGroupForRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">Request Permission to Enter</h3>
                  <p className="text-[11px] text-slate-500">Private Study Group • Creator Approval Required</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedGroupForRequest(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 text-xs">{selectedGroupForRequest.name}</div>
              <div className="text-[11px] text-purple-700 font-semibold">
                {selectedGroupForRequest.subject} • {selectedGroupForRequest.topic}
              </div>
              <div className="text-[11px] text-slate-500">
                Group Creator: <strong className="text-slate-700">{selectedGroupForRequest.creatorName}</strong>
              </div>
            </div>

            <form onSubmit={handleSendRequest} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Introduce yourself or add a note for the creator:
                </label>
                <textarea
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="e.g. Hi! I'm taking this course this quarter and working on the problem sets. Would love to join the study sessions."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The group creator ({selectedGroupForRequest.creatorName}) will receive an in-app notification to review and approve your entry.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedGroupForRequest(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Sending Request...' : 'Send Request to Enter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MANAGE JOIN REQUESTS MODAL (Creator) ─── */}
      {showManageRequestsModal && managingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">Member Requests & Permissions</h3>
                  <p className="text-[11px] text-slate-500">{managingGroup.name} (Private Group)</p>
                </div>
              </div>
              <button onClick={() => setShowManageRequestsModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Pending Entry Requests ({managingGroup.joinRequests?.filter((r) => r.status === 'pending').length || 0})
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Capacity: {managingGroup.members.length} / {managingGroup.maxMembers}
                  </span>
                </div>

                {!managingGroup.joinRequests || managingGroup.joinRequests.filter((r) => r.status === 'pending').length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">No pending join requests</p>
                    <p className="text-[11px]">When classmates request permission, their details will appear here for your review.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {managingGroup.joinRequests
                      .filter((r) => r.status === 'pending')
                      .map((req) => (
                        <div key={req.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={req.userAvatar}
                                alt={req.userName}
                                className="w-9 h-9 rounded-full object-cover border border-amber-300 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{req.userName}</div>
                                <div className="text-[10px] text-slate-500">
                                  {req.course || 'Student'} • {req.userCollege || 'Campus'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Requested {new Date(req.requestedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleRespondRequest(managingGroup.id, req.id, 'approve')}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRespondRequest(managingGroup.id, req.id, 'reject')}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                <span>Decline</span>
                              </button>
                            </div>
                          </div>
                          {req.message && (
                            <div className="text-[11px] bg-white p-2 rounded-lg border border-amber-100 text-slate-700 italic">
                              "{req.message}"
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Active Enrolled Members ({managingGroup.members.length})
                </div>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  {managingGroup.members.map((m) => (
                    <div key={m.userId} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <span className="font-semibold text-slate-900">{m.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            Joined {new Date(m.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {m.role === 'admin' ? 'Admin / Creator' : 'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManageRequestsModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD RESOURCE MODAL ─── */}
      {showResourceModal && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Share Resource to {selectedGroup.name}</h3>
              <button onClick={() => setShowResourceModal(false)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. Midterm 2024 Solution Key"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Link / Cloud Document URL</label>
                <input
                  type="text"
                  required
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="code">GitHub / Code Repo</option>
                  <option value="link">Web Article / Cheatsheet</option>
                  <option value="doc">Notes Document</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowResourceModal(false)} className="px-4 py-2 border rounded-lg text-slate-600 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-xs cursor-pointer">
                  Upload Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SCHEDULE MODAL ─── */}
      {showScheduleModal && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Schedule Study Session</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Agenda / Topic</label>
                <input
                  type="text"
                  required
                  value={schedTopic}
                  onChange={(e) => setSchedTopic(e.target.value)}
                  placeholder="e.g. Chapter 4 Practice Exam Review"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Meeting Room</label>
                <input
                  type="text"
                  required
                  value={schedLoc}
                  onChange={(e) => setSchedLoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border rounded-lg text-slate-600 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-xs cursor-pointer">
                  Add to Group Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};