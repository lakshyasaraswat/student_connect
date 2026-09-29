import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  IconGraduation,
  IconShield,
  IconClose,
  IconChevronRight
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

  const [staffMode, setStaffMode] = useState(initialRole === 'admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStaffMode(initialRole === 'admin');
      setIdentifier('');
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
        staffMode
          ? 'Please enter your administrator username or ID.'
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
        role: staffMode ? 'admin' : 'student'
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

  const handleStaffDirectLogin = async (idVal: string) => {
    setIdentifier(idVal);
    setPassword('Password@123');
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await login({
        identifier: idVal,
        password: 'Password@123',
        role: 'admin'
      });
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message || 'Login failed.');
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
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                staffMode ? 'bg-[#1d1d1f] text-white' : 'bg-[#0071e3] text-white'
              }`}
            >
              {staffMode ? (
                <IconShield className="w-4 h-4" />
              ) : (
                <IconGraduation className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 id="login-modal-title" className="font-semibold text-[#1d1d1f] text-base leading-tight">
                {staffMode ? 'Staff & Administration Login' : 'Student Login'}
              </h3>
              <div className="text-[11px] text-[#86868b]">
                {staffMode
                  ? 'University authority & campus moderation'
                  : 'University peer intranet & services'}
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
              {staffMode ? 'Staff Username or Admin ID' : 'Username or Student Admission Number'}
            </label>
            <div className="relative">
              <input
                id="login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  staffMode ? 'Enter staff identifier' : 'e.g. sarah_chen or ST-2023-0104'
                }
                className="w-full px-3 py-2.5 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 font-mono"
              />
            </div>
            <p className="text-[11px] text-[#86868b] mt-1">
              {staffMode
                ? 'Restricted to designated campus moderators and authorized staff.'
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
          {!staffMode && (
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

          {/* If staff mode is toggled for administration access */}
          {staffMode && (
            <div className="pt-1">
              <div className="p-3 rounded-xl border border-[#e5e5ea] bg-[#fbfbfa]">
                <div className="text-[11px] text-[#515154] leading-relaxed">
                  Authenticate using authorized university staff credentials to access administrative moderation records.
                </div>
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleStaffDirectLogin('admin_mitchell')}
                    className="w-full py-1.5 px-3 rounded-lg bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Authenticate Demo Staff Session</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
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
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer ${
                staffMode
                  ? 'bg-[#1d1d1f] hover:bg-[#000000]'
                  : 'bg-[#0071e3] hover:bg-[#0077ed]'
              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span>Authenticating credentials...</span>
              ) : (
                <>
                  <span>{staffMode ? 'Sign In as Administrator' : 'Sign In as Student'}</span>
                  <IconChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-4 pt-3.5 border-t border-[#e5e5ea] flex items-center justify-between text-xs">
          {!staffMode ? (
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
            <button
              type="button"
              onClick={() => {
                setStaffMode(false);
                setIdentifier('');
                setErrorMsg(null);
              }}
              className="text-[#0071e3] hover:underline font-semibold cursor-pointer flex items-center gap-1"
            >
              ← Back to Student Login
            </button>
          )}
        </div>

        {/* Discreet Authorized Staff link (never exposed prominently to regular students) */}
        {!staffMode && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setStaffMode(true);
                setIdentifier('');
                setErrorMsg(null);
              }}
              className="text-[10px] text-[#86868b] hover:text-[#515154] hover:underline cursor-pointer"
            >
              Campus Staff Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
