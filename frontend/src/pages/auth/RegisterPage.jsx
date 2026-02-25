import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineShieldCheck, HiOutlineMail, HiOutlineLockClosed,
    HiOutlineUser, HiOutlineEye, HiOutlineEyeOff, HiOutlineOfficeBuilding,
} from 'react-icons/hi';

// ── Field component OUTSIDE the page (critical — avoids remount on every keystroke) ──
const Field = ({ name, label, type = 'text', icon: Icon, placeholder, value, onChange, error, showPass, onTogglePass }) => (
    <div>
        <label className="label">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
                type={name === 'password' || name === 'confirm' ? (showPass ? 'text' : 'password') : type}
                name={name}
                value={value}
                onChange={onChange}
                className={`input pl-10 ${error ? 'input-error' : ''}`}
                placeholder={placeholder}
                autoComplete={name === 'password' || name === 'confirm' ? 'new-password' : 'on'}
            />
            {(name === 'password' || name === 'confirm') && (
                <button
                    type="button"
                    onClick={onTogglePass}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 dark:hover:text-slate-200"
                >
                    {showPass ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
            )}
        </div>
        {error && <p className="form-error">{error}</p>}
    </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirm: '', department: '', position: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Full name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
        if (!/\d/.test(form.password)) errs.password = 'Password must contain at least one number';
        if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        const { confirm, ...payload } = form;
        const res = await register(payload);
        setLoading(false);
        if (res?.success === false) {
            setErrors({ general: res.message });
        } else {
            navigate('/');
        }
    };

    // shared props for each field
    const fieldProps = { onChange: handleChange, showPass, onTogglePass: () => setShowPass(p => !p) };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-surface-950 flex items-center justify-center p-6 transition-colors">
            <div className="w-full max-w-lg animate-fade-in">

                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow">
                        <HiOutlineShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white font-bold">LeaveTrack</h1>
                        <p className="text-slate-500 text-xs">HR Management System</p>
                    </div>
                </div>

                <div className="card p-8">
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold mb-1">Create your account</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Join as an employee and start tracking your leaves
                    </p>

                    {errors.general && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Field name="name" label="Full Name" icon={HiOutlineUser}
                                    placeholder="John Smith" value={form.name} error={errors.name} {...fieldProps} />
                            </div>
                            <div className="col-span-2">
                                <Field name="email" label="Email" type="email" icon={HiOutlineMail}
                                    placeholder="john@company.com" value={form.email} error={errors.email} {...fieldProps} />
                            </div>
                            <Field name="department" label="Department" icon={HiOutlineOfficeBuilding}
                                placeholder="Engineering" value={form.department} error={errors.department} {...fieldProps} />
                            <Field name="position" label="Position" icon={HiOutlineUser}
                                placeholder="Software Engineer" value={form.position} error={errors.position} {...fieldProps} />
                            <div className="col-span-2">
                                <Field name="password" label="Password" icon={HiOutlineLockClosed}
                                    placeholder="Min 6 chars + number" value={form.password} error={errors.password} {...fieldProps} />
                            </div>
                            <div className="col-span-2">
                                <Field name="confirm" label="Confirm Password" icon={HiOutlineLockClosed}
                                    placeholder="Repeat password" value={form.confirm} error={errors.confirm} {...fieldProps} />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full mt-2">
                            {loading && <span className="spinner w-4 h-4" />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-5">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
