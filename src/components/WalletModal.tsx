import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  IconWallet,
  IconShield,
  IconCreditCard,
  IconClose
} from './icons.tsx';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { user, topupWallet } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleTopup = async (gateway: 'stripe' | 'razorpay') => {
    const amt = customAmount ? Number(customAmount) : selectedAmount;
    if (amt <= 0) return;

    setIsProcessing(true);
    setTimeout(async () => {
      await topupWallet(amt);
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-title"
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-[#ffffff] rounded-xl max-w-md w-full p-6 border border-[#e5e5ea] shadow-xl text-[#1d1d1f]">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5ea]">
          <div className="flex items-center space-x-2">
            <IconWallet className="w-4 h-4 text-[#0071e3]" />
            <h3 id="wallet-title" className="font-semibold text-[#1d1d1f] text-sm">
              Student Wallet & Escrow Ledger
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-[#86868b] hover:text-[#1d1d1f] rounded transition-colors"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="mt-4 bg-[#f5f5f7] border border-[#e5e5ea] p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-[#86868b] font-medium block">
                Available Student Balance
              </span>
              <span className="text-2xl font-semibold text-[#1d1d1f] mt-0.5 block">
                ₹{user?.walletBalance ?? 0}.00
              </span>
            </div>
            <div className="bg-[#ffffff] text-[#1d1d1f] text-[11px] px-2 py-0.5 rounded border border-[#e5e5ea] font-medium">
              Verified Campus Balance
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#e5e5ea] flex justify-between text-xs text-[#515154]">
            <span>Active in Escrow (Held for Sessions / Due Tools):</span>
            <span className="font-semibold text-[#1d1d1f]">₹{user?.escrowBalance ?? 0}.00</span>
          </div>
        </div>

        {/* Top-up Selection */}
        <div className="mt-4 space-y-3 text-xs">
          <label className="block font-medium text-[#1d1d1f]">Select Top-up Amount</label>
          <div className="grid grid-cols-4 gap-2">
            {[200, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount('');
                }}
                className={`py-2 rounded-md font-medium transition cursor-pointer ${
                  selectedAmount === amt && !customAmount
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#fbfbfa] border border-[#e5e5ea] text-[#515154] hover:bg-[#f5f5f7]'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="custom-amount-input" className="block text-[#86868b] text-[11px] mb-1">
              Custom Amount (₹ INR)
            </label>
            <input
              id="custom-amount-input"
              type="number"
              min="50"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3 py-2 rounded-md border border-[#d2d2d7] bg-[#ffffff] text-xs text-[#1d1d1f] focus:border-[#0071e3]"
            />
          </div>

          {/* Escrow note */}
          <div className="p-3 bg-[#fbfbfa] border border-[#e5e5ea] rounded-md text-[11px] text-[#515154] space-y-1">
            <div className="font-medium text-[#1d1d1f] flex items-center gap-1">
              <IconShield className="w-3.5 h-3.5 text-[#0071e3]" />
              Escrow Protection Protocol
            </div>
            <p className="leading-relaxed">
              When booking peer tutoring sessions or borrowing equipment, payments are held securely in escrow until both parties confirm completion.
            </p>
          </div>

          {/* Checkout triggers */}
          <div className="pt-2 space-y-2">
            <button
              disabled={isProcessing}
              onClick={() => handleTopup('stripe')}
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium py-2 rounded-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
            >
              <IconCreditCard className="w-4 h-4" />
              {isProcessing ? 'Processing Simulated Gateway...' : 'Simulate Payment via Card / Stripe'}
            </button>

            <button
              disabled={isProcessing}
              onClick={() => handleTopup('razorpay')}
              className="w-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#d2d2d7] font-medium py-2 rounded-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
            >
              Simulate NetBanking / UPI Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
