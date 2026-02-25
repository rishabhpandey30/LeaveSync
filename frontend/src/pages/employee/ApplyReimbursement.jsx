import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReimbursement } from '../../context/ReimbursementContext';
import { REIMBURSEMENT_TYPES } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ApplyReimbursement = () => {
    const { applyReimbursement } = useReimbursement();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        type: 'travel',
        amount: '',
        expenseDate: '',
        description: '',
    });
    const [receiptFile, setReceiptFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                e.target.value = '';
                return;
            }
            // Check type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF, JPG, and PNG files are allowed');
                e.target.value = '';
                return;
            }
            setReceiptFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!receiptFile) {
            toast.error('Please upload a receipt document.');
            return;
        }

        setSubmitting(true);

        const payload = new FormData();
        payload.append('type', formData.type);
        payload.append('amount', Number(formData.amount));
        payload.append('expenseDate', formData.expenseDate);
        payload.append('description', formData.description);
        payload.append('receipt', receiptFile);

        const res = await applyReimbursement(payload);

        if (res.success) {
            navigate('/employee/reimbursements');
        } else {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container p-6 w-full max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Claim Expense</h1>

            <div className="bg-white dark:bg-surface-800 rounded-2xl shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Expense Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="form-select w-full"
                                required
                            >
                                {REIMBURSEMENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Expense Date</label>
                            <input
                                type="date"
                                name="expenseDate"
                                value={formData.expenseDate}
                                onChange={handleChange}
                                className="form-input w-full"
                                max={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Amount</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-slate-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="form-input w-full pl-7"
                                placeholder="0.00"
                                min="1"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="form-input w-full"
                            placeholder="Provide details about the expense..."
                            minLength="5"
                            maxLength="500"
                            required
                        ></textarea>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Receipt / Proof Document</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-white/10 border-dashed rounded-xl overflow-hidden hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors relative">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-slate-600 dark:text-slate-300 justify-center">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                        <span>Upload a file</span>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            className="sr-only"
                                            accept=".pdf,image/jpeg,image/png,image/jpg"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {receiptFile ? (
                                        <span className="font-semibold text-emerald-500 line-clamp-1">{receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    ) : (
                                        "PNG, JPG, PDF up to 5MB"
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn-ghost"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                        >
                            {submitting ? 'Submitting...' : 'Submit Claim'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ApplyReimbursement;
