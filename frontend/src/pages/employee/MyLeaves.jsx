import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeave } from '../../context/LeaveContext';
import { StatusBadge, LeaveTypeBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatDate, timeAgo, LEAVE_STATUSES, LEAVE_TYPES } from '../../utils/helpers';
import {
    HiOutlinePlusCircle, HiOutlineFilter, HiOutlineClipboardList,
    HiOutlineTrash, HiOutlineEye, HiOutlineChevronLeft, HiOutlineChevronRight,
} from 'react-icons/hi';

const MyLeaves = () => {
    const { leaves, loading, pagination, fetchLeaves, cancelLeave } = useLeave();

    const [filters, setFilters] = useState({ status: '', leaveType: '', page: 1, limit: 8 });
    const [selected, setSelected] = useState(null);   // leave for details modal
    const [cancelId, setCancelId] = useState(null);   // leave id pending cancel confirm
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => { fetchLeaves(filters); }, [filters]);

    const handleFilterChange = (key, val) =>
        setFilters((f) => ({ ...f, [key]: val, page: 1 }));

    const handleCancel = async () => {
        setCancelling(true);
        await cancelLeave(cancelId);
        setCancelling(false);
        setCancelId(null);
        fetchLeaves(filters);
    };

    return (
        <div className="page-container animate-fade-in">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="page-header flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="page-title">My Leave Requests</h1>
                    <p className="page-subtitle">Track, manage, and cancel your leave applications</p>
                </div>
                <Link to="/employee/apply" className="btn-primary">
                    <HiOutlinePlusCircle className="w-4 h-4" /> Apply Leave
                </Link>
            </div>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
                <HiOutlineFilter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="select w-36">
                    <option value="">All Statuses</option>
                    {LEAVE_STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select value={filters.leaveType} onChange={(e) => handleFilterChange('leaveType', e.target.value)} className="select w-36">
                    <option value="">All Types</option>
                    {LEAVE_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
                {(filters.status || filters.leaveType) && (
                    <button onClick={() => setFilters({ status: '', leaveType: '', page: 1, limit: 8 })}
                        className="text-primary-400 text-sm hover:text-primary-300">
                        Clear filters
                    </button>
                )}
                {pagination?.total > 0 && (
                    <span className="text-slate-500 text-sm ml-auto">{pagination.total} total</span>
                )}
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            {loading ? <PageLoader text="Loading leaves..." /> : leaves.length === 0 ? (
                <div className="card p-12 text-center">
                    <HiOutlineClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium">No leave requests found</p>
                    <p className="text-slate-500 text-sm mt-1">
                        {filters.status || filters.leaveType ? 'Try different filters' : 'Apply for your first leave'}
                    </p>
                    <Link to="/employee/apply" className="btn-primary mt-4 inline-flex">Apply Now</Link>
                </div>
            ) : (
                <>
                    <div className="table-container mb-4">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
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
                                            <td><LeaveTypeBadge type={leave.leaveType} /></td>
                                            <td>
                                                <span className="text-white font-medium">{leave.totalDays}</span>
                                                <span className="text-slate-500 text-xs ml-1">day{leave.totalDays !== 1 ? 's' : ''}</span>
                                            </td>
                                            <td>
                                                <div className="text-sm">{formatDate(leave.startDate)}</div>
                                                {leave.startDate !== leave.endDate && (
                                                    <div className="text-slate-500 text-xs">→ {formatDate(leave.endDate)}</div>
                                                )}
                                            </td>
                                            <td><StatusBadge status={leave.status} /></td>
                                            <td className="text-slate-500 text-xs">{timeAgo(leave.createdAt)}</td>
                                            <td>
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => setSelected(leave)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                                                        title="View details">
                                                        <HiOutlineEye className="w-4 h-4" />
                                                    </button>
                                                    {['pending', 'approved'].includes(leave.status) && (
                                                        <button onClick={() => setCancelId(leave._id)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                            title="Cancel leave">
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination?.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button disabled={!pagination.hasPrevPage}
                                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                className="btn-secondary btn-sm disabled:opacity-30">
                                <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-slate-400 text-sm px-2">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button disabled={!pagination.hasNextPage}
                                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                className="btn-secondary btn-sm disabled:opacity-30">
                                <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Details Modal ────────────────────────────────────── */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Leave Details">
                {selected && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <LeaveTypeBadge type={selected.leaveType} />
                            <StatusBadge status={selected.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                { label: 'Start Date', val: formatDate(selected.startDate) },
                                { label: 'End Date', val: formatDate(selected.endDate) },
                                { label: 'Duration', val: `${selected.totalDays} day${selected.totalDays !== 1 ? 's' : ''}` },
                                { label: 'Applied On', val: formatDate(selected.createdAt) },
                            ].map(({ label, val }) => (
                                <div key={label} className="p-3 rounded-xl bg-surface-900/60">
                                    <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                                    <p className="text-white font-medium">{val}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 rounded-xl bg-surface-900/60">
                            <p className="text-slate-500 text-xs mb-1">Reason</p>
                            <p className="text-slate-200 text-sm">{selected.reason}</p>
                        </div>
                        {selected.reviewComment && (
                            <div className="p-3 rounded-xl bg-surface-900/60">
                                <p className="text-slate-500 text-xs mb-1">Manager's Comment</p>
                                <p className="text-slate-200 text-sm">{selected.reviewComment}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── Cancel Confirmation Modal ─────────────────────── */}
            <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Leave" size="sm">
                <p className="text-slate-300 text-sm mb-6">
                    Are you sure you want to cancel this leave request? This action cannot be undone.
                    {leaves.find(l => l._id === cancelId)?.status === 'approved'
                        ? ' Your leave balance will be restored.' : ''}
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setCancelId(null)} className="btn-secondary flex-1">Keep It</button>
                    <button onClick={handleCancel} disabled={cancelling} className="btn-danger flex-1">
                        {cancelling ? <span className="spinner w-4 h-4" /> : 'Yes, Cancel'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default MyLeaves;
