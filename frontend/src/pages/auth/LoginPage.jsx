import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineShieldCheck, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(form.email, form.password);
        setLoading(false);
        if (res?.success === false) {
            setError(res.message);
        } else {
            // Navigation handled by AuthContext + RootRedirect
            navigate('/');
        }
    };

    const fillDemo = (email, password) => setForm({ email, password });

    return (
        <div className="min-h-screen bg-surface-950 flex">
            {/* ── Left Panel — Brand ──────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-surface-900" />
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 75% 20%, #8b5cf6 0%, transparent 50%)' }} />
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-glow-md">
                            <HiOutlineShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white text-2xl font-bold">LeaveTrack</h1>
                            <p className="text-primary-300 text-sm">HR Management System</p>
                        </div>
                    </div>
                    <h2 className="text-white text-4xl font-bold leading-tight mb-4">
                        Manage leaves<br />smarter & faster
                    </h2>
                    <p className="text-black text-lg leading-relaxed max-w-md">
                        Streamline your entire HR leave workflow — from applications to approvals, all in one place.
                    </p>
                    <div className="mt-12 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Role-Based Access', icon: '🔐' },
                            { label: 'Real-time Calendar', icon: '📅' },
                            { label: 'Smart Analytics', icon: '📊' },
                            { label: 'Leave Tracking', icon: '✅' },
                        ].map((f) => (
                            <div key={f.label} className="flex items-center gap-2 text-black text-sm">
                                <span>{f.icon}</span>
                                <span>{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Panel — Login Form ───────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                            <HiOutlineShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-white font-bold text-xl">LeaveTrack</h1>
                    </div>

                    <h2 className="text-white text-2xl font-bold mb-1">Welcome back</h2>
                    <p className="text-slate-400 text-sm mb-8">Sign in to your account to continue</p>

                    {/* Demo credentials */}
                    <div className="mb-6 p-4 rounded-xl bg-surface-800 border border-white/5">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { role: 'Admin', email: 'admin@company.com', pass: 'Admin@123' },
                                { role: 'Manager', email: 'sarah.manager@company.com', pass: 'Manager@123' },
                                { role: 'Employee', email: 'alice@company.com', pass: 'Employee@123' },
                            ].map((d) => (
                                <button
                                    key={d.role}
                                    type="button"
                                    onClick={() => fillDemo(d.email, d.pass)}
                                    className="py-2 px-3 rounded-lg text-xs font-medium text-center
                    bg-surface-700 text-slate-300 border border-white/5
                    hover:bg-primary-600/20 hover:text-primary-300 hover:border-primary-500/30
                    transition-all duration-200"
                                >
                                    {d.role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="label">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="input pl-10"
                                    placeholder="you@company.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((p) => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPass ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary btn-lg w-full mt-2"
                        >
                            {loading ? <span className="spinner w-4 h-4" /> : null}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
