import { useEffect } from 'react';
import { useReimbursement } from '../../context/ReimbursementContext';
import { StatusBadge, ReimbursementTypeBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import { HiOutlineDocumentText } from 'react-icons/hi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MyReimbursements = () => {
    const { reimbursements, loading, fetchReimbursements } = useReimbursement();

    useEffect(() => {
        fetchReimbursements();
    }, [fetchReimbursements]);

    if (loading && reimbursements.length === 0) return <LoadingSpinner />;

    return (
        <div className="page-container p-4 md:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">My Claims</h1>

            {reimbursements.length === 0 ? (
                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow p-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10">
                    <HiOutlineDocumentText className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white">No claims found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">You haven't submitted any reimbursement requests yet.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow overflow-hidden border border-slate-200 dark:border-white/10">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-900/50">
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date/Type</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                {reimbursements.map(r => (
                                    <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {formatDate(r.expenseDate)}
                                                </span>
                                                <ReimbursementTypeBadge type={r.type} />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                                            ${r.amount.toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                                {r.description}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="py-4 px-6">
                                            <a
                                                href={r.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                                            >
                                                View Receipt
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyReimbursements;
