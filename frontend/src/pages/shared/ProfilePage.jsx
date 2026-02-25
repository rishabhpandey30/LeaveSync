import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLeave } from '../../context/LeaveContext';
import api from '../../api/axios';
import Avatar from '../../components/common/Avatar';
import { RoleBadge } from '../../components/common/Badge';
import toast from 'react-hot-toast';
import {
    HiOutlineUser, HiOutlineLockClosed, HiOutlineOfficeBuilding,
    HiOutlineMail, HiOutlinePhone, HiOutlineEye, HiOutlineEyeOff,
    HiOutlineCheckCircle, HiOutlineClipboardList, HiOutlineCalendar,
} from 'react-icons/hi';

const Section = ({ title, icon: Icon, children }) => (
    <div className="card p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
            <Icon className="w-4 h-4 text-primary-400" />
            <h2 className="text-white font-semibold text-sm">{title}</h2>
        </div>
        {children}
    </div>
);

const ProfilePage = () => {
    const { user, updateUserInContext, refreshUser } = useAuth();
    const { balance } = useLeave();

    // ── Profile form ──────────────────────────────────────────────────────────
    const [profile, setProfile] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        department: user?.department || '',
        position: user?.position || '',
    });
    const [profileLoading, setProfileLoading] = useState(false);

    const handleProfileChange = e => setProfile(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const { data } = await api.put('/auth/profile', profile);
            if (data.success) {
                updateUserInContext(data.data);
                toast.success('Profile updated successfully!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Password form ─────────────────────────────────────────────────────────
    const [passFrm, setPassFrm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passErrs, setPassErrs] = useState({});
    const [passLoading, setPassLoading] = useState(false);
    const [showPass, setShowPass] = useState({ current: false, newP: false, confirm: false });

    const handlePassChange = e => {
        setPassFrm(p => ({ ...p, [e.target.name]: e.target.value }));
        if (passErrs[e.target.name]) setPassErrs(e => ({ ...e, [e.target.name]: '' }));
    };

    const validatePass = () => {
        const errs = {};
        if (!passFrm.currentPassword) errs.currentPassword = 'Current password is required';
        if (passFrm.newPassword.length < 6) errs.newPassword = 'Minimum 6 characters';
        if (!/\d/.test(passFrm.newPassword)) errs.newPassword = 'Must contain at least one number';
        if (passFrm.newPassword !== passFrm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        return errs;
    };

    const handlePassSubmit = async (e) => {
        e.preventDefault();
        const errs = validatePass();
        if (Object.keys(errs).length) { setPassErrs(errs); return; }
        setPassLoading(true);
        try {
            const { data } = await api.put('/auth/change-password', {
                currentPassword: passFrm.currentPassword,
                newPassword: passFrm.newPassword,
            });
            if (data.success) {
                toast.success('Password changed successfully!');
                setPassFrm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setPassLoading(false);
        }
    };

    const bal = balance || user?.leaveBalance || {};

    return (
        <div className="page-container animate-fade-in max-w-4xl">
            <div className="page-header">
                <h1 className="page-title">Profile & Settings</h1>
                <p className="page-subtitle">Manage your account information and preferences</p>
            </div>

            {/* ── Profile Hero ─────────────────────────────────────── */}
            <div className="card p-6 mb-6 flex items-center gap-5 flex-wrap">
                <Avatar name={user?.name} size="xl" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-white text-xl font-bold">{user?.name}</h2>
                        <RoleBadge role={user?.role} />
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                        {user?.position && `${user.position} · `}{user?.department}
                    </p>
                </div>
                {/* Leave Balance Summary */}
                <div className="flex gap-4">
                    {[
                        { label: 'Annual', val: bal.annual ?? 20, color: 'text-blue-400' },
                        { label: 'Sick', val: bal.sick ?? 10, color: 'text-rose-400' },
                        { label: 'Casual', val: bal.casual ?? 5, color: 'text-violet-400' },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="text-center">
                            <p className={`${color} text-2xl font-bold`}>{val}</p>
                            <p className="text-slate-500 text-xs">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Profile Info Form ─────────────────────────────── */}
                <Section title="Personal Information" icon={HiOutlineUser}>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label className="label">Full Name</label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input name="name" value={profile.name} onChange={handleProfileChange}
                                    className="input pl-10" placeholder="John Smith" required />
                            </div>
                        </div>

                        <div>
                            <label className="label">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input type="email" value={user?.email} disabled className="input pl-10 opacity-50 cursor-not-allowed"
                                    title="Email cannot be changed" />
                            </div>
                            <p className="text-slate-600 text-xs mt-1">Email address cannot be changed</p>
                        </div>

                        <div>
                            <label className="label">Phone Number</label>
                            <div className="relative">
                                <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input name="phone" value={profile.phone} onChange={handleProfileChange}
                                    className="input pl-10" placeholder="+1 234 567 8900" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Department</label>
                                <div className="relative">
                                    <HiOutlineOfficeBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input name="department" value={profile.department} onChange={handleProfileChange}
                                        className="input pl-10" placeholder="Engineering" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Position</label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input name="position" value={profile.position} onChange={handleProfileChange}
                                        className="input pl-10" placeholder="Software Engineer" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={profileLoading} className="btn-primary w-full">
                            {profileLoading ? <span className="spinner w-4 h-4" /> : <HiOutlineCheckCircle className="w-4 h-4" />}
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </Section>

                {/* ── Change Password ───────────────────────────────── */}
                <div className="space-y-6">
                    <Section title="Change Password" icon={HiOutlineLockClosed}>
                        <form onSubmit={handlePassSubmit} className="space-y-4">
                            {[
                                { name: 'currentPassword', label: 'Current Password', key: 'current' },
                                { name: 'newPassword', label: 'New Password', key: 'newP' },
                                { name: 'confirmPassword', label: 'Confirm Password', key: 'confirm' },
                            ].map(({ name, label, key }) => (
                                <div key={name}>
                                    <label className="label">{label}</label>
                                    <div className="relative">
                                        <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type={showPass[key] ? 'text' : 'password'}
                                            name={name} value={passFrm[name]} onChange={handlePassChange}
                                            className={`input pl-10 pr-10 ${passErrs[name] ? 'border-red-500/50' : ''}`}
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                            {showPass[key] ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passErrs[name] && <p className="form-error">{passErrs[name]}</p>}
                                </div>
                            ))}
                            <button type="submit" disabled={passLoading} className="btn-primary w-full">
                                {passLoading ? <span className="spinner w-4 h-4" /> : <HiOutlineLockClosed className="w-4 h-4" />}
                                {passLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </Section>

                    {/* Account Info */}
                    <Section title="Account Details" icon={HiOutlineCalendar}>
                        <div className="space-y-2">
                            {[
                                { label: 'Member Since', val: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
                                { label: 'Account Status', val: user?.isActive ? '✅ Active' : '❌ Inactive' },
                                { label: 'Role', val: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
                                { label: 'Manager', val: user?.manager?.name || 'Not assigned' },
                            ].map(({ label, val }) => (
                                <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-sm">
                                    <span className="text-slate-400">{label}</span>
                                    <span className="text-white font-medium text-right">{val}</span>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
