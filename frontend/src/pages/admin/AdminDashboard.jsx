import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import { StatusBadge, LeaveTypeBadge, RoleBadge } from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatDate, timeAgo } from '../../utils/helpers';
import {
    HiOutlineUsers, HiOutlineClipboardList, HiOutlineClock,
    HiOutlineCheckCircle, HiOutlineOfficeBuilding, HiOutlineTrendingUp,
} from 'react-icons/hi';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    ArcElement, Tooltip, Legend, Title,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
        tooltip: {
            backgroundColor: '#1e293b',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
        },
    },
    scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        loadStats();
        loadRecent();
    }, []);

    const loadStats = async () => {
        try {
            const { data } = await api.get('/admin/stats');
            if (data.success) setStats(data.data);
        } catch {/* silent */ } finally {
            setLoading(false);
        }
    };

    const loadRecent = async () => {
        try {
            const { data } = await api.get('/admin/leaves?limit=6&sort=-createdAt');
            if (data.success) setRecent(data.data);
        } catch {/* silent */ }
    };

    if (loading) return <PageLoader text="Loading admin dashboard..." />;

    // ── Chart data ────────────────────────────────────────────────────
    const monthlyData = {
        labels: (stats?.monthlyTrend || []).map(m => m.month),
        datasets: [{
            label: 'Leave Requests',
            data: (stats?.monthlyTrend || []).map(m => m.count),
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
            borderRadius: 6,
        }],
    };

    const typeColors = ['rgba(59,130,246,0.7)', 'rgba(244,63,94,0.7)', 'rgba(139,92,246,0.7)', 'rgba(107,114,128,0.7)'];
    const statusData = {
        labels: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        datasets: [{
            data: [
                stats?.leaveStats?.pending || 0,
                stats?.leaveStats?.approved || 0,
                stats?.leaveStats?.rejected || 0,
                stats?.leaveStats?.cancelled || 0,
            ],
            backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)', 'rgba(100,116,139,0.7)'],
            borderColor: ['#f59e0b', '#10b981', '#ef4444', '#64748b'],
            borderWidth: 1,
        }],
    };

    return (
        <div className="page-container animate-fade-in">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="page-header flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">System-wide analytics and management</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/admin/users" className="btn-secondary btn-sm">Manage Users</Link>
                    <Link to="/admin/leaves" className="btn-secondary btn-sm">All Leaves</Link>
                </div>
            </div>

            {/* ── Top Stat Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<HiOutlineUsers className="w-6 h-6" />} label="Total Users" value={stats?.userStats?.total || 0} color="indigo" />
                <StatCard icon={<HiOutlineClipboardList className="w-6 h-6" />} label="Total Leaves" value={stats?.leaveStats?.total || 0} color="blue" />
                <StatCard icon={<HiOutlineClock className="w-6 h-6" />} label="Pending Approval" value={stats?.leaveStats?.pending || 0} color="amber" />
                <StatCard icon={<HiOutlineCheckCircle className="w-6 h-6" />} label="Total Days Off" value={stats?.leaveStats?.totalDays || 0} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* ── Monthly Bar Chart ─────────────────────────────── */}
                <div className="lg:col-span-2 card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HiOutlineTrendingUp className="w-4 h-4 text-primary-400" />
                        <h3 className="text-white font-semibold text-sm">Monthly Leave Trend</h3>
                    </div>
                    <div style={{ height: 220 }}>
                        <Bar data={monthlyData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
                    </div>
                </div>

                {/* ── Doughnut Status ───────────────────────────────── */}
                <div className="card p-5">
                    <h3 className="text-white font-semibold text-sm mb-4">Status Breakdown</h3>
                    <div style={{ height: 180 }}>
                        <Doughnut data={statusData} options={{
                            ...chartDefaults, scales: undefined,
                            cutout: '65%', plugins: { ...chartDefaults.plugins, legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } } }
                        }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Recent Leaves ─────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-semibold">Recent Leave Requests</h2>
                        <Link to="/admin/leaves" className="text-primary-400 text-sm hover:text-primary-300">View all →</Link>
                    </div>
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr><th>Employee</th><th>Type</th><th>Duration</th><th>Status</th><th>Time</th></tr>
                                </thead>
                                <tbody>
                                    {recent.map((l) => (
                                        <tr key={l._id}>
                                            <td>
                                                <p className="text-slate-200 text-sm font-medium">{l.employee?.name}</p>
                                                <p className="text-slate-500 text-xs">{l.employee?.department}</p>
                                            </td>
                                            <td><LeaveTypeBadge type={l.leaveType} /></td>
                                            <td><span className="text-white font-medium">{l.totalDays}d</span></td>
                                            <td><StatusBadge status={l.status} /></td>
                                            <td className="text-slate-500 text-xs">{timeAgo(l.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ───────────────────────────────────── */}
                <div className="space-y-4">
                    {/* User breakdown */}
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <HiOutlineUsers className="w-4 h-4 text-primary-400" />
                            <h3 className="text-white font-semibold text-sm">User Breakdown</h3>
                        </div>
                        {[
                            { label: 'Admins', val: stats?.userStats?.admins || 0, color: 'text-red-400' },
                            { label: 'Managers', val: stats?.userStats?.managers || 0, color: 'text-amber-400' },
                            { label: 'Employees', val: stats?.userStats?.employees || 0, color: 'text-blue-400' },
                            { label: 'Active', val: stats?.userStats?.active || 0, color: 'text-emerald-400' },
                        ].map(({ label, val, color }) => (
                            <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-sm">
                                <span className="text-slate-400">{label}</span>
                                <span className={`${color} font-bold`}>{val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Dept breakdown */}
                    {stats?.deptBreakdown?.length > 0 && (
                        <div className="card p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <HiOutlineOfficeBuilding className="w-4 h-4 text-primary-400" />
                                <h3 className="text-white font-semibold text-sm">By Department</h3>
                            </div>
                            {stats.deptBreakdown.slice(0, 5).map(({ _id, count }) => (
                                <div key={_id} className="flex justify-between items-center py-1.5 text-sm">
                                    <span className="text-slate-400 truncate">{_id || 'N/A'}</span>
                                    <span className="text-white font-semibold ml-2">{count}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick links */}
                    <div className="card p-5">
                        <h3 className="text-white font-semibold text-sm mb-3">Quick Actions</h3>
                        <div className="space-y-1">
                            {[
                                { to: '/admin/users', label: '👥 Manage Users' },
                                { to: '/admin/leaves', label: '📋 All Leave Records' },
                                { to: '/calendar', label: '📅 System Calendar' },
                            ].map(({ to, label }) => (
                                <Link key={to} to={to} className="flex items-center px-3 py-2 rounded-lg text-slate-400 text-sm hover:bg-white/5 hover:text-primary-400 transition-all">
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
