import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, CampusConfig, AppNotification } from '../types.ts';
import { api, setAuthToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  campuses: CampusConfig[];
  currentCampus: CampusConfig | null;
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  socket: Socket | null;
  activeChat: { roomId: string; title: string; subtitle?: string } | null;
  openChat: (roomId: string, title: string, subtitle?: string) => void;
  closeChat: () => void;
  aiAssistantState: { isOpen: boolean; category: 'carpool' | 'pg' | 'roommate' | 'general'; initialQuery?: string };
  openAIAssistant: (category?: 'carpool' | 'pg' | 'roommate' | 'general', initialQuery?: string) => void;
  closeAIAssistant: () => void;
  login: (credentials: { identifier?: string; username?: string; admissionNumber?: string; email?: string; password?: string; role?: 'student' | 'admin' }) => Promise<any>;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  topupWallet: (amount: number) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  alertMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showAlert: (text: string, type?: 'success' | 'error' | 'info') => void;
  closeAlert: () => void;
  requestOtp: (email: string) => Promise<any>;
  registerStudent: (payload: any) => Promise<any>;
}

export const DEFAULT_CAMPUSES: CampusConfig[] = [
  {
    id: 'campus_stanford',
    name: 'Stanford University',
    domain: 'stanford.edu',
    city: 'Stanford',
    state: 'CA',
    centerCoordinates: { lat: 37.4275, lng: -122.1697 }
  },
  {
    id: 'campus_berkeley',
    name: 'UC Berkeley',
    domain: 'berkeley.edu',
    city: 'Berkeley',
    state: 'CA',
    centerCoordinates: { lat: 37.8719, lng: -122.2585 }
  },
  {
    id: 'campus_mit',
    name: 'Massachusetts Institute of Technology',
    domain: 'mit.edu',
    city: 'Cambridge',
    state: 'MA',
    centerCoordinates: { lat: 42.3601, lng: -71.0942 }
  },
  {
    id: 'campus_iitd',
    name: 'IIT Delhi',
    domain: 'iitd.ac.in',
    city: 'New Delhi',
    state: 'DL',
    centerCoordinates: { lat: 28.545, lng: 77.1926 }
  },
  {
    id: 'campus_cmu',
    name: 'Carnegie Mellon University',
    domain: 'cmu.edu',
    city: 'Pittsburgh',
    state: 'PA',
    centerCoordinates: { lat: 40.4432, lng: -79.9428 }
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = sessionStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [campuses, setCampuses] = useState<CampusConfig[]>(DEFAULT_CAMPUSES);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChat, setActiveChat] = useState<{ roomId: string; title: string; subtitle?: string } | null>(null);
  const [aiAssistantState, setAiAssistantState] = useState<{
    isOpen: boolean;
    category: 'carpool' | 'pg' | 'roommate' | 'general';
    initialQuery?: string;
  }>({
    isOpen: false,
    category: 'general'
  });
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const openAIAssistant = (
    category: 'carpool' | 'pg' | 'roommate' | 'general' = 'general',
    initialQuery?: string
  ) => {
    setAiAssistantState({
      isOpen: true,
      category,
      initialQuery
    });
  };

  const closeAIAssistant = () => {
    setAiAssistantState((prev) => ({ ...prev, isOpen: false }));
  };

  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  const closeAlert = () => {
    setAlertMessage(null);
  };

  const requestOtp = async (email: string) => {
    return await api.requestOtp(email);
  };

  const registerStudent = async (payload: any) => {
    const res = await api.register(payload);
    if (res.success && res.token && res.user) {
      setAuthToken(res.token);
      try {
        sessionStorage.setItem('user', JSON.stringify(res.user));
      } catch { }
      setUser(res.user);
    }
    return res;
  };

  // use effect
  useEffect(() => {
    const handleSessionExpired = () => {
      // Clear local user state
      setUser(null);

      // Clear cached user (token is already cleared by api.ts)
      try {
        sessionStorage.removeItem('user');
      } catch { }

      // Redirect to login (skip if already there)
      const path = window.location.pathname;
      if (path !== '/' && path !== '/login') {
        window.location.href = '/login';
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  // 1. Initial Load: fetch campuses and restore session
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        // Attempt to fetch fresh campuses from server
        try {
          const campusRes = await api.getCampuses();
          if (campusRes.success && campusRes.campuses?.length && isMounted) {
            setCampuses(campusRes.campuses);
          }
        } catch {
          // Retain default campus configurations
        }

        // Try getting current authenticated user from existing session token
        try {
          const meRes = await api.getMe();
          if (meRes.success && meRes.user && isMounted) {
            try {
              sessionStorage.setItem('user', JSON.stringify(meRes.user));   // ← ADD
            } catch { }
            setUser(meRes.user);
          } else {
            setAuthToken(null);
            try {
              sessionStorage.removeItem('user');   // ← ADD
            } catch { }
            if (isMounted) setUser(null);
          }
        } catch {
          setAuthToken(null);
          try {
            sessionStorage.removeItem('user');   // ← ADD
          } catch { }
          if (isMounted) setUser(null);
        }
      } catch {
        // Quietly maintain clean guest state
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Socket.io Connection when user changes
  useEffect(() => {
    if (!user) return;

    let s: Socket | null = null;
    try {
      s = io('/', {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        query: {
          userId: user.id,
          campusId: user.campusId
        },
        reconnectionAttempts: 5,
        timeout: 10000
      });

      s.on('connect_error', () => {
        // Gracefully handle socket connection errors in sandbox
      });

      s.on('notification', (newNotif: AppNotification) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        showAlert(`🔔 ${newNotif.title}: ${newNotif.message}`, 'info');
      });

      setSocket(s);

      // Fetch initial notifications
      api.getNotifications()
        .then(res => {
          if (res.success) {
            setNotifications(res.notifications);
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => { });
    } catch {
      // Ignore socket setup failures in offline or restricted environments
    }

    return () => {
      if (s) s.disconnect();
    };
  }, [user?.id, user?.campusId]);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        try {
          sessionStorage.setItem('user', JSON.stringify(res.user));   // ← ADD
        } catch { }
        setUser(res.user);
      }
    } catch {
      // Quietly handle refresh failures
    }
  };

  const login = async (credentials: { identifier?: string; username?: string; admissionNumber?: string; email?: string; password?: string; role?: 'student' | 'admin' }) => {
    const res = await api.login(credentials);
    if (res.success && res.user) {
      setAuthToken(res.token);
      try {
        sessionStorage.setItem('user', JSON.stringify(res.user));   // ← ADD
      } catch { }
      setUser(res.user);
      const roleName = res.user.role === 'admin' ? 'Administrator' : 'Student';
      showAlert(`Welcome back, ${res.user.name}! Logged in as ${roleName} (${res.user.collegeName}).`, 'success');
      api.getNotifications().then(notifRes => {
        if (notifRes.success) {
          setNotifications(notifRes.notifications);
          setUnreadCount(notifRes.unreadCount);
        }
      }).catch(() => { });
    }
    return res;
  };

  const loginWithEmail = async (email: string) => {
    return login({ identifier: email });
  };

  const logout = () => {
    setAuthToken(null);
    try {
      sessionStorage.removeItem('user');   // ← ADD
    } catch { }
    setUser(null);
    setActiveChat(null);
    setNotifications([]);
    setUnreadCount(0);
    showAlert('Logged out from campus network.', 'info');
  };

  const topupWallet = async (amount: number) => {
    try {
      const res = await api.topupWallet(amount);
      if (res.success) {
        if (user) {
          setUser({ ...user, walletBalance: res.walletBalance });
        }
        showAlert(`Added $${amount} to your campus wallet!`, 'success');
      }
    } catch (err: any) {
      showAlert(err.message || 'Topup failed', 'error');
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const openChat = (roomId: string, title: string, subtitle?: string) => {
    setActiveChat({ roomId, title, subtitle });
  };

  const closeChat = () => {
    setActiveChat(null);
  };

  const currentCampus = campuses.find(
    c => c.id === user?.campusId ||
      c.id === `campus_${user?.campusId}` ||
      c.id.replace('campus_', '') === user?.campusId?.replace('campus_', '') ||
      (user?.collegeName && c.name.toLowerCase() === user?.collegeName?.toLowerCase()) ||
      (user?.domain && c.domain.toLowerCase() === user?.domain?.toLowerCase())
  ) || campuses[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        campuses,
        currentCampus,
        notifications,
        unreadCount,
        loading,
        socket,
        activeChat,
        openChat,
        closeChat,
        aiAssistantState,
        openAIAssistant,
        closeAIAssistant,
        login,
        loginWithEmail,
        logout,
        refreshUser,
        topupWallet,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        alertMessage,
        showAlert,
        closeAlert,
        requestOtp,
        registerStudent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
