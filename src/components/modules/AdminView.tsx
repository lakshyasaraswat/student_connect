import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  ShieldAlert,
  Users,
  Car,
  CheckCircle,
  Building2,
  XCircle,
  AlertTriangle
} from '../icons.tsx';
import { VerifiedBadge } from '../common/VerifiedBadge.tsx';

export const AdminView: React.FC = () => {
  const { user, showAlert } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectStudent, setInspectStudent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [mRes, uRes, tRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminEscrows()
      ]);

      if (mRes.success) setMetrics(mRes.metrics);
      if (uRes.success) setUsersList(uRes.users);
      if (tRes.success) setTransactions(tRes.transactions);
    } catch (err: any) {
      console.warn('Admin fetch notice:', err);
      showAlert(err.message || 'Failed to load admin metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  const handleResolveDispute = async (refId: string, resolution: 'release_to_seller' | 'refund_to_buyer') => {
    try {
      const res = await api.resolveDispute(refId, resolution);
      if (res.success) {
        showAlert(res.message, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showAlert(err.message || 'Dispute resolution failed', 'error');
    }
  };

  const handleApproveVerification = async (userId: string) => {
    try {
      setActionLoading(userId);
      const res = await api.approveUserVerification(userId);
      if (res.success) {
        showAlert(res.message || 'Student institutional ID approved and verified!', 'success');
        if (inspectStudent && inspectStudent.id === userId) {
          setInspectStudent((prev: any) => prev ? { ...prev, isVerified: true, idVerificationStatus: 'approved' } : null);
        }
        await fetchAdminData();
      }
    } catch (err: any) {
      showAlert(err.message || 'Verification approval failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectVerification = async (userId: string) => {
    const reason = prompt('Optional rejection note for the student:', 'Admission number or ID photo does not match campus registrar records');
    try {
      setActionLoading(userId);
      const res = await api.rejectUserVerification(userId, reason || undefined);
      if (res.success) {
        showAlert(res.message || 'Verification rejected.', 'info');
        if (inspectStudent && inspectStudent.id === userId) {
          setInspectStudent((prev: any) => prev ? { ...prev, isVerified: false, idVerificationStatus: 'rejected' } : null);
        }
        await fetchAdminData();
      }
    } catch (err: any) {
      showAlert(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-[#e5e5ea] p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1d1d1f]">Access Restricted</h2>
        <p className="text-xs text-[#86868b] mt-2 leading-relaxed">
          This section is restricted to authorized campus staff. Student accounts do not have permission to access administration or moderation records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Campus Administration & Platform Moderation</span>
        </div>
        <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
          Campus Ecosystem Control & Administrator Verification Portal
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-xl">
          Review institutional student ID submissions, approve or reject verification credentials, audit peer-to-peer escrow payments in Rupees, and enforce campus boundaries.
        </p>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
          Loading platform metrics...
        </div>
      ) : (
        <>
          {/* Top Platform Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Students</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block flex items-center gap-1.5">
                <Users className="w-5 h-5 text-emerald-600" />
                {metrics?.totalStudents}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Rides</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block flex items-center gap-1.5">
                <Car className="w-5 h-5 text-blue-600" />
                {metrics?.activeRides} / {metrics?.totalRides}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Escrow Held (₹)</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                ₹{metrics?.totalEscrowHeld ?? 0}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Escrow Released (₹)</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                ₹{metrics?.totalEscrowReleased ?? 0}
              </span>
            </div>
          </div>

          {/* Campus Isolation Network Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Campus Isolation Data Lock Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {metrics?.campusBreakdown?.map((c: any) => (
                <div key={c.campusId} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                  <div className="text-emerald-700 font-mono text-[11px]">@{c.domain}</div>
                  <div className="mt-2 space-y-1 text-slate-600 text-[11px]">
                    <div>Active Students: <strong>{c.studentCount}</strong></div>
                    <div>Carpool Rides: <strong>{c.ridesCount}</strong></div>
                    <div>Notes Listed: <strong>{c.notesCount}</strong></div>
                    <div>PG Listings: <strong>{c.listingsCount}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Verification & Moderation Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Campus Moderation & Student ID Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional verification can only be approved or rejected here by campus administrators.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {usersList.length} Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Campus Email</th>
                    <th className="py-2.5 px-3">Admission No.</th>
                    <th className="py-2.5 px-3">Course / Dept</th>
                    <th className="py-2.5 px-3">Wallet</th>
                    <th className="py-2.5 px-3">Verification</th>
                    <th className="py-2.5 px-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => {
                    const isPending = !u.isVerified && (u.idVerificationStatus === 'pending' || u.idCardPhoto);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                          <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                          <div>
                            <div className="flex items-center gap-1">
                              <span>{u.name}</span>
                              <VerifiedBadge isVerified={u.isVerified} role={u.role} showLabel={false} size="xs" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{u.username ? `@${u.username}` : ''}</div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{u.admissionNumber || '—'}</td>
                        <td className="py-3 px-3 text-slate-600">{u.course || 'N/A'} {u.year ? `(${u.year})` : ''}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700">₹{u.walletBalance ?? 0}</td>
                        <td className="py-3 px-3">
                          <VerifiedBadge isVerified={u.isVerified} role={u.role} showLabel={true} size="xs" />
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {u.idCardPhoto && (
                            <button
                              onClick={() => setInspectStudent(u)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] cursor-pointer"
                              title="Inspect uploaded ID Card"
                            >
                              Inspect ID
                            </button>
                          )}

                          {!u.isVerified ? (
                            <>
                              <button
                                disabled={actionLoading === u.id}
                                onClick={() => handleApproveVerification(u.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] cursor-pointer shadow-2xs disabled:opacity-50"
                              >
                                {actionLoading === u.id ? 'Saving...' : 'Approve'}
                              </button>
                              <button
                                disabled={actionLoading === u.id}
                                onClick={() => handleRejectVerification(u.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded text-[11px] cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={actionLoading === u.id}
                              onClick={() => handleRejectVerification(u.id)}
                              className="px-2 py-1 text-slate-500 hover:text-rose-600 text-[11px] font-medium cursor-pointer"
                              title="Revoke student verification"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Escrow Ledger & Dispute Resolution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Escrow Audit Ledger & Dispute Manager (₹)
              </h3>
              <span className="text-xs text-slate-500">
                {transactions.length} Transactions Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Transaction</th>
                    <th className="py-2.5 px-3">Service Type</th>
                    <th className="py-2.5 px-3">Payer & Payee</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Escrow Status</th>
                    <th className="py-2.5 px-3 text-right">Moderator Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{tx.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 capitalize">{tx.serviceType}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {tx.payerId} → {tx.payeeId}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">₹{tx.amount}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            tx.status === 'released'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'refunded'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        {tx.status === 'held' ? (
                          <>
                            <button
                              onClick={() => handleResolveDispute(tx.referenceId, 'release_to_seller')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] cursor-pointer"
                            >
                              Release to Seller
                            </button>
                            <button
                              onClick={() => handleResolveDispute(tx.referenceId, 'refund_to_buyer')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] cursor-pointer"
                            >
                              Refund Student
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Inspect Student ID Modal */}
      {inspectStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src={inspectStudent.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {inspectStudent.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {inspectStudent.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Campus</span>
                  <span className="font-semibold text-slate-800">{inspectStudent.collegeName || 'Verified University'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Admission Number</span>
                  <span className="font-mono font-bold text-indigo-700">{inspectStudent.admissionNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Course / Degree</span>
                  <span className="font-semibold text-slate-800">{inspectStudent.course || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Year of Study</span>
                  <span className="font-semibold text-slate-800">{inspectStudent.year || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uploaded Institutional ID Card Photo:</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5">
                  <img
                    src={inspectStudent.idCardPhoto}
                    alt="Institutional ID"
                    className="w-full max-h-72 object-contain mx-auto"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectStudent(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRejectVerification(inspectStudent.id);
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold cursor-pointer text-xs"
              >
                Reject ID
              </button>
              <button
                onClick={() => {
                  handleApproveVerification(inspectStudent.id);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer text-xs shadow-xs"
              >
                Approve & Mark Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
