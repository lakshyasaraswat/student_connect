import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_CAMPUSES } from '../context/AuthContext.tsx';
import {
  IconGraduation,
  IconShield,
  IconClose,
  IconChevronRight,
  IconCheck,
  IconUpload,
  IconFileText
} from './icons.tsx';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin
}) => {
  const { registerStudent, showAlert } = useAuth();

  const DEFAULT_ID_URL =
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80';

  // The 5 key requirements requested:
  // 1. Name
  // 2. Phone
  // 3. Email
  // 4. College Name
  // 5. College ID Card
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [collegeIdCardUrl, setCollegeIdCardUrl] = useState(DEFAULT_ID_URL);
  const [idCardFileName, setIdCardFileName] = useState('student_id_card.png');

  // Username and Admission Number (for subsequent login)
  const [username, setUsername] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('Password@123');

  // Course / Degree
  const [course, setCourse] = useState('Computer Science');
  const [year, setYear] = useState('3rd Year');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCollegeName('');
    setIsCustomCollege(false);
    setCustomCollegeName('');
    setCollegeIdCardUrl(DEFAULT_ID_URL);
    setIdCardFileName('student_id_card.png');
    setUsername('');
    setAdmissionNumber('');
    setPassword('Password@123');
    setCourse('Computer Science');
    setYear('3rd Year');
    setErrorMsg(null);
    setLoading(false);
  };

  // Reset all fields whenever the registration modal is opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Auto-generate username and admission number suggestions when name or email changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === name.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
      setUsername(val.toLowerCase().trim().replace(/[^a-z0-9]/g, '_'));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!username && val.includes('@')) {
      setUsername(val.split('@')[0].replace(/[^a-z0-9]/g, '_'));
    }
    // Auto-match college if recognized
    const domain = val.split('@')[1]?.toLowerCase();
    const matched = DEFAULT_CAMPUSES.find(c => domain?.includes(c.domain));
    if (matched && !isCustomCollege) {
      setCollegeName(matched.name);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setCollegeIdCardUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalCollege = isCustomCollege ? customCollegeName.trim() : collegeName.trim();

    if (!name.trim()) {
      setErrorMsg('Please enter student full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid college email.');
      return;
    }
    if (!finalCollege) {
      setErrorMsg('Please specify your college or university name.');
      return;
    }
    if (!collegeIdCardUrl) {
      setErrorMsg('Please attach or upload your College ID Card.');
      return;
    }

    setLoading(true);

    try {
      const generatedAdmission = admissionNumber.trim() || `ST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedUsername = username.trim() || email.split('@')[0].replace(/[^a-z0-9]/g, '_');

      const res = await registerStudent({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        collegeName: finalCollege,
        collegeIdCardUrl,
        username: generatedUsername,
        admissionNumber: generatedAdmission,
        password,
        course,
        year
      });

      if (res.success) {
        resetForm();
        showAlert(
          `Registered as Student! Log in anytime using Username (${generatedUsername}) or Admission No (${generatedAdmission}).`,
          'success'
        );
        onClose();
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 text-[#1d1d1f]"
    >
      <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-[#e5e5ea] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e5ea] sticky top-0 bg-[#ffffff] z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0071e3] text-white flex items-center justify-center">
              <IconGraduation className="w-4 h-4" />
            </div>
            <div>
              <h3 id="register-modal-title" className="font-semibold text-[#1d1d1f] text-base leading-tight">
                Student Registration
              </h3>
              <div className="text-[11px] text-[#86868b]">
                Verified campus intranet • All students can tutor, carpool & share
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close registration dialog"
            className="p-1 text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Universal Student Capability Notice */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#f0f7ff] border border-[#d0e5ff] text-[11px] text-[#0051a8] leading-relaxed">
          <div className="font-semibold text-[#004085] flex items-center gap-1.5 mb-0.5">
            <IconCheck className="w-3.5 h-3.5 text-[#0071e3]" />
            Universal Student Status
          </div>
          Every student account has full access across all platform services. Any student can tutor peers in subjects they excel in, post or join carpools, share lecture notes, and rent lab gear without pre-set role restrictions.
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#ffebee] border border-[#ffcdd2] text-[#c62828] text-xs leading-relaxed flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* 1. Name */}
          <div>
            <label htmlFor="reg-name" className="block font-medium text-[#1d1d1f] mb-1">
              Student Full Name <span className="text-[#c62828]">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Maya Chen"
              className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10"
            />
          </div>

          {/* 2. Phone Number & 3. Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-phone" className="block font-medium text-[#1d1d1f] mb-1">
                Mobile Phone <span className="text-[#c62828]">*</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (650) 555-0192"
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs font-mono text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block font-medium text-[#1d1d1f] mb-1">
                College Email Address <span className="text-[#c62828]">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="student@college.edu"
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs font-mono text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10"
              />
            </div>
          </div>

          {/* 4. College Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="reg-college" className="block font-medium text-[#1d1d1f]">
                College / University Name <span className="text-[#c62828]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCollege(!isCustomCollege)}
                className="text-[11px] text-[#0071e3] hover:underline cursor-pointer"
              >
                {isCustomCollege ? 'Select from list' : 'Other College? Enter custom'}
              </button>
            </div>

            {isCustomCollege ? (
              <input
                id="reg-custom-college"
                type="text"
                required
                value={customCollegeName}
                onChange={(e) => setCustomCollegeName(e.target.value)}
                placeholder="Enter your College or University name"
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10"
              />
            ) : (
              <select
                id="reg-college"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f] focus:outline-hidden focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10"
              >
                <option value="" disabled>-- Select Your University / College --</option>
                {DEFAULT_CAMPUSES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} (@{c.domain})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 5. College ID Card Upload */}
          <div>
            <label className="block font-medium text-[#1d1d1f] mb-1">
              College ID Card <span className="text-[#c62828]">*</span>
            </label>
            <div className="p-3 rounded-xl border border-dashed border-[#b0b0b8] bg-[#fbfbfa] hover:bg-[#f5f5f7] transition">
              <div className="flex items-start gap-3">
                {collegeIdCardUrl ? (
                  <div className="relative shrink-0 w-24 h-16 rounded-md overflow-hidden border border-[#d2d2d7] bg-white">
                    <img
                      src={collegeIdCardUrl}
                      alt="College ID Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-medium">
                      ID Attached
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 w-24 h-16 rounded-md border border-dashed border-[#c6c6c8] bg-[#f0f0f2] flex items-center justify-center text-[#86868b]">
                    <IconFileText className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[#1d1d1f] text-xs truncate">
                      {idCardFileName || 'student_id_card.png'}
                    </span>
                    <span className="shrink-0 text-[10px] bg-[#e6f4ea] text-[#137333] px-1.5 py-0.2 rounded font-medium border border-[#ceead6]">
                      Valid
                    </span>
                  </div>
                  <p className="text-[10px] text-[#86868b] mt-0.5 leading-tight">
                    Upload official student ID badge photo, scanned card, or admission letter.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <label
                      htmlFor="id-card-input"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ffffff] border border-[#d2d2d7] text-[11px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] cursor-pointer"
                    >
                      <IconUpload className="w-3 h-3 text-[#0071e3]" />
                      Browse File
                    </label>
                    <input
                      id="id-card-input"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCollegeIdCardUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80');
                        setIdCardFileName('official_student_id_card.png');
                      }}
                      className="text-[11px] text-[#0071e3] hover:underline cursor-pointer"
                    >
                      Use Sample Student ID
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login Credentials: Username & Admission Number */}
          <div className="p-3 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] space-y-3">
            <div className="text-[11px] font-semibold text-[#1d1d1f] flex items-center gap-1">
              <span>Your Login Credentials</span>
              <span className="text-[10px] font-normal text-[#86868b]">
                (Used to sign in as Student)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-username" className="block font-medium text-[#1d1d1f] mb-1 text-[11px]">
                  Custom Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. maya_chen"
                  className="w-full px-2.5 py-1.5 rounded-md border border-[#d2d2d7] bg-[#ffffff] text-xs font-mono text-[#1d1d1f]"
                />
              </div>

              <div>
                <label htmlFor="reg-admission" className="block font-medium text-[#1d1d1f] mb-1 text-[11px]">
                  Student Admission / Roll No.
                </label>
                <input
                  id="reg-admission"
                  type="text"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ST-2024-9182"
                  className="w-full px-2.5 py-1.5 rounded-md border border-[#d2d2d7] bg-[#ffffff] text-xs font-mono text-[#1d1d1f]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block font-medium text-[#1d1d1f] mb-1 text-[11px]">
                Create Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-[#d2d2d7] bg-[#ffffff] text-xs font-mono text-[#1d1d1f]"
              />
            </div>
          </div>

          {/* Academic Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-course" className="block font-medium text-[#1d1d1f] mb-1">
                Degree / Branch
              </label>
              <input
                id="reg-course"
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f]"
              />
            </div>
            <div>
              <label htmlFor="reg-year" className="block font-medium text-[#1d1d1f] mb-1">
                Academic Year
              </label>
              <select
                id="reg-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f]"
              >
                <option value="1st Year">1st Year (Freshman)</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
                <option value="Graduate / Master">Graduate / Master</option>
                <option value="PhD Candidate">PhD Candidate</option>
              </select>
            </div>
          </div>

          {/* Submit Registration */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-xs text-white bg-[#0071e3] hover:bg-[#0077ed] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Registering Student Account...</span>
              ) : (
                <>
                  <span>Complete Student Registration</span>
                  <IconChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer switch to login */}
        <div className="mt-4 pt-3.5 border-t border-[#e5e5ea] flex items-center justify-between text-xs">
          <span className="text-[#86868b]">Already have a campus account?</span>
          <button
            type="button"
            onClick={() => {
              handleClose();
              onOpenLogin();
            }}
            className="text-[#0071e3] hover:underline font-semibold cursor-pointer"
          >
            Log In with Username / Admission No →
          </button>
        </div>
      </div>
    </div>
  );
};
