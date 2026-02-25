import { useEffect, useState } from 'react';
import { useReimbursement } from '../../context/ReimbursementContext';
import { StatusBadge, ReimbursementTypeBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import Modal from '../../components/common/Modal';

const TeamReimbursements = () => {
    const { reimbursements, loading, fetchReimbursements, approveReimbursement, rejectReimbursement } = useReimbursement();

    // Modal state for reject reason
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null, reimbursementId: null });
    const [reviewComment, setReviewComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchReimbursements();
    }, [fetchReimbursements]);

    const handleAction = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        const { type, reimbursementId } = actionModal;

        let res;
        if (type === 'approve') {
            res = await approveReimbursement(reimbursementId, reviewComment);
        } else {
            res = await rejectReimbursement(reimbursementId, reviewComment);
        }

        if (res.success) {
            closeModal();
        }
        setActionLoading(false);
    };

    const openActionModal = (type, id) => {
        setActionModal({ isOpen: true, type, reimbursementId: id });
        setReviewComment('');
    };

    const closeModal = () => {
        setActionModal({ isOpen: false, type: null, reimbursementId: null });
        setReviewComment('');
    };

    if (loading && reimbursements.length === 0) return <LoadingSpinner />;

    return (
        <div className="page-container p-4 md:p-6 mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Team Claims</h1>

            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow overflow-hidden border border-slate-200 dark:border-white/10">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-900/50">
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date / Type</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {reimbursements.map(r => (
                                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                                                {r.employee?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{r.employee?.name}</p>
                                                <p className="text-xs text-slate-500">{r.employee?.department}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1.5 align-start">
                                            <span className="font-medium text-slate-900 dark:text-white inline-block">
                                                {formatDate(r.expenseDate)}
                                            </span>
                                            <div>
                                                <ReimbursementTypeBadge type={r.type} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                                        ${r.amount.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-6 max-w-xs">
                                        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                            {r.description}
                                        </p>
                                        <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline mt-1 inline-block">
                                            View Receipt
                                        </a>
                                    </td>
                                    <td className="py-4 px-6">
                                        <StatusBadge status={r.status} />
                                        {r.reviewedBy && (
                                            <p className="text-[10px] text-slate-400 mt-1.5">
                                                by {r.reviewedBy.name}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {r.status === 'pending' ? (
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => openActionModal('approve', r._id)} className="btn-sm btn-success flex items-center gap-1" title="Approve">
                                                    <HiOutlineCheck className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openActionModal('reject', r._id)} className="btn-sm btn-danger flex items-center gap-1" title="Reject">
                                                    <HiOutlineX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 dark:text-slate-500 italic">Determined</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reimbursements.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-500">
                                        No team claims found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval / Rejection Modal */}
            <Modal isOpen={actionModal.isOpen} onClose={closeModal} title={`${actionModal.type === 'approve' ? 'Approve' : 'Reject'} Claim`}>
                <form onSubmit={handleAction} className="space-y-4 pt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {actionModal.type === 'approve' ? 'Are you sure you want to approve this expense?' : 'Please provide a reason for rejecting this expense.'}
                    </p>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Comments {actionModal.type === 'reject' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="form-input w-full"
                            placeholder="Add a note..."
                            required={actionModal.type === 'reject'}
                            minLength={actionModal.type === 'reject' ? 5 : 0}
                            rows="2"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t dark:border-white/10">
                        <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                        <button type="submit" disabled={actionLoading} className={actionModal.type === 'approve' ? 'btn-success' : 'btn-danger'}>
                            {actionLoading ? 'Processing...' : `Confirm ${actionModal.type}`}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TeamReimbursements;
