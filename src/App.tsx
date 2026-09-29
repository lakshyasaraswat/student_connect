import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { NavigationTabs, TabType } from './components/NavigationTabs.tsx';
import { ProductHeroShowcase } from './components/ProductHeroShowcase.tsx';
import { CarpoolView } from './components/modules/CarpoolView.tsx';
import { NotesView } from './components/modules/NotesView.tsx';
import { EquipmentView } from './components/modules/EquipmentView.tsx';
import { TutoringView } from './components/modules/TutoringView.tsx';
import { StudyGroupView } from './components/modules/StudyGroupView.tsx';
import { RoommateView } from './components/modules/RoommateView.tsx';
import { PGListingsView } from './components/modules/PGListingsView.tsx';
import { AssignmentHelpView } from './components/modules/AssignmentHelpView.tsx';
import { AdminView } from './components/modules/AdminView.tsx';
import { ProfileView } from './components/modules/ProfileView.tsx';
import { ChatModal } from './components/ChatModal.tsx';
import { WalletModal } from './components/WalletModal.tsx';
import { RegisterModal } from './components/RegisterModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { VideoRoomModal } from './components/VideoRoomModal.tsx';
import { LegalModal } from './components/LegalModal.tsx';
import { GeminiMapsAssistantModal } from './components/GeminiMapsAssistantModal.tsx';
import { TutoringSession } from './types.ts';
import {
  IconCheck,
  IconAlert,
  IconInfo,
  IconClose,
  IconShield
} from './components/icons.tsx';
import { Compass } from 'lucide-react';

const MainContent: React.FC = () => {
  const { alertMessage, closeAlert, user, aiAssistantState, openAIAssistant, closeAIAssistant } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('tutoring');
  const [walletOpen, setWalletOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginInitialRole, setLoginInitialRole] = useState<'student' | 'admin'>('student');
  const [videoSession, setVideoSession] = useState<TutoringSession | null>(null);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | null>(null);

  // Track authenticated user ID to automatically move view/pointer back to the front page upon signout, login, or new user registration
  const prevUserIdRef = useRef<string | null | undefined>(user?.id);

  useEffect(() => {
    // Whenever authentication state changes (signout, new user login, or again login)
    if (prevUserIdRef.current !== user?.id) {
      setActiveTab(user?.role === 'admin' ? 'admin' : 'tutoring');
      setWalletOpen(false);
      setVideoSession(null);
      // Smoothly move the viewport back to the top of the front page
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      prevUserIdRef.current = user?.id;
    }
  }, [user?.id]);

  // Ensure normal users/students never stay on admin tab
  useEffect(() => {
    if (activeTab === 'admin' && user?.role !== 'admin') {
      setActiveTab('tutoring');
    }
  }, [activeTab, user?.role]);

  const handleOpenLogin = (role: 'student' | 'admin' = 'student') => {
    setLoginInitialRole(role);
    setLoginOpen(true);
  };

  const scrollToModuleSection = (tab: TabType) => {
    setActiveTab(tab);
    const targetElement = document.getElementById('campus-facilities-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col text-[#1d1d1f] antialiased">
      {/* Toast Notification Alert */}
      {alertMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 max-w-sm w-full transition-all"
        >
          <div
            className={`p-3.5 rounded-lg border flex items-start justify-between space-x-3 text-xs shadow-lg ${alertMessage.type === 'success'
              ? 'bg-[#ffffff] text-[#137333] border-[#ceead6]'
              : alertMessage.type === 'error'
                ? 'bg-[#ffffff] text-[#c62828] border-[#fad2cf]'
                : 'bg-[#ffffff] text-[#1967d2] border-[#d2e3fc]'
              }`}
          >
            <div className="flex items-start space-x-2">
              {alertMessage.type === 'success' && <IconCheck className="w-4 h-4 text-[#137333] mt-0.5 shrink-0" />}
              {alertMessage.type === 'error' && <IconAlert className="w-4 h-4 text-[#c62828] mt-0.5 shrink-0" />}
              {alertMessage.type === 'info' && <IconInfo className="w-4 h-4 text-[#1967d2] mt-0.5 shrink-0" />}
              <span className="font-medium text-[#1d1d1f] leading-normal">{alertMessage.text}</span>
            </div>
            <button
              onClick={closeAlert}
              aria-label="Dismiss notification"
              className="text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Campus Application Header */}
      <Header
        onOpenWallet={() => setWalletOpen(true)}
        onOpenRegister={() => setRegisterOpen(true)}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={() => scrollToModuleSection('profile')}
        onNavigateTab={(tab) => scrollToModuleSection(tab as TabType)}
      />

      {/* Main Visual: Comprehensive Multi-Feature Campus Ecosystem Showcase */}
      <ProductHeroShowcase
        onSelectTab={(tab) => scrollToModuleSection(tab)}
        onSelectTutoring={() => scrollToModuleSection('tutoring')}
        onSelectNotes={() => scrollToModuleSection('notes')}
        onOpenBooking={(tutor) => {
          scrollToModuleSection('tutoring');
        }}
        onPreviewNote={(note) => {
          scrollToModuleSection('notes');
        }}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={() => setRegisterOpen(true)}
      />

      {/* Main Facilities Section */}
      <div id="campus-facilities-section" className="w-full">
        {/* Module Navigation Tabs */}
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Feature Module Views */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'profile' && (
              <ProfileView
                onJoinVideoRoom={(session) => setVideoSession(session)}
                onNavigateTab={(tab) => scrollToModuleSection(tab)}
                onOpenWallet={() => setWalletOpen(true)}
              />
            )}
            {activeTab === 'tutoring' && (
              <TutoringView onJoinVideoRoom={(session) => setVideoSession(session)} />
            )}
            {activeTab === 'notes' && <NotesView />}
            {activeTab === 'carpool' && <CarpoolView />}
            {activeTab === 'equipment' && <EquipmentView />}
            {activeTab === 'study' && <StudyGroupView />}
            {activeTab === 'roommates' && <RoommateView />}
            {activeTab === 'pgs' && <PGListingsView />}
            {activeTab === 'assignments' && <AssignmentHelpView />}
            {activeTab === 'admin' && user?.role === 'admin' && <AdminView onOpenLogin={handleOpenLogin} />}
          </div>
        </main>
      </div>

      {/* Restrained Apple-Style Footer */}
      <footer className="border-t border-[#e5e5ea] bg-[#ffffff] mt-auto py-10 text-xs text-[#515154]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5ea]">
            <div className="flex items-center space-x-2.5">
              <IconShield className="w-4 h-4 text-[#0071e3]" />
              <span className="font-semibold text-sm text-[#1d1d1f]">StudentConnect</span>
              <span className="text-[#86868b]">•</span>
              <span className="text-xs text-[#515154]">
                {user ? `Campus-locked institutional network for ${user.collegeName}` : 'Universal student network across verified college campuses'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <button
                onClick={() => handleOpenLogin('admin')}
                className="text-[#515154] hover:text-[#1d1d1f] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <IconShield className="w-3.5 h-3.5 text-[#515154]" />
                <span>Administrator Login</span>
              </button>
              <button
                onClick={() => setLegalModalTab('terms')}
                className="text-[#515154] hover:text-[#1d1d1f] hover:underline cursor-pointer"
              >
                Terms of Service (Draft)
              </button>
              <button
                onClick={() => setLegalModalTab('privacy')}
                className="text-[#515154] hover:text-[#1d1d1f] hover:underline cursor-pointer"
              >
                Privacy Policy (Draft)
              </button>
              <button
                onClick={() => setWalletOpen(true)}
                className="text-[#0071e3] hover:underline cursor-pointer"
              >
                Escrow Ledger & Wallet
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#86868b] gap-3">
            <p>
              Draft documents and simulation protocols for campus compliance evaluation. Financial transactions, escrow disbursements, and email verifications are contained within the institutional sandbox.
            </p>
            <p className="shrink-0">
              © {new Date().getFullYear()} StudentConnect Intranet
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Real-time Chat Modal */}
      <ChatModal />

      {/* Wallet / Escrow Topup Modal */}
      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />

      {/* Student Registration Modal - clean instance on every open */}
      {registerOpen && (
        <RegisterModal
          isOpen={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onOpenLogin={() => {
            setRegisterOpen(false);
            setLoginOpen(true);
          }}
        />
      )}

      {/* Campus Portal Login Modal (Student & Administrator) */}
      {loginOpen && (
        <LoginModal
          isOpen={loginOpen}
          initialRole={loginInitialRole}
          onClose={() => setLoginOpen(false)}
          onOpenRegister={() => {
            setLoginOpen(false);
            setRegisterOpen(true);
          }}
        />
      )}

      {/* Video Call Tutoring Modal */}
      <VideoRoomModal
        session={videoSession}
        onClose={() => setVideoSession(null)}
        onCompleteSession={(session) => {
          setVideoSession(null);
          setActiveTab('tutoring');
        }}
      />

      {/* Legal & Compliance Modal */}
      <LegalModal
        isOpen={legalModalTab !== null}
        initialTab={legalModalTab || 'terms'}
        onClose={() => setLegalModalTab(null)}
      />

      {/* Floating AI Google Maps Campus Advisor Launcher */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center space-x-2">
        <button
          onClick={() => openAIAssistant('general')}
          className="group flex items-center space-x-2 bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 text-white px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl border border-indigo-400/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          title="Open Campus Google Maps AI Advisor"
          aria-label="Campus Google Maps AI Advisor"
        >
          <div className="relative">
            <Compass className="w-5 h-5 text-indigo-300 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-tight pr-1">
            Maps AI Advisor
          </span>
          <span className="hidden sm:inline-block text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded font-semibold border border-indigo-400/20">
            Google Maps Grounded
          </span>
        </button>
      </div>

      {/* Google Maps Grounded Gemini Assistant Modal */}
      <GeminiMapsAssistantModal
        isOpen={aiAssistantState.isOpen}
        onClose={closeAIAssistant}
        initialCategory={aiAssistantState.category}
        initialQuery={aiAssistantState.initialQuery}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
