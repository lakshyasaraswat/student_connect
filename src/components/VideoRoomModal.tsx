import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { TutoringSession } from '../types.ts';
import {
  IconVideo,
  IconVideoOff,
  IconMic,
  IconMicOff,
  IconPhoneOff,
  IconShare,
  IconCheck
} from './icons.tsx';

interface VideoRoomModalProps {
  session: TutoringSession | null;
  onClose: () => void;
  onCompleteSession: (session: TutoringSession) => void;
}

export const VideoRoomModal: React.FC<VideoRoomModalProps> = ({
  session,
  onClose,
  onCompleteSession
}) => {
  const { user } = useAuth();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(145);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isStudent = session.studentId === user?.id;

  return (
    <div
      role="dialog"
      aria-label="Peer Tutoring Live Video Conference"
      className="fixed inset-0 z-50 bg-[#141416] flex flex-col text-white"
    >
      {/* Top Header */}
      <div className="bg-[#1d1d1f] border-b border-[#2d2d30] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-[#0071e3]"></span>
          <div>
            <div className="font-medium text-sm flex items-center gap-2">
              <span>{session.subject} Peer Session</span>
              <span className="bg-[#2d2d30] text-[#86868b] text-[10px] font-mono px-2 py-0.5 rounded">
                Duration {formatTimer(elapsedSeconds)}
              </span>
            </div>
            <div className="text-[11px] text-[#86868b]">
              Tutor: {session.tutorName} • Student: {session.studentName} • Escrow: ${session.amount}.00
            </div>
          </div>
        </div>

        {/* Action: Release Escrow if Student */}
        <div className="flex items-center space-x-3">
          {isStudent && session.status !== 'completed' && (
            <button
              onClick={() => {
                onClose();
                onCompleteSession(session);
              }}
              className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <IconCheck className="w-3.5 h-3.5" />
              Complete & Release Escrow (${session.amount}.00)
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-[#2d2d30] hover:bg-[#3d3d40] text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <IconPhoneOff className="w-3.5 h-3.5" />
            End Call
          </button>
        </div>
      </div>

      {/* Video Feeds Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center bg-[#141416]">
        {/* Participant 1: Tutor */}
        <div className="relative bg-[#1d1d1f] border border-[#2d2d30] rounded-xl h-full min-h-[300px] flex items-center justify-center overflow-hidden">
          <div className="text-center space-y-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt={session.tutorName}
              className="w-20 h-20 rounded-full object-cover mx-auto"
            />
            <div>
              <h4 className="text-white font-medium text-sm">{session.tutorName}</h4>
              <span className="text-xs text-[#86868b]">Department Senior</span>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 bg-[#000000]/70 text-white px-2.5 py-1 rounded text-xs flex items-center gap-2">
            <IconMic className="w-3 h-3 text-[#0071e3]" />
            {session.tutorName}
          </div>
        </div>

        {/* Participant 2: Student / You */}
        <div className="relative bg-[#1d1d1f] border border-[#2d2d30] rounded-xl h-full min-h-[300px] flex items-center justify-center overflow-hidden">
          {videoOn ? (
            <div className="text-center space-y-3">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover mx-auto"
              />
              <div>
                <h4 className="text-white font-medium text-sm">{user?.name} (You)</h4>
                <span className="text-xs text-[#86868b]">Connected</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-[#86868b] text-xs">Video Feed Disabled</div>
          )}

          <div className="absolute bottom-3 left-3 bg-[#000000]/70 text-white px-2.5 py-1 rounded text-xs flex items-center gap-2">
            {micOn ? (
              <IconMic className="w-3 h-3 text-[#0071e3]" />
            ) : (
              <IconMicOff className="w-3 h-3 text-[#86868b]" />
            )}
            {user?.name} (You)
          </div>
        </div>
      </div>

      {/* Media Controls Dock */}
      <div className="bg-[#1d1d1f] border-t border-[#2d2d30] px-6 py-3 flex items-center justify-center space-x-3">
        <button
          onClick={() => setMicOn(!micOn)}
          aria-label={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          className={`p-2.5 rounded-md transition cursor-pointer ${
            micOn ? 'bg-[#2d2d30] hover:bg-[#3d3d40] text-white' : 'bg-[#d70015] text-white'
          }`}
        >
          {micOn ? <IconMic className="w-4 h-4" /> : <IconMicOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setVideoOn(!videoOn)}
          aria-label={videoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          className={`p-2.5 rounded-md transition cursor-pointer ${
            videoOn ? 'bg-[#2d2d30] hover:bg-[#3d3d40] text-white' : 'bg-[#d70015] text-white'
          }`}
        >
          {videoOn ? <IconVideo className="w-4 h-4" /> : <IconVideoOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setScreenSharing(!screenSharing)}
          aria-label={screenSharing ? 'Stop Screen Sharing' : 'Start Screen Sharing'}
          className={`p-2.5 rounded-md transition cursor-pointer ${
            screenSharing ? 'bg-[#0071e3] text-white' : 'bg-[#2d2d30] hover:bg-[#3d3d40] text-white'
          }`}
        >
          <IconShare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
