const API_BASE = '/api';

function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem('student_connect_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem('student_connect_token', token);
    } else {
      sessionStorage.removeItem('student_connect_token');
    }
  } catch {
    // Gracefully handle storage quota or security restrictions in iframe
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: response.ok, message: text };
      }
    }

    if (response.status === 401) {
      try {
        sessionStorage.removeItem('student_connect_token');
        sessionStorage.removeItem('user');
      } catch {
        // ignore
      }

      // Let AuthContext know so it can redirect
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }

      const err: any = new Error(data?.message || 'Authentication required. Please log in.');
      err.status = 401;
      err.isAuthError = true;
      throw err;
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    // If cold start or connection issue and retries left, wait and retry
    if (retries > 0 && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      await new Promise(res => setTimeout(res, 400));
      return request<T>(endpoint, options, retries - 1);
    }
    throw err;
  }
}

export const api = {
  // Auth
  getCampuses: () => request<{ success: boolean; campuses: any[] }>('/auth/campuses'),
  requestOtp: (email: string) => request<any>('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (credentials: string | { identifier?: string; username?: string; admissionNumber?: string; email?: string; password?: string; role?: 'student' | 'admin' }) => {
    const body = typeof credentials === 'string' ? { identifier: credentials } : credentials;
    return request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  getMe: () => request<any>('/auth/me'),
  updateProfile: (data: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getUserActivity: () => request<any>('/auth/activity'),
  updateIdVerification: (data: { collegeIdCardUrl?: string; admissionNumber?: string; collegeName?: string; autoApprove?: boolean }) =>
    request<any>('/auth/id-verification', { method: 'PUT', body: JSON.stringify(data) }),
  topupWallet: (amount: number, gateway?: string) => request<any>('/auth/wallet/topup', { method: 'POST', body: JSON.stringify({ amount, gateway }) }),

  // Carpooling
  getRides: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/rides${query ? `?${query}` : ''}`);
  },
  createRide: (data: any) => request<any>('/rides', { method: 'POST', body: JSON.stringify(data) }),
  deleteRide: (rideId: string) => request<any>(`/rides/${rideId}`, { method: 'DELETE' }),
  requestSeat: (rideId: string) => request<any>(`/rides/${rideId}/request-seat`, { method: 'POST' }),
  withdrawSeatRequest: (rideId: string) => request<any>(`/rides/${rideId}/withdraw-request`, { method: 'POST' }),
  managePassenger: (rideId: string, passengerId: string, action: 'accept' | 'reject') =>
    request<any>(`/rides/${rideId}/manage-passenger`, { method: 'POST', body: JSON.stringify({ passengerId, action }) }),
  calcCostSplit: (data: any) => request<any>('/rides/calc/cost-split', { method: 'POST', body: JSON.stringify(data) }),

  // Notes
  getNotes: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/notes${query ? `?${query}` : ''}`);
  },
  getNote: (id: string) => request<any>(`/notes/${id}`),
  createNote: (data: any) => request<any>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  purchaseNote: (id: string) => request<any>(`/notes/${id}/purchase`, { method: 'POST' }),
  addNoteReview: (id: string, rating: number, comment: string) =>
    request<any>(`/notes/${id}/review`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  getNotesDashboard: () => request<any>('/notes/dashboard'),

  // Equipment
  getEquipment: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/equipment${query ? `?${query}` : ''}`);
  },
  createEquipment: (data: any) => request<any>('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  rentEquipment: (id: string, days: number) => request<any>(`/equipment/${id}/rent`, { method: 'POST', body: JSON.stringify({ days }) }),
  returnEquipment: (id: string) => request<any>(`/equipment/${id}/return`, { method: 'POST' }),
  purchaseEquipment: (id: string) => request<any>(`/equipment/${id}/purchase`, { method: 'POST' }),
  deleteEquipment: (id: string) => request<any>(`/equipment/${id}`, { method: 'DELETE' }),

  // Tutoring
  getTutors: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/tutoring/tutors${query ? `?${query}` : ''}`);
  },
  getSessions: () => request<any>('/tutoring/sessions'),
  updateTutorProfile: (data: any) => request<any>('/tutoring/tutor-profile', { method: 'POST', body: JSON.stringify(data) }),
  bookSession: (data: any) => request<any>('/tutoring/book', { method: 'POST', body: JSON.stringify(data) }),
  completeSession: (id: string, rating?: number, feedback?: string) =>
    request<any>(`/tutoring/sessions/${id}/complete`, { method: 'POST', body: JSON.stringify({ rating, feedback }) }),
  rateSession: (id: string, rating: number, feedback?: string) =>
    request<any>(`/tutoring/sessions/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, feedback }) }),
  cancelSession: (id: string) => request<any>(`/tutoring/sessions/${id}/cancel`, { method: 'POST' }),


  // Study Groups
  getStudyGroups: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/study-groups${query ? `?${query}` : ''}`);
  },
  createStudyGroup: (data: any) =>
    request<any>('/study-groups', { method: 'POST', body: JSON.stringify(data) }),
  deleteStudyGroup: (id: string) =>
    request<any>(`/study-groups/${id}`, { method: 'DELETE' }),
  joinStudyGroup: (id: string, data?: { message?: string }) =>
    request<any>(`/study-groups/${id}/join`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  cancelStudyGroupRequest: (id: string) =>
    request<any>(`/study-groups/${id}/cancel-request`, { method: 'POST' }),
  respondToStudyGroupRequest: (id: string, requestId: string, action: 'approve' | 'reject') =>
    request<any>(`/study-groups/${id}/requests/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  leaveStudyGroup: (id: string) =>
    request<any>(`/study-groups/${id}/leave`, { method: 'POST' }),
  addStudyResource: (id: string, data: any) =>
    request<any>(`/study-groups/${id}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addStudySchedule: (id: string, data: any) =>
    request<any>(`/study-groups/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),


  // Roommates
  getRoommates: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/roommates${query ? `?${query}` : ''}`);
  },
  createRoommatePost: (data: any) => request<any>('/roommates', { method: 'POST', body: JSON.stringify(data) }),
  updateRoommateStatus: (id: string, status: string) =>
    request<any>(`/roommates/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteRoommatePost: (id: string) => request<any>(`/roommates/${id}`, { method: 'DELETE' }),

  // PG / Flat Listings
  getListings: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/listings${query ? `?${query}` : ''}`);
  },
  createListing: (data: any) => request<any>('/listings', { method: 'POST', body: JSON.stringify(data) }),
  deleteListing: (id: string) => request<any>(`/listings/${id}`, { method: 'DELETE' }),
  addListingReview: (id: string, rating: number, comment: string) =>
    request<any>(`/listings/${id}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),

  // Assignment Help
  getAssignments: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/assignments${query ? `?${query}` : ''}`);
  },
  getAssignment: (id: string) => request<any>(`/assignments/${id}`),
  createAssignment: (data: any) => request<any>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  claimAssignment: (id: string) => request<any>(`/assignments/${id}/claim`, { method: 'POST' }),
  counterAssignmentOffer: (id: string, data: { proposalId?: string; counterPrice: number; counterNote?: string; proposedTime?: string }) =>
    request<any>(`/assignments/${id}/counter`, { method: 'POST', body: JSON.stringify(data) }),
  applyOrBidAssignment: (id: string, data: { pitch: string; proposedTime: string; offeredPrice?: number }) =>
    request<any>(`/assignments/${id}/apply`, { method: 'POST', body: JSON.stringify(data) }),
  assignSolver: (id: string, data: { solverId?: string; proposalId?: string }) =>
    request<any>(`/assignments/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  submitAssignmentSolution: (id: string, data: { solutionNotes?: string; solutionFileUrl?: string; solutionFileName?: string }) =>
    request<any>(`/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  reviewAssignmentSolution: (id: string, data: { action: 'approve' | 'request_revision'; rating?: number; review?: string; revisionFeedback?: string }) =>
    request<any>(`/assignments/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  cancelAssignment: (id: string) => request<any>(`/assignments/${id}/cancel`, { method: 'POST' }),
  deleteAssignment: (id: string) => request<any>(`/assignments/${id}`, { method: 'DELETE' }),
  addDemoOffer: (id: string) => request<any>(`/assignments/${id}/demo-offer`, { method: 'POST' }),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Chat
  getChatMessages: (roomId: string) => request<any>(`/chat/${roomId}/messages`),
  sendChatMessage: (roomId: string, text: string) =>
    request<any>('/chat/messages', { method: 'POST', body: JSON.stringify({ roomId, text }) }),

  // Admin
  getAdminMetrics: () => request<any>('/admin/metrics'),
  getAdminUsers: () => request<any>('/admin/users'),
  getAdminEscrows: () => request<any>('/admin/escrow-transactions'),
  resolveDispute: (referenceId: string, resolution: 'release_to_seller' | 'refund_to_buyer') =>
    request<any>('/admin/resolve-dispute', { method: 'POST', body: JSON.stringify({ referenceId, resolution }) }),
  verifyListing: (id: string) => request<any>(`/admin/verify-listing/${id}`, { method: 'PUT' }),
  toggleUserVerification: (id: string) => request<any>(`/admin/toggle-user-verification/${id}`, { method: 'PUT' }),
  approveUserVerification: (id: string) => request<any>(`/admin/approve-verification/${id}`, { method: 'PUT' }),
  rejectUserVerification: (id: string, reason?: string) =>
    request<any>(`/admin/reject-verification/${id}`, { method: 'PUT', body: JSON.stringify({ reason }) }),

  // Gemini Maps Assistant
  chatWithGemini: (data: {
    message: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    campusId?: string;
    collegeName?: string;
    latLng?: { lat: number; lng: number };
    category?: 'carpool' | 'pg' | 'roommate' | 'general';
  }) => request<any>('/gemini/chat', { method: 'POST', body: JSON.stringify(data) }),

  getNearbyAssistance: (data: {
    category: 'carpool' | 'pg' | 'roommate';
    query?: string;
    campusId?: string;
    collegeName?: string;
  }) => request<any>('/gemini/locate-nearby', { method: 'POST', body: JSON.stringify(data) }),

  getVerifiedCollegeLocations: (params: {
    collegeName?: string;
    campusId?: string;
    category?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.collegeName) q.set('collegeName', params.collegeName);
    if (params.campusId) q.set('campusId', params.campusId);
    if (params.category) q.set('category', params.category);
    return request<{ success: boolean; collegeName: string; locations: any[] }>(`/gemini/verified-locations?${q.toString()}`);
  }
};
