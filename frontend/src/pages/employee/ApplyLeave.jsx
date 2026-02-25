import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeave } from '../../context/LeaveContext';
import { useAuth } from '../../context/AuthContext';
import { LEAVE_TYPES } from '../../utils/helpers';
import { HiOutlineCalendar, HiOutlineDocumentText, HiOutlineInformationCircle } from 'react-icons/hi';

const ApplyLeave = () => {
    const { applyLeave } = useLeave();
    const { user } = useAuth();
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false,
        halfDayPeriod: 'morning',
        emergencyContact: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const bal = user?.leaveBalance || {};

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            // Auto-set endDate = startDate for half-day
            ...(name === 'isHalfDay' && checked ? { endDate: form.startDate } : {}),
        }));
        if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
    };

    const totalDays = () => {
        if (form.isHalfDay) return 0.5;
        if (!form.startDate || !form.endDate) return 0;
        const diff = (new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24);
        return diff >= 0 ? diff + 1 : 0;
    };

    const validate = () => {
        const errs = {};
        if (!form.startDate) errs.startDate = 'Start date is required';
        if (!form.isHalfDay && !form.endDate) errs.endDate = 'End date is required';
        if (!form.isHalfDay && form.endDate < form.startDate) errs.endDate = 'End date must be after start date';
        if (!form.reason.trim()) errs.reason = 'Reason is required';
        if (form.reason.trim().length < 10) errs.reason = 'Reason must be at least 10 characters';
        const days = totalDays();
        const available = bal[form.leaveType] ?? (form.leaveType === 'annual' ? 20 : form.leaveType === 'sick' ? 10 : 5);
        if (form.leaveType !== 'unpaid' && days > available) {
            errs.leaveType = `Insufficient balance. Available: ${available} day(s)`;
        }
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        const payload = {
            leaveType: form.leaveType,
            startDate: form.startDate,
            endDate: form.isHalfDay ? form.startDate : form.endDate,
            reason: form.reason,
            isHalfDay: form.isHalfDay,
            halfDayPeriod: form.isHalfDay ? form.halfDayPeriod : null,
            emergencyContact: form.emergencyContact,
        };
        const res = await applyLeave(payload);
        setLoading(false);
        if (res?.success) navigate('/employee/leaves');
    };

    const days = totalDays();
    const colors = { annual: 'text-blue-400', sick: 'text-rose-400', casual: 'text-violet-400', unpaid: 'text-slate-400' };

    return (
        <div className="page-container animate-fade-in max-w-3xl">
            <div className="page-header">
                <h1 className="page-title">Apply for Leave</h1>
                <p className="page-subtitle">Submit a new leave request for manager approval</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Form ─────────────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="card p-6 space-y-5">

                        {/* Leave Type */}
                        <div>
                            <label className="label">Leave Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LEAVE_TYPES.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => { setForm(f => ({ ...f, leaveType: value })); setErrors(e => ({ ...e, leaveType: '' })); }}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all text-left
                      ${form.leaveType === value
                                                ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                                                : 'bg-surface-900/40 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                                            }`}
                                    >
                                        <div className="font-semibold">{label}</div>
                                        <div className="text-xs mt-0.5 opacity-70">
                                            Balance: <span className={colors[value]}>
                                                {value === 'unpaid' ? '∞' : `${bal[value] ?? (value === 'annual' ? 20 : value === 'sick' ? 10 : 5)} days`}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {errors.leaveType && <p className="form-error mt-2">{errors.leaveType}</p>}
                        </div>

                        {/* Half-day toggle */}
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isHalfDay ? 'bg-primary-600' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isHalfDay ? 'translate-x-5' : 'translate-x-0'}`} />
                                    <input type="checkbox" name="isHalfDay" checked={form.isHalfDay} onChange={handleChange} className="sr-only" />
                                </div>
                                <span className="text-slate-300 text-sm font-medium">Half Day</span>
                            </label>
                            {form.isHalfDay && (
                                <div className="mt-3 flex gap-3">
                                    {['morning', 'afternoon'].map((p) => (
                                        <button key={p} type="button"
                                            onClick={() => setForm(f => ({ ...f, halfDayPeriod: p }))}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all
                        ${form.halfDayPeriod === p
                                                    ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                                                    : 'bg-surface-900/40 border-white/5 text-slate-400 hover:border-white/20'}`}>
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Start Date</label>
                                <div className="relative">
                                    <HiOutlineCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input type="date" name="startDate" value={form.startDate} min={today}
                                        onChange={handleChange} className={`input pl-10 ${errors.startDate ? 'border-red-500/50' : ''}`} />
                                </div>
                                {errors.startDate && <p className="form-error">{errors.startDate}</p>}
                            </div>

                            {!form.isHalfDay && (
                                <div>
                                    <label className="label">End Date</label>
                                    <div className="relative">
                                        <HiOutlineCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input type="date" name="endDate" value={form.endDate} min={form.startDate || today}
                                            onChange={handleChange} className={`input pl-10 ${errors.endDate ? 'border-red-500/50' : ''}`} />
                                    </div>
                                    {errors.endDate && <p className="form-error">{errors.endDate}</p>}
                                </div>
                            )}
                        </div>

                        {/* Duration preview */}
                        {days > 0 && (
                            <div className="p-3 rounded-xl bg-primary-600/10 border border-primary-500/20 flex items-center gap-2 text-sm">
                                <HiOutlineInformationCircle className="w-4 h-4 text-primary-400 flex-shrink-0" />
                                <span className="text-primary-300">
                                    Duration: <strong>{days} {days === 1 ? 'day' : 'days'}</strong>
                                    {form.isHalfDay ? ` (${form.halfDayPeriod})` : ''}
                                </span>
                            </div>
                        )}

                        {/* Reason */}
                        <div>
                            <label className="label">
                                Reason <span className="text-slate-600 font-normal">(min 10 characters)</span>
                            </label>
                            <div className="relative">
                                <HiOutlineDocumentText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                                <textarea name="reason" value={form.reason} onChange={handleChange} rows={4}
                                    className={`input pl-10 resize-none ${errors.reason ? 'border-red-500/50' : ''}`}
                                    placeholder="Describe the reason for your leave request..." />
                            </div>
                            <div className="flex justify-between mt-1">
                                {errors.reason
                                    ? <p className="form-error">{errors.reason}</p>
                                    : <span />}
                                <span className={`text-xs ${form.reason.length < 10 ? 'text-slate-600' : 'text-emerald-500'}`}>
                                    {form.reason.length}/500
                                </span>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <label className="label">Emergency Contact <span className="text-slate-600 font-normal">(optional)</span></label>
                            <input type="text" name="emergencyContact" value={form.emergencyContact}
                                onChange={handleChange} className="input" placeholder="+1 234 567 8900" />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="btn-primary flex-1">
                                {loading ? <span className="spinner w-4 h-4" /> : null}
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Sidebar Info ──────────────────────────────────── */}
                <div className="space-y-4">
                    <div className="card p-5">
                        <h3 className="text-white font-semibold mb-3 text-sm">Current Balance</h3>
                        {[
                            { label: 'Annual', val: bal.annual ?? 20, color: 'text-blue-400' },
                            { label: 'Sick', val: bal.sick ?? 10, color: 'text-rose-400' },
                            { label: 'Casual', val: bal.casual ?? 5, color: 'text-violet-400' },
                        ].map(({ label, val, color }) => (
                            <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-slate-400 text-sm">{label}</span>
                                <span className={`${color} font-bold text-sm`}>{val} days</span>
                            </div>
                        ))}
                    </div>

                    <div className="card p-5">
                        <h3 className="text-white font-semibold mb-3 text-sm">Policy Reminders</h3>
                        <ul className="space-y-2 text-xs text-slate-400">
                            <li className="flex items-start gap-2"><span className="text-primary-400 mt-0.5">•</span>Apply at least 2 days in advance for planned leaves</li>
                            <li className="flex items-start gap-2"><span className="text-primary-400 mt-0.5">•</span>Sick leave can be applied retroactively within 3 days</li>
                            <li className="flex items-start gap-2"><span className="text-primary-400 mt-0.5">•</span>Attach medical certificate for sick leave &gt; 3 days</li>
                            <li className="flex items-start gap-2"><span className="text-primary-400 mt-0.5">•</span>Manager approval required for all leave types</li>
                            <li className="flex items-start gap-2"><span className="text-primary-400 mt-0.5">•</span>Unused annual leave expires at year end</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeave;
