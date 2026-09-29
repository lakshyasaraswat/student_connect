import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  IconCar,
  IconBook,
  IconWrench,
  IconGraduation,
  IconUsers,
  IconHome,
  IconBuilding,
  IconShield,
  IconUser,
  IconFileText
} from './icons.tsx';

export type TabType = 'carpool' | 'notes' | 'equipment' | 'tutoring' | 'study' | 'roommates' | 'pgs' | 'assignments' | 'admin' | 'profile';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'profile', label: 'My Profile & ID', icon: IconUser, badge: user?.isVerified ? 'Verified' : 'Pending' },
    { id: 'assignments', label: 'Assignment Help', icon: IconFileText, badge: 'Earn ₹' },
    { id: 'tutoring', label: 'Peer Tutoring', icon: IconGraduation, badge: 'Main' },
    { id: 'notes', label: 'Course Notes', icon: IconBook, badge: 'Main' },
    { id: 'carpool', label: 'Ride Pooling', icon: IconCar },
    { id: 'equipment', label: 'Equipment Lending', icon: IconWrench },
    { id: 'study', label: 'Study Groups', icon: IconUsers },
    { id: 'roommates', label: 'Roommates', icon: IconHome },
    { id: 'pgs', label: 'Campus Housing', icon: IconBuilding },
  ];

  if (isAdmin) {
    tabs.push({
      id: 'admin',
      label: 'Campus Moderation',
      icon: IconShield,
      badge: 'Admin'
    });
  }

  return (
    <div className="w-full border-b border-[#e5e5ea] bg-[#ffffff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          role="tablist"
          aria-label="Campus Facility Sections"
          className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1d1d1f] text-[#ffffff]'
                    : 'text-[#515154] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ffffff]' : 'text-[#86868b]'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-[#ffffff]/20 text-[#ffffff]'
                        : 'bg-[#f5f5f7] text-[#515154] border border-[#e5e5ea]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
