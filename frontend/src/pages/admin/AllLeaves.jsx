import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { StatusBadge, LeaveTypeBadge } from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatDate, timeAgo, LEAVE_STATUSES, LEAVE_TYPES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
    HiOutlineFilter, HiOutlineSearch, HiOutlineClipboardList,
    HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineEye,
    HiOutlineDownload,
} from 'react-icons/hi';

const AllLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [selected, setSelected] = useState(null);
    const [filters, setFilters] = useState({
        search: '', status: '', leaveType: '', page: 1, limit: 12
    });

    useEffect(() => { fetchLeaves(); }, [filters]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
            );
            const { data } = await api.get(`/admin/leaves?${params}`);
            if (data.success) { setLeaves(data.data); setPagination(data.pagination || {}); }
        } catch { toast.error('Failed to load leaves'); }
        finally { setLoading(false); }
    };

    const handleFilterChange = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

    // Summary counts
    const counts = LEAVE_STATUSES.reduce((acc, { value }) => {
        acc[value] = leaves.filter(l => l.status === value).length; return acc;
    }, {});

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="page-title">All Leave Records</h1>
                    <p className="page-subtitle">System-wide leave management and reporting</p>
                </div>
                <button className="btn-secondary btn-sm" onClick={() => toast.success('Export coming in Phase 10!')}>
                    <HiOutlineDownload className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* ── Quick Filter Tabs ─────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[{ label: 'All', val: '' }, ...LEAVE_STATUSES].map(({ label, value, val }) => {
                    const v = val ?? value;
                    return (
                        <button key={v ?? 'all'} onClick={() => handleFilterChange('status', v)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                ${filters.status === v
                                    ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                                    : 'bg-surface-800/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'}`}>
                            {label}
                            {v !== '' && counts[v] > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{counts[v]}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
                <HiOutlineFilter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input value={filters.search} onChange={e => handleFilterChange('search', e.target.value)}
                        className="input pl-8 w-48 py-1.5 text-sm" placeholder="Search employee..." />
                </div>
                <select value={filters.leaveType} onChange={e => handleFilterChange('leaveType', e.target.value)} className="select w-36">
                    <option value="">All Types</option>
                    {LEAVE_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                {(filters.search || filters.leaveType) && (
                    <button onClick={() => setFilters(f => ({ ...f, search: '', leaveType: '', page: 1 }))}
                        className="text-primary-400 text-sm hover:text-primary-300">× Clear</button>
                )}
                {pagination?.total > 0 && (
                    <span className="text-slate-500 text-sm ml-auto">{pagination.total} records</span>
                )}
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            {loading ? <PageLoader /> : leaves.length === 0 ? (
                <div className="card p-12 text-center">
                    <HiOutlineClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No leave records found</p>
                </div>
            ) : (
                <>
                    <div className="table-container mb-4">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr><th>Employee</th><th>Type</th><th>Duration</th><th>Date Range</th><th>Status</th><th>Reviewer</th><th>Applied</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {leaves.map((l) => (
                                        <tr key={l._id}>
                                            <td>
                                                <div>
                                                    <p className="text-slate-200 text-sm font-medium">{l.employee?.name}</p>
                                                    <p className="text-slate-500 text-xs">{l.employee?.department}</p>
                                                </div>
                                            </td>
                                            <td><LeaveTypeBadge type={l.leaveType} /></td>
                                            <td>
                                                <span className="text-white font-semibold">{l.totalDays}</span>
                                                <span className="text-slate-500 text-xs ml-1">day{l.totalDays !== 1 ? 's' : ''}</span>
                                            </td>
                                            <td>
                                                <p className="text-sm">{formatDate(l.startDate)}</p>
                                                {l.startDate !== l.endDate && (
                                                    <p className="text-slate-500 text-xs">→ {formatDate(l.endDate)}</p>
                                                )}
                                            </td>
                                            <td><StatusBadge status={l.status} /></td>
                                            <td className="text-slate-400 text-xs">{l.reviewedBy?.name || '—'}</td>
                                            <td className="text-slate-500 text-xs">{timeAgo(l.createdAt)}</td>
                                            <td>
                                                <button onClick={() => setSelected(l)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all">
                                                    <HiOutlineEye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {pagination?.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button disabled={!pagination.hasPrevPage} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="btn-secondary btn-sm disabled:opacity-30">
                                <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-slate-400 text-sm">Page {filters.page} of {pagination.totalPages}</span>
                            <button disabled={!pagination.hasNextPage} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="btn-secondary btn-sm disabled:opacity-30">
                                <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Details Modal */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Leave Record Details">
                {selected && (
                    <div className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                            <LeaveTypeBadge type={selected.leaveType} />
                            <StatusBadge status={selected.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {[
                                { label: 'Employee', val: selected.employee?.name },
                                { label: 'Department', val: selected.employee?.department },
                                { label: 'Email', val: selected.employee?.email },
                                { label: 'Duration', val: `${selected.totalDays} day(s)` },
                                { label: 'Start Date', val: formatDate(selected.startDate) },
                                { label: 'End Date', val: formatDate(selected.endDate) },
                                { label: 'Applied', val: formatDate(selected.createdAt) },
                                { label: 'Reviewer', val: selected.reviewedBy?.name || '—' },
                            ].map(({ label, val }) => (
                                <div key={label} className="p-2.5 rounded-xl bg-surface-900/60">
                                    <p className="text-slate-500 text-xs">{label}</p>
                                    <p className="text-white font-medium text-sm truncate">{val || '—'}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 rounded-xl bg-surface-900/60">
                            <p className="text-slate-500 text-xs mb-1">Reason</p>
                            <p className="text-slate-200 text-sm">{selected.reason}</p>
                        </div>
                        {selected.reviewComment && (
                            <div className="p-3 rounded-xl bg-surface-900/60">
                                <p className="text-slate-500 text-xs mb-1">Review Comment</p>
                                <p className="text-slate-200 text-sm">{selected.reviewComment}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AllLeaves;
