import React, { useState } from 'react';
import { IconClose, IconShield } from './icons.tsx';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#1d1d1f]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconShield className="w-4 h-4 text-[#0071e3]" />
            <h2 id="legal-modal-title" className="text-base font-semibold text-[#1d1d1f]">
              Compliance & Legal Documentation
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#f5f5f7] border border-[#e5e5ea] text-[#86868b] font-medium">
              Draft for Review
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close legal modal"
            className="p-1 rounded-md text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-6 pt-3 pb-2 border-b border-[#e5e5ea] bg-[#fbfbfa] flex space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'terms'
                ? 'border-[#0071e3] text-[#0071e3]'
                : 'border-transparent text-[#515154] hover:text-[#1d1d1f]'
            }`}
          >
            Terms of Service (Draft)
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-[#0071e3] text-[#0071e3]'
                : 'border-transparent text-[#515154] hover:text-[#1d1d1f]'
            }`}
          >
            Privacy Policy (Draft)
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto text-xs leading-relaxed text-[#515154] space-y-4">
          <div className="p-3 bg-[#f5f5f7] border border-[#e5e5ea] rounded text-[#515154]">
            <strong className="text-[#1d1d1f]">Note for University Counsel:</strong> This document reflects the actual platform architecture (university email domain gate, student-to-student escrow, and campus data segmentation). Specific legal commitments, arbitration clauses, and local university policy alignments are pending review by your institution&apos;s administration.
          </div>

          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">1. Campus Email Eligibility</h3>
                <p>
                  Access to StudentConnect is strictly restricted to active students, faculty, or staff possessing a verified institutional email domain (such as .edu or .ac.in). Accounts must be re-verified at the start of each academic semester. Sharing credentials outside the institutional boundary is prohibited.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">2. Peer Tutoring and Escrow Settlement</h3>
                <p>
                  When a student reserves a tutoring session or rents laboratory equipment, funds are transferred into a smart holding balance (escrow). The funds remain in escrow until the recipient confirms successful session delivery or returns the rented asset undamaged. In the event of a dispute, university campus moderators review logged session records to determine release or refund.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">3. Academic Materials and Intellectual Property</h3>
                <p>
                  Study notes, lecture summaries, and practice guides uploaded by seniors must be student-authored study aids. Posting official copyrighted exam solutions, copyrighted textbook copies, or instructor-restricted material is prohibited and subject to honor code reporting.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">4. Carpooling and Off-Campus Safety</h3>
                <p>
                  Rides and housing listings represent student-to-student coordination. Participants agree to verify identity cards and valid vehicle insurance prior to departure. StudentConnect provides identity verification infrastructure but does not operate transportation services.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">1. Information We Collect</h3>
                <p>
                  We collect your institutional email address, department, enrollment year, and student profile information supplied during onboarding. We log verified transactions, booking records, and in-app communications to facilitate escrow fulfillment and prevent campus fraud.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">2. Multi-Tenant Campus Isolation</h3>
                <p>
                  All profile data, ride schedules, course notes, and housing listings are strictly isolated to students sharing your university domain. Data is never aggregated into public search engines or sold to third-party advertisers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">3. Payment & Escrow Security</h3>
                <p>
                  Payment transactions are tokenized via certified payment gateways (Stripe / Razorpay). Financial credentials are never stored on platform servers. Escrow ledger records are retained for audit and dispute reconciliation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">4. Data Deletion and Graduation</h3>
                <p>
                  Upon graduation or departure from the university, students may request permanent account anonymization or export their authored study materials.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e5e5ea] bg-[#fbfbfa] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-[#1d1d1f] text-white hover:bg-[#333336] transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
