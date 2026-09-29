import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  IconShield,
  IconWallet,
  IconCheck,
  IconVerifiedBadge,
  IconUser,
  IconPlus,
  IconMessage
} from './icons.tsx';
import { VerifiedBadge } from './common/VerifiedBadge.tsx';

interface HeaderProps {
  onOpenWallet: () => void;
  onOpenRegister: () => void;
  onOpenLogin: (role?: 'student' | 'admin') => void;
  onOpenProfile?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenWallet, onOpenRegister, onOpenLogin, onOpenProfile, onNavigateTab }) => {
  const {
    user,
    currentCampus,
    notifications,
    unreadCount,
    logout,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    alertMessage
  } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    setShowNotifMenu(false);
    if (onNavigateTab) {
      if (n.type === 'ride' || n.link === '/carpool') {
        onNavigateTab('carpool');
      } else if (n.type === 'tutoring') {
        onNavigateTab('tutoring');
      } else if (n.type === 'roommate') {
        onNavigateTab('roommates');
      } else if (n.type === 'listing') {
        onNavigateTab('pgs');
      } else if (n.type === 'assignment') {
        onNavigateTab('assignments');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#e5e5ea]">
      {/* Toast Alert Banner */}
      {alertMessage && (
        <div
          role="status"
          className={`py-2 px-4 text-center text-xs font-medium tracking-normal transition-all ${alertMessage.type === 'error'
            ? 'bg-[#ffebee] text-[#c62828]'
            : alertMessage.type === 'info'
              ? 'bg-[#e8f0fe] text-[#1967d2]'
              : 'bg-[#e6f4ea] text-[#137333]'
            }`}
        >
          {alertMessage.text}
        </div>
      )}

      {/* University Domain Isolation Banner */}
      <div className="bg-[#f5f5f7] border-b border-[#e5e5ea] px-4 sm:px-8 py-2 text-[12px] text-[#515154] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <IconShield className="w-3.5 h-3.5 text-[#0071e3]" />
          <span className="font-medium text-[#1d1d1f]">
            {user ? 'Campus Network:' : 'Intranet Scope:'}
          </span>
          <span className="text-[#515154] font-medium">
            {user ? (user.collegeName || currentCampus?.name) : 'Multi-Campus Student Intranet'}
          </span>
          <span className="text-[11px] font-mono text-[#1d1d1f] bg-[#ffffff] px-2 py-0.5 rounded border border-[#e5e5ea]">
            {user ? `@${user.domain || currentCampus?.domain}` : 'Domain-Isolated Per Campus'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[12px]">
          {user ? (
            <>
              <span className="text-[#515154] hidden sm:inline-flex items-center gap-1.5">
                <span>Logged in:</span>
                <strong className="text-[#1d1d1f]">{user.name}</strong>
                <VerifiedBadge isVerified={user.isVerified} role={user.role} showLabel={false} size="sm" />
                <span className="text-[#86868b]">({user.role === 'admin' ? 'Admin' : 'Student'})</span>
              </span>
              <button
                onClick={() => logout()}
                className="text-[#c62828] hover:underline font-medium cursor-pointer"
              >
                Sign Out
              </button>
              <span className="text-[#d2d2d7]">|</span>
              <button
                onClick={onOpenRegister}
                className="text-[#0071e3] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <IconPlus className="w-3 h-3" />
                Register Student
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onOpenLogin('student')}
                className="text-[#0071e3] hover:underline font-semibold cursor-pointer"
              >
                Student Login
              </button>
              <span className="text-[#d2d2d7]">|</span>
              <button
                onClick={() => onOpenLogin('admin')}
                className="text-[#1d1d1f] hover:text-[#0071e3] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <IconShield className="w-3.5 h-3.5 text-[#1d1d1f]" />
                Administrator Login
              </button>
              <span className="text-[#d2d2d7]">|</span>
              <button
                onClick={onOpenRegister}
                className="text-[#0071e3] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <IconPlus className="w-3 h-3" />
                Register Student Account
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#1d1d1f] text-white flex items-center justify-center font-medium text-sm">
            SC
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base tracking-tight text-[#1d1d1f]">
                StudentConnect
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#515154] border border-[#e5e5ea]">
                Intranet
              </span>
            </div>
            <p className="text-[11px] text-[#86868b] truncate max-w-[220px]">
              {user?.collegeName || 'Verified Campus Network'}
            </p>
          </div>
        </div>

        {/* Right Actions: Wallet, Notifications, Persona Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Wallet Balance */}
          <button
            onClick={onOpenWallet}
            className="flex items-center space-x-2 bg-[#ffffff] hover:bg-[#f5f5f7] text-[#1d1d1f] px-3 py-1.5 rounded-md border border-[#e5e5ea] transition text-xs cursor-pointer"
            title="Student Balance and Active Escrow"
          >
            <IconWallet className="w-4 h-4 text-[#0071e3]" />
            <div className="text-left leading-tight">
              <div className="font-medium text-[#1d1d1f]">${user?.walletBalance ?? 0}</div>
              <div className="text-[10px] text-[#86868b]">
                Escrow: ${user?.escrowBalance ?? 0}
              </div>
            </div>
            <span className="text-[11px] text-[#0071e3] font-medium pl-1">
              Top up
            </span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-[#515154] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-md transition cursor-pointer"
              title="Notifications"
              aria-label="View notifications"
            >
              <IconMessage className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#0071e3]" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#ffffff] rounded-lg shadow-lg border border-[#e5e5ea] py-2 z-50">
                <div className="px-4 py-2.5 border-b border-[#e5e5ea] flex items-center justify-between">
                  <div className="font-medium text-xs text-[#1d1d1f]">
                    Notifications ({unreadCount})
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-[#0071e3] hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#e5e5ea]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#86868b]">
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 text-xs transition cursor-pointer hover:bg-[#f5f5f7] ${!n.read ? 'bg-[#fbfbfa]' : ''
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="font-medium text-[#1d1d1f]">{n.title}</div>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[#515154] mt-1">{n.message}</p>
                        <span className="text-[10px] text-[#86868b] mt-1.5 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Menu */}
          {!user ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenLogin('student')}
                className="px-3.5 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenLogin('admin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffffff] hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] text-xs font-medium transition cursor-pointer"
              >
                <IconShield className="w-3.5 h-3.5 text-[#1d1d1f]" />
                <span>Admin Login</span>
              </button>
              <button
                onClick={onOpenRegister}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-[#ffffff] hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] text-xs font-medium transition cursor-pointer"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-[#f5f5f7] border border-[#e5e5ea] transition cursor-pointer"
                aria-label="User account profile"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="hidden md:block text-left text-xs leading-tight pr-1">
                  <div className="font-medium text-[#1d1d1f] flex items-center gap-1">
                    <span>{user.name}</span>
                    <VerifiedBadge isVerified={user.isVerified} role={user.role} showLabel={false} size="sm" />
                  </div>
                  <div className="text-[10px] text-[#86868b]">
                    {user.course?.split(' ')[0] || user.role}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-[#ffffff] rounded-xl shadow-xl border border-[#e5e5ea] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2.5 border-b border-[#e5e5ea]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                        {user?.role === 'admin' ? 'Administrator Account' : 'Student Account'}
                      </span>
                      <VerifiedBadge isVerified={user?.isVerified} role={user?.role} showLabel={true} size="xs" />
                    </div>

                    <div className="font-semibold text-sm text-[#1d1d1f] mt-1.5 flex items-center gap-1.5">
                      <span>{user?.name}</span>
                      <VerifiedBadge isVerified={user?.isVerified} role={user?.role} showLabel={false} size="sm" />
                    </div>
                    <div className="text-[11px] text-[#515154] font-mono mt-0.5">
                      User: @{user?.username || 'user'} • Adm No: {user?.admissionNumber || 'N/A'}
                    </div>
                    <div className="text-[11px] text-[#86868b]">{user?.email}</div>

                    <div className="mt-2 text-[11px] text-[#1d1d1f] bg-[#f5f5f7] px-2 py-1 rounded-md font-medium border border-[#e5e5ea]">
                      🏫 {user?.collegeName}
                    </div>

                    {user?.isVerified && (
                      <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md font-medium border border-emerald-200 flex items-center gap-1.5">
                        <IconVerifiedBadge className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{user?.idVerificationNotes || 'ID verified & authenticated by Campus Administrator.'}</span>
                      </div>
                    )}

                    {onOpenProfile && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <IconUser className="w-3.5 h-3.5" />
                        <span>Open Student Profile & ID Status</span>
                      </button>
                    )}
                  </div>

                  {/* Direct Login and Register actions */}
                  <div className="py-2 border-b border-[#e5e5ea] grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLogin('student');
                      }}
                      className="p-1.5 rounded-lg border border-[#e5e5ea] text-center font-medium hover:bg-[#f5f5f7] text-[#1d1d1f] cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>🎓 Student Login</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLogin('admin');
                      }}
                      className="p-1.5 rounded-lg border border-[#e5e5ea] text-center font-medium hover:bg-[#f5f5f7] text-[#1d1d1f] cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>🛡️ Admin Login</span>
                    </button>
                  </div>

                  {/* Security policy notice */}
                  <div className="mt-2.5 p-2 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] text-[11px] text-[#515154]">
                    <div className="font-semibold text-[#1d1d1f] flex items-center gap-1.5 mb-0.5">
                      <IconShield className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Institutional Security</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#515154]">
                      Direct user switching without credentials is disabled. To switch accounts, please sign out and log in with your student or administrator credentials.
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#e5e5ea] flex items-center justify-between text-xs px-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        onOpenLogin('student');
                      }}
                      className="text-[#0071e3] hover:underline font-medium text-[11px] cursor-pointer"
                    >
                      Switch Account
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="text-[#c62828] hover:underline font-semibold text-[11px] cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
