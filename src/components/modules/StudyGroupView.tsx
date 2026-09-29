import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { StudyGroup } from '../../types.ts';
import { Trash2 } from 'lucide-react';
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  BookOpen,
  Calendar,
  MapPin,
  FileText,
  Link2,
  Lock,
  Globe,
  CheckCircle,
  Share2
} from '../icons.tsx';

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
        showAlert('New study group created! Classmates can now join.', 'success');
        setShowCreateModal(false);
        fetchGroups();
        // reset
        setName('');
        setSubject('');
        setTopic('');
      }
    } catch (err: any) {
      showAlert(err.message || 'Creation failed', 'error');
    }
  };

  const handleJoin = async (groupId: string) => {
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
    if (!window.confirm(`Are you sure you want to permanently delete the study group "${groupName}"? This will disband the squad for all members.`)) {
      return;
    }
    try {
      const res = await api.deleteStudyGroup(groupId);
      if (res.success) {
        showAlert('Study group deleted successfully.', 'success');
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
        }
        fetchGroups();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete study group', 'error');
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
        showAlert('Shared resource added to group vault!', 'success');
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
        showAlert('Study session added to group calendar!', 'success');
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
              <span>Shared Resource Vault & Group Sockets</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Study Together, Ace Midterms, Share Resources
            </h1>
            <p className="text-purple-100 text-sm mt-1 max-w-xl">
              Create exam prep pods, schedule study meetups in campus libraries or online, and collaborate in real-time with peers from your department.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white hover:bg-purple-50 text-purple-900 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            Create Study Group
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchGroups()}
          placeholder="Search study groups by course or topic (e.g. Distributed Systems, Machine Learning)..."
          className="w-full px-2 py-1 text-xs focus:outline-none"
        />
        <button
          onClick={fetchGroups}
          className="bg-slate-900 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          Search
        </button>
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
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            Start a Study Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((grp) => {
            const isMember = grp.members.some((m) => m.userId === user?.id);
            const isCreator = user ? (grp.creatorId === user.id || user.role === 'admin') : false;

            return (
              <div
                key={grp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-100">
                          {grp.subject}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          {grp.type === 'public' ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <Globe className="w-3 h-3" /> Public
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <Lock className="w-3 h-3" /> Private
                            </span>
                          )}
                        </span>
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
                      {isCreator && (
                        <button
                          onClick={() => handleDeleteGroup(grp.id, grp.name)}
                          className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete Study Group (Creator Only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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

                  {/* Scheduled Study Sessions */}
                  {grp.schedule.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Upcoming Study Session</span>
                        {isMember && (
                          <button
                            onClick={() => {
                              setSelectedGroup(grp);
                              setShowScheduleModal(true);
                            }}
                            className="text-purple-600 hover:underline font-bold"
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

                  {/* Shared Resources */}
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Shared Resources ({grp.resources.length})</span>
                      {isMember && (
                        <button
                          onClick={() => {
                            setSelectedGroup(grp);
                            setShowResourceModal(true);
                          }}
                          className="text-purple-600 hover:underline font-bold"
                        >
                          + Add File
                        </button>
                      )}
                    </div>
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
                  </div>

                  {/* Members Avatars */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
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
                      {/* Real-time Group Chat */}
                      <button
                        onClick={() => openChat(`group_${grp.id}`, `Group Chat: ${grp.name}`, `${grp.subject} • ${grp.members.length} members`)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Open Group Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        Chat
                      </button>

                      {isMember ? (
                        <button
                          onClick={() => handleLeave(grp.id)}
                          className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 cursor-pointer"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(grp.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-xs"
                        >
                          Join Squad
                        </button>
                      )}

                      {/* Delete Study Group - Creator & Admin Only */}
                      {isCreator && (
                        <button
                          onClick={() => handleDeleteGroup(grp.id, grp.name)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Delete study group (Available only to creator)"
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

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Create Study Group</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Distributed Systems Lab Prep Squad"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. CS244B"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
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
                  <label className="block font-bold text-slate-700 mb-1">Privacy</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="public">Public (Anyone can join)</option>
                    <option value="private">Private (Invite only)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
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
                  placeholder="https://drive.google.com/... or github.com/..."
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
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Upload Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
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
                  placeholder="e.g. Science Library Room 302 or Online Zoom"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-xs"
                >
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
