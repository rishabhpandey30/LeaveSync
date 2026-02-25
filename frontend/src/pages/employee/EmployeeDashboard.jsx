import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLeave } from '../../context/LeaveContext';
import StatCard from '../../components/common/StatCard';
import { StatusBadge, LeaveTypeBadge } from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatDate, timeAgo, LEAVE_TYPES } from '../../utils/helpers';
import {
    HiOutlinePlusCircle, HiOutlineClipboardList, HiOutlineCalendar,
    HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle,
    HiOutlineExclamationCircle,
} from 'react-icons/hi';

const BalanceBar = ({ label, used, total, color }) => {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400 text-xs font-medium">{label}</span>
                <span className="text-slate-200 text-xs font-semibold">{total - used} / {total} left</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${100 - pct}%` }}
                />
            </div>
        </div>
    );
};

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const { leaves, stats, balance, loading, fetchLeaves, fetchStats, fetchBalance } = useLeave();

    useEffect(() => {
        fetchLeaves({ limit: 5 });
        fetchStats();
        fetchBalance();
    }, []);

    if (loading && !stats) return <PageLoader text="Loading your dashboard..." />;

    const recentLeaves = leaves.slice(0, 5);
    const bal = balance || user?.leaveBalance || {};

    // Calculate used days from stats
    const approvedLeaves = leaves.filter(l => l.status === 'approved');
    const usedAnnual = approvedLeaves.filter(l => l.leaveType === 'annual').reduce((s, l) => s + l.totalDays, 0);
    const usedSick = approvedLeaves.filter(l => l.leaveType === 'sick').reduce((s, l) => s + l.totalDays, 0);
    const usedCasual = approvedLeaves.filter(l => l.leaveType === 'casual').reduce((s, l) => s + l.totalDays, 0);

    const statCards = [
        { icon: <HiOutlineClock className="w-6 h-6" />, label: 'Pending', value: stats?.byStatus?.pending || 0, color: 'amber' },
        { icon: <HiOutlineCheckCircle className="w-6 h-6" />, label: 'Approved', value: stats?.byStatus?.approved || 0, color: 'emerald' },
        { icon: <HiOutlineXCircle className="w-6 h-6" />, label: 'Rejected', value: stats?.byStatus?.rejected || 0, color: 'red' },
        { icon: <HiOutlineCalendar className="w-6 h-6" />, label: 'Days Taken', value: stats?.byStatus?.totalDays || 0, color: 'indigo' },
    ];

    return (
        <div className="page-container animate-fade-in">
            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="page-header flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
                        <span className="text-primary-400">{user?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{user?.department} · {user?.position}</p>
                </div>
                <Link to="/employee/apply" className="btn-primary">
                    <HiOutlinePlusCircle className="w-4 h-4" />
                    Apply Leave
                </Link>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((s) => (
                    <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Recent Leaves ─────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-semibold">Recent Leave Requests</h2>
                        <Link to="/employee/leaves" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
                            View all →
                        </Link>
                    </div>

                    {recentLeaves.length === 0 ? (
                        <div className="card p-10 text-center">
                            <HiOutlineClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">No leave requests yet</p>
                            <p className="text-slate-600 text-sm mt-1">Apply for your first leave</p>
                            <Link to="/employee/apply" className="btn-primary mt-4 inline-flex">Apply Now</Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentLeaves.map((leave) => (
                                <div key={leave._id} className="card-hover p-4 flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${leave.status === 'approved' ? 'bg-emerald-500/15' :
                                            leave.status === 'rejected' ? 'bg-red-500/15' :
                                                leave.status === 'cancelled' ? 'bg-slate-500/15' : 'bg-amber-500/15'}`}>
                                        {leave.status === 'approved' ? <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400" /> :
                                            leave.status === 'rejected' ? <HiOutlineXCircle className="w-5 h-5 text-red-400" /> :
                                                leave.status === 'cancelled' ? <HiOutlineXCircle className="w-5 h-5 text-slate-400" /> :
                                                    <HiOutlineExclamationCircle className="w-5 h-5 text-amber-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <LeaveTypeBadge type={leave.leaveType} />
                                            <span className="text-slate-400 text-xs">{leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}</span>
                                        </div>
                                        <p className="text-slate-300 text-sm mt-0.5">
                                            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                                        </p>
                                        <p className="text-slate-600 text-xs mt-0.5">{timeAgo(leave.createdAt)}</p>
                                    </div>
                                    <StatusBadge status={leave.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Right Panel — Balance + Quick Links ───────────── */}
                <div className="space-y-4">
                    {/* Leave Balance Card */}
                    <div className="card p-5">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <HiOutlineClipboardList className="w-4 h-4 text-primary-400" />
                            Leave Balance
                        </h3>
                        <div className="space-y-4">
                            <BalanceBar label="Annual Leave" used={usedAnnual} total={20} color="bg-blue-500" />
                            <BalanceBar label="Sick Leave" used={usedSick} total={bal.sick || 10} color="bg-rose-500" />
                            <BalanceBar label="Casual Leave" used={usedCasual} total={bal.casual || 5} color="bg-violet-500" />
                            <div className="pt-2 mt-2 border-t border-white/5 space-y-1">
                                {[
                                    { label: 'Annual', val: bal.annual ?? 20, color: 'text-blue-400' },
                                    { label: 'Sick', val: bal.sick ?? 10, color: 'text-rose-400' },
                                    { label: 'Casual', val: bal.casual ?? 5, color: 'text-violet-400' },
                                ].map(({ label, val, color }) => (
                                    <div key={label} className="flex justify-between text-xs">
                                        <span className="text-slate-500">{label}</span>
                                        <span className={`${color} font-semibold`}>{val} days left</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card p-5">
                        <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
                        <div className="space-y-2">
                            {[
                                { to: '/employee/apply', icon: <HiOutlinePlusCircle className="w-4 h-4" />, label: 'Apply for Leave' },
                                { to: '/employee/leaves', icon: <HiOutlineClipboardList className="w-4 h-4" />, label: 'My Leave History' },
                                { to: '/calendar', icon: <HiOutlineCalendar className="w-4 h-4" />, label: 'View Calendar' },
                            ].map(({ to, icon, label }) => (
                                <Link key={to} to={to}
                                    className="flex items-center gap-3 p-2.5 rounded-lg text-slate-300 text-sm
                    hover:bg-white/5 hover:text-primary-400 transition-all group">
                                    <span className="text-slate-500 group-hover:text-primary-400 transition-colors">{icon}</span>
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Leave Type Guide */}
                    <div className="card p-5">
                        <h3 className="text-white font-semibold mb-3">Leave Types</h3>
                        <div className="space-y-2">
                            {LEAVE_TYPES.map(({ value, label }) => (
                                <div key={value} className="flex justify-between items-center text-xs">
                                    <LeaveTypeBadge type={value} />
                                    <span className="text-slate-500">
                                        {value === 'annual' ? '20 days/yr' :
                                            value === 'sick' ? '10 days/yr' :
                                                value === 'casual' ? '5 days/yr' : 'Unlimited'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
