import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  IconGraduation,
  IconShield,
  IconClose,
  IconChevronRight,
  IconCheck
} from './icons.tsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  initialRole?: 'student' | 'admin';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
  initialRole = 'student'
}) => {
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState<'student' | 'admin'>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveRole(initialRole);
      setIdentifier(initialRole === 'admin' ? 'admin_mitchell' : '');
      setPassword('Password@123');
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg(
        activeRole === 'admin'
          ? 'Please enter your administrator username, staff ID or email.'
          : 'Please enter your student username or admission number.'
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await login({
        identifier: identifier.trim(),
        password,
        role: activeRole
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillStudent = (idVal: string) => {
    setIdentifier(idVal);
    setPassword('Password@123');
    setErrorMsg(null);
  };

  const handleDirectAdminLogin = async (adminId: string = 'admin_mitchell') => {
    setIdentifier(adminId);
    setPassword('Password@123');
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await login({
        identifier: adminId,
        password: 'Password@123',
        role: 'admin'
      });
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'Administrator login failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 text-[#1d1d1f]"
    >
      <div className="bg-[#ffffff] rounded-2xl max-w-md w-full p-6 border border-[#e5e5ea] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e5ea]">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeRole === 'admin' ? 'bg-[#1d1d1f] text-white' : 'bg-[#0071e3] text-white'
                }`}
            >
              {activeRole === 'admin' ? (
                <IconShield className="w-4 h-4" />
              ) : (
                <IconGraduation className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 id="login-modal-title" className="font-semibold text-[#1d1d1f] text-base leading-tight">
                {activeRole === 'admin' ? 'Administrator Login' : 'Student Login'}
              </h3>
              <div className="text-[11px] text-[#86868b]">
                {activeRole === 'admin'
                  ? 'Institutional authority & campus moderation portal'
                  : 'University peer intranet & campus services'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close login dialog"
            className="p-1 text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="mt-4 p-1 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] grid grid-cols-2 gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveRole('student');
              setIdentifier('');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${activeRole === 'student'
              ? 'bg-white text-[#0071e3] shadow-xs font-semibold'
              : 'text-[#515154] hover:text-[#1d1d1f]'
              }`}
          >
            <IconGraduation className="w-4 h-4" />
            <span>Student Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRole('admin');
              setIdentifier('admin_mitchell');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${activeRole === 'admin'
              ? 'bg-[#1d1d1f] text-white shadow-xs font-semibold'
              : 'text-[#515154] hover:text-[#1d1d1f]'
              }`}
          >
            <IconShield className="w-4 h-4" />
            <span>Administrator Login</span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#ffebee] border border-[#ffcdd2] text-[#c62828] text-xs leading-relaxed flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label htmlFor="login-identifier" className="block font-medium text-[#1d1d1f] mb-1">
              {activeRole === 'admin' ? 'Administrator Username, Staff ID or Email' : 'Username or Student Admission Number'}
            </label>
            <div className="relative">
              <input
                id="login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  activeRole === 'admin' ? 'e.g. admin_mitchell or ADM-9001' : 'e.g. sarah_chen or ST-2023-0104'
                }
                className="w-full px-3 py-2.5 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 font-mono"
              />
            </div>
            <p className="text-[11px] text-[#86868b] mt-1">
              {activeRole === 'admin'
                ? 'Restricted to designated campus moderators and university administrators.'
                : 'Log in with your username, student roll number, or university email.'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block font-medium text-[#1d1d1f]">
                Password
              </label>
              <span className="text-[11px] text-[#86868b]">Default: Password@123</span>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 font-mono"
            />
          </div>

          {/* Student 1-Click Demo Accounts (only displayed on student login) */}
          {activeRole === 'student' && (
            <div className="pt-1">
              <span className="text-[10px] uppercase font-semibold text-[#86868b] tracking-wider block mb-1.5">
                Instant 1-Click Student Accounts
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFillStudent('sarah_chen')}
                  className="p-2 rounded-lg border border-[#e5e5ea] bg-[#fbfbfa] hover:bg-[#f5f5f7] text-left transition cursor-pointer"
                >
                  <div className="font-medium text-[#1d1d1f] text-[11px]">Sarah Chen (Student)</div>
                  <div className="text-[10px] text-[#86868b] font-mono">sarah_chen • ST-2023-0104</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillStudent('marcus_v')}
                  className="p-2 rounded-lg border border-[#e5e5ea] bg-[#fbfbfa] hover:bg-[#f5f5f7] text-left transition cursor-pointer"
                >
                  <div className="font-medium text-[#1d1d1f] text-[11px]">Marcus Vance (Student)</div>
                  <div className="text-[10px] text-[#86868b] font-mono">marcus_v • ST-2022-0891</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillStudent('alex_mit')}
                  className="p-2 rounded-lg border border-[#e5e5ea] bg-[#fbfbfa] hover:bg-[#f5f5f7] text-left transition cursor-pointer"
                >
                  <div className="font-medium text-[#1d1d1f] text-[11px]">Alex Rivera (MIT Student)</div>
                  <div className="text-[10px] text-[#86868b] font-mono">alex_mit • MIT-2024-512</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillStudent('aarav_iitd')}
                  className="p-2 rounded-lg border border-[#e5e5ea] bg-[#fbfbfa] hover:bg-[#f5f5f7] text-left transition cursor-pointer"
                >
                  <div className="font-medium text-[#1d1d1f] text-[11px]">Aarav Sharma (IITD)</div>
                  <div className="text-[10px] text-[#86868b] font-mono">aarav_iitd • IITD-2023-108</div>
                </button>
              </div>
            </div>
          )}

          {/* Administrator Demo Account Box (displayed on administrator login tab) */}
          {activeRole === 'admin' && (
            <div className="pt-1">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <IconShield className="w-3.5 h-3.5 text-slate-700" />
                    Demo Administrator Account
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Moderator Privileges
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Staff Username</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">admin_mitchell</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Staff ID</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">ADM-9001</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectAdminLogin('admin_mitchell')}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <IconShield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1-Click Sign In as Administrator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('admin_mitchell');
                      setPassword('Password@123');
                    }}
                    className="py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
                    title="Fill in administrator username"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer ${activeRole === 'admin'
                ? 'bg-[#1d1d1f] hover:bg-[#000000]'
                : 'bg-[#0071e3] hover:bg-[#0077ed]'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span>Authenticating credentials...</span>
              ) : (
                <>
                  <span>{activeRole === 'admin' ? 'Sign In as Administrator' : 'Sign In as Student'}</span>
                  <IconChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-4 pt-3.5 border-t border-[#e5e5ea] flex items-center justify-between text-xs">
          {activeRole === 'student' ? (
            <>
              <span className="text-[#86868b]">New student on campus?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="text-[#0071e3] hover:underline font-semibold cursor-pointer"
              >
                Register Student Account →
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] text-[#86868b]">Campus Authority & ID Moderation</span>
              <button
                type="button"
                onClick={() => {
                  setActiveRole('student');
                  setIdentifier('');
                  setErrorMsg(null);
                }}
                className="text-[#0071e3] hover:underline font-semibold cursor-pointer"
              >
                Switch to Student Login →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
