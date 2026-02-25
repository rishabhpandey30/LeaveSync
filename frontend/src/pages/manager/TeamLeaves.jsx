import { useEffect, useState } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { StatusBadge, LeaveTypeBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatDate, timeAgo, LEAVE_STATUSES, LEAVE_TYPES } from '../../utils/helpers';
import {
    HiOutlineFilter, HiOutlineClipboardList,
    HiOutlineCheck, HiOutlineX, HiOutlineEye,
    HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineSearch,
} from 'react-icons/hi';

const TeamLeaves = () => {
    const { leaves, loading, pagination, fetchLeaves, approveLeave, rejectLeave } = useLeave();

    const [filters, setFilters] = useState({ status: '', leaveType: '', search: '', page: 1, limit: 10 });
    const [selected, setSelected] = useState(null);
    const [actionLeave, setActionLeave] = useState(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchLeaves(filters); }, [filters]);

    const handleFilterChange = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

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
        setComment('');
        fetchLeaves(filters);
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Team Leave Requests</h1>
                <p className="page-subtitle">Review and action all team leave requests</p>
            </div>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
                <HiOutlineFilter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input value={filters.search} onChange={e => handleFilterChange('search', e.target.value)}
                        className="input pl-8 w-44 py-1.5 text-sm" placeholder="Search employee..." />
                </div>
                <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="select w-36">
                    <option value="">All Statuses</option>
                    {LEAVE_STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select value={filters.leaveType} onChange={e => handleFilterChange('leaveType', e.target.value)} className="select w-36">
                    <option value="">All Types</option>
                    {LEAVE_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                {(filters.status || filters.leaveType || filters.search) && (
                    <button onClick={() => setFilters({ status: '', leaveType: '', search: '', page: 1, limit: 10 })}
                        className="text-primary-400 text-sm hover:text-primary-300">× Clear</button>
                )}
                {pagination?.total > 0 && (
                    <span className="text-slate-500 text-sm ml-auto">{pagination.total} requests</span>
                )}
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            {loading ? <PageLoader /> : leaves.length === 0 ? (
                <div className="card p-12 text-center">
                    <HiOutlineClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No leave requests found</p>
                </div>
            ) : (
                <>
                    <div className="table-container mb-4">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Type</th>
                                        <th>Duration</th>
                                        <th>Dates</th>
                                        <th>Status</th>
                                        <th>Applied</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave) => (
                                        <tr key={leave._id}>
                                            <td>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-primary-600/30 text-primary-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                        {leave.employee?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-200 text-sm font-medium">{leave.employee?.name}</p>
                                                        <p className="text-slate-500 text-xs">{leave.employee?.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><LeaveTypeBadge type={leave.leaveType} /></td>
                                            <td>
                                                <span className="text-white font-medium">{leave.totalDays}</span>
                                                <span className="text-slate-500 text-xs ml-1">day{leave.totalDays !== 1 ? 's' : ''}</span>
                                            </td>
                                            <td>
                                                <p className="text-sm">{formatDate(leave.startDate)}</p>
                                                {leave.startDate !== leave.endDate && (
                                                    <p className="text-slate-500 text-xs">→ {formatDate(leave.endDate)}</p>
                                                )}
                                            </td>
                                            <td><StatusBadge status={leave.status} /></td>
                                            <td className="text-slate-500 text-xs">{timeAgo(leave.createdAt)}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setSelected(leave)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all">
                                                        <HiOutlineEye className="w-4 h-4" />
                                                    </button>
                                                    {leave.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => { setActionLeave({ leave, mode: 'approve' }); setComment(''); }}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                                                                <HiOutlineCheck className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => { setActionLeave({ leave, mode: 'reject' }); setComment(''); }}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                                <HiOutlineX className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
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
                            <span className="text-slate-400 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                            <button disabled={!pagination.hasNextPage} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="btn-secondary btn-sm disabled:opacity-30">
                                <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Details Modal */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Leave Details">
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
                                { label: 'Start Date', val: formatDate(selected.startDate) },
                                { label: 'End Date', val: formatDate(selected.endDate) },
                                { label: 'Duration', val: `${selected.totalDays} day(s)` },
                                { label: 'Applied', val: timeAgo(selected.createdAt) },
                            ].map(({ label, val }) => (
                                <div key={label} className="p-2.5 rounded-xl bg-surface-900/60">
                                    <p className="text-slate-500 text-xs">{label}</p>
                                    <p className="text-white font-medium text-sm">{val}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 rounded-xl bg-surface-900/60">
                            <p className="text-slate-500 text-xs mb-1">Reason</p>
                            <p className="text-slate-200 text-sm">{selected.reason}</p>
                        </div>
                        {selected.status === 'pending' && (
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => { setSelected(null); setActionLeave({ leave: selected, mode: 'approve' }); setComment(''); }}
                                    className="btn-success flex-1">Approve</button>
                                <button onClick={() => { setSelected(null); setActionLeave({ leave: selected, mode: 'reject' }); setComment(''); }}
                                    className="btn-danger flex-1">Reject</button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Action Modal */}
            <Modal isOpen={!!actionLeave} onClose={() => { setActionLeave(null); setComment(''); }}
                title={actionLeave?.mode === 'approve' ? 'Approve Leave' : 'Reject Leave'} size="sm">
                {actionLeave && (
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-surface-900/60 text-sm">
                            <p className="text-white font-medium">{actionLeave.leave.employee?.name}</p>
                            <p className="text-slate-400 text-xs">{actionLeave.leave.totalDays} day(s) · {formatDate(actionLeave.leave.startDate)}</p>
                        </div>
                        <div>
                            <label className="label">Comment {actionLeave.mode === 'reject' && <span className="text-red-400">*</span>}</label>
                            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                                className="input resize-none" placeholder={actionLeave.mode === 'reject' ? 'Rejection reason...' : 'Optional note...'} />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setActionLeave(null); setComment(''); }} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleAction} disabled={submitting || (actionLeave.mode === 'reject' && !comment.trim())}
                                className={`flex-1 ${actionLeave.mode === 'approve' ? 'btn-success' : 'btn-danger'}`}>
                                {submitting ? <span className="spinner w-4 h-4" /> : (actionLeave.mode === 'approve' ? 'Approve' : 'Reject')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TeamLeaves;
