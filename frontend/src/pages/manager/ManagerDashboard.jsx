import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useLeave } from '../../context/LeaveContext';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import { StatusBadge, LeaveTypeBadge } from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatDate, timeAgo } from '../../utils/helpers';
import {
    HiOutlineUsers, HiOutlineClock, HiOutlineCheckCircle,
    HiOutlineClipboardList, HiOutlineUserGroup,
    HiOutlineCheck, HiOutlineX,
} from 'react-icons/hi';

const ManagerDashboard = () => {
    const { user } = useAuth();
    const { leaves, loading, fetchLeaves, approveLeave, rejectLeave } = useLeave();

    const [teamStats, setTeamStats] = useState(null);
    const [actionLeave, setActionLeave] = useState(null); // { leave, mode:'approve'|'reject' }
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLeaves({ status: 'pending', limit: 20 });
        loadTeamStats();
    }, []);

    const loadTeamStats = async () => {
        try {
            const { data } = await api.get('/leaves/stats');
            if (data.success) setTeamStats(data.data);
        } catch {/* silent */ }
    };

    const openAction = (leave, mode) => { setActionLeave({ leave, mode }); setComment(''); };

    const handleAction = async () => {
        if (!actionLeave) return;
        setSubmitting(true);
        if (actionLeave.mode === 'approve') {
            await approveLeave(actionLeave.leave._id, comment);
        } else {
            if (!comment.trim()) { setSubmitting(false); return; }
            await rejectLeave(actionLeave.leave._id, comment);
        }
        setSubmitting(false);
        setActionLeave(null);
        fetchLeaves({ status: 'pending', limit: 20 });
    };

    const pending = leaves.filter(l => l.status === 'pending');

    if (loading && !teamStats) return <PageLoader text="Loading team dashboard..." />;

    return (
        <div className="page-container animate-fade-in">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="page-header flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="page-title">Team Dashboard</h1>
                    <p className="page-subtitle">Review and manage your team's leave requests</p>
                </div>
                <Link to="/manager/team" className="btn-secondary">
                    <HiOutlineClipboardList className="w-4 h-4" /> All Team Leaves
                </Link>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<HiOutlineClock className="w-6 h-6" />} label="Pending Approval" value={pending.length} color="amber" />
                <StatCard icon={<HiOutlineCheckCircle className="w-6 h-6" />} label="Approved (Team)" value={teamStats?.byStatus?.approved || 0} color="emerald" />
                <StatCard icon={<HiOutlineUsers className="w-6 h-6" />} label="Total Requests" value={teamStats?.byStatus?.total || 0} color="indigo" />
                <StatCard icon={<HiOutlineUserGroup className="w-6 h-6" />} label="Days Approved" value={teamStats?.byStatus?.totalDays || 0} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Pending Approvals ────────────────────────────── */}
                <div className="lg:col-span-2">
                    <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Pending Approvals
                        {pending.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                                {pending.length}
                            </span>
                        )}
                    </h2>

                    {pending.length === 0 ? (
                        <div className="card p-10 text-center">
                            <HiOutlineCheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
                            <p className="text-slate-300 font-medium">All caught up!</p>
                            <p className="text-slate-500 text-sm mt-1">No pending leave requests to review</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pending.map((leave) => (
                                <div key={leave._id} className="card-hover p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-xl bg-primary-600/30 flex items-center justify-center flex-shrink-0 font-bold text-primary-300 text-sm">
                                            {leave.employee?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <div>
                                                    <p className="text-white font-medium text-sm">{leave.employee?.name}</p>
                                                    <p className="text-slate-500 text-xs">{leave.employee?.department} · {timeAgo(leave.createdAt)}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <LeaveTypeBadge type={leave.leaveType} />
                                                    <span className="text-slate-400 text-xs font-medium">{leave.totalDays}d</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-xs mt-1.5">
                                                {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                                            </p>
                                            <p className="text-slate-500 text-xs mt-1 truncate italic">"{leave.reason}"</p>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                                        <button onClick={() => openAction(leave, 'approve')} className="btn-success flex-1 btn-sm">
                                            <HiOutlineCheck className="w-4 h-4" /> Approve
                                        </button>
                                        <button onClick={() => openAction(leave, 'reject')} className="btn-danger flex-1 btn-sm">
                                            <HiOutlineX className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Right Panel ───────────────────────────────────── */}
                <div className="space-y-4">
                    {/* Leave breakdown by type */}
                    <div className="card p-5">
                        <h3 className="text-white font-semibold mb-3 text-sm">Team Leave Breakdown</h3>
                        {teamStats?.byType?.length > 0 ? (
                            <div className="space-y-2">
                                {teamStats.byType.map(({ type, count, totalDays }) => (
                                    <div key={type} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                        <LeaveTypeBadge type={type} />
                                        <div className="text-right">
                                            <span className="text-white text-sm font-semibold">{count}</span>
                                            <span className="text-slate-500 text-xs ml-1">req · {totalDays}d</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm">No data yet</p>
                        )}
                    </div>

                    {/* Quick links */}
                    <div className="card p-5">
                        <h3 className="text-white font-semibold mb-3 text-sm">Quick Links</h3>
                        <div className="space-y-1">
                            {[
                                { to: '/manager/team', label: 'Full Team Leave List', icon: <HiOutlineClipboardList className="w-4 h-4" /> },
                                { to: '/calendar', label: 'Team Calendar', icon: <HiOutlineUserGroup className="w-4 h-4" /> },
                            ].map(({ to, label, icon }) => (
                                <Link key={to} to={to}
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-slate-400 text-sm hover:bg-white/5 hover:text-primary-400 transition-all">
                                    <span className="text-slate-500">{icon}</span>{label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Approve / Reject Modal ──────────────────────────── */}
            <Modal
                isOpen={!!actionLeave}
                onClose={() => { setActionLeave(null); setComment(''); }}
                title={actionLeave?.mode === 'approve' ? '✅ Approve Leave' : '❌ Reject Leave'}
                size="sm"
            >
                {actionLeave && (
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-surface-900/60 text-sm">
                            <p className="text-slate-400 text-xs mb-1">Request from</p>
                            <p className="text-white font-medium">{actionLeave.leave.employee?.name}</p>
                            <p className="text-slate-400 text-xs mt-1">
                                {actionLeave.leave.totalDays} day(s) · {formatDate(actionLeave.leave.startDate)} → {formatDate(actionLeave.leave.endDate)}
                            </p>
                        </div>

                        <div>
                            <label className="label">
                                Comment {actionLeave.mode === 'reject' ? <span className="text-red-400">*</span> : '(optional)'}
                            </label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                                className={`input resize-none ${actionLeave.mode === 'reject' && !comment.trim() ? 'border-red-500/30' : ''}`}
                                rows={3} placeholder={actionLeave.mode === 'reject'
                                    ? 'Provide a reason for rejection...'
                                    : 'Optional approval note...'} />
                            {actionLeave.mode === 'reject' && !comment.trim() && (
                                <p className="text-red-400 text-xs mt-1">Rejection reason is required</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => { setActionLeave(null); setComment(''); }} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleAction} disabled={submitting || (actionLeave.mode === 'reject' && !comment.trim())}
                                className={`flex-1 ${actionLeave.mode === 'approve' ? 'btn-success' : 'btn-danger'}`}>
                                {submitting ? <span className="spinner w-4 h-4" /> : null}
                                {submitting ? 'Processing...' : actionLeave.mode === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ManagerDashboard;
