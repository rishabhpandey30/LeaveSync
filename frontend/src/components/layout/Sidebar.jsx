import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { avatarColor, initials } from '../../utils/helpers';
import { ThemeToggle } from './DashboardLayout';
import {
    HiOutlineViewGrid, HiOutlineCalendar, HiOutlineClipboardList,
    HiOutlinePlusCircle, HiOutlineUsers, HiOutlineChartBar,
    HiOutlineCog, HiOutlineLogout, HiOutlineUserGroup, HiOutlineShieldCheck,
    HiOutlineSun, HiOutlineMoon, HiOutlineCurrencyDollar,
} from 'react-icons/hi';

/* ── Single nav item ──────────────────────────────────────────────────────── */
const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span>{label}</span>
    </NavLink>
);

/* ── Section header ───────────────────────────────────────────────────────── */
const NavSection = ({ title, children }) => (
    <div className="mb-2">
        <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'rgb(var(--t-subtle))' }}>
            {title}
        </p>
        <div className="space-y-0.5">{children}</div>
    </div>
);

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
const Sidebar = () => {
    const { user, logout, isAdmin, isManager } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };
    const avatarBg = avatarColor(user?.name || '');
    const userInits = initials(user?.name || '');

    return (
        <aside className="flex flex-col h-full bg-surface-900 transition-colors duration-300"
            style={{ borderRight: '1px solid rgb(var(--border) / 0.08)' }}>

            {/* ── Logo ─────────────────────────────────────────── */}
            <div className="px-5 py-5 flex items-center gap-3"
                style={{ borderBottom: '1px solid rgb(var(--border) / 0.08)' }}>
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
                    <HiOutlineShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-sm leading-tight" style={{ color: 'rgb(var(--t-primary))' }}>
                        LeaveTrack
                    </h1>
                    <p className="text-[10px]" style={{ color: 'rgb(var(--t-subtle))' }}>HR Management</p>
                </div>
            </div>

            {/* ── Nav links ────────────────────────────────────── */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
                <NavSection title="My Space">
                    <NavItem to="/employee/dashboard" icon={HiOutlineViewGrid} label="Dashboard" />
                    <NavItem to="/employee/apply" icon={HiOutlinePlusCircle} label="Apply Leave" />
                    <NavItem to="/employee/leaves" icon={HiOutlineClipboardList} label="My Leaves" />
                    {(!isAdmin && !isManager) && (
                        <>
                            <NavItem to="/employee/apply-reimbursement" icon={HiOutlineCurrencyDollar} label="Claim Expense" />
                            <NavItem to="/employee/reimbursements" icon={HiOutlineClipboardList} label="My Claims" />
                        </>
                    )}
                    <NavItem to="/calendar" icon={HiOutlineCalendar} label="Calendar" />
                </NavSection>

                {(isManager || isAdmin) && (
                    <NavSection title="Team">
                        <NavItem to="/manager/dashboard" icon={HiOutlineChartBar} label="Team Overview" />
                        <NavItem to="/manager/team" icon={HiOutlineUserGroup} label="Team Leaves" />
                        <NavItem to="/manager/reimbursements" icon={HiOutlineCurrencyDollar} label="Team Claims" />
                    </NavSection>
                )}

                {isAdmin && (
                    <NavSection title="Admin">
                        <NavItem to="/admin/dashboard" icon={HiOutlineViewGrid} label="Admin Dashboard" />
                        <NavItem to="/admin/users" icon={HiOutlineUsers} label="Manage Users" />
                        <NavItem to="/admin/leaves" icon={HiOutlineClipboardList} label="All Leaves" />
                        <NavItem to="/admin/reimbursements" icon={HiOutlineCurrencyDollar} label="All Claims" />
                    </NavSection>
                )}

                <NavSection title="Account">
                    <NavItem to="/profile" icon={HiOutlineCog} label="Profile & Settings" />
                </NavSection>
            </nav>

            {/* ── Theme toggle row ─────────────────────────────── */}
            <div className="px-4 pb-3">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgb(var(--border) / 0.06)', border: '1px solid rgb(var(--border) / 0.08)' }}>
                    <div className="flex items-center gap-2">
                        {isDark
                            ? <HiOutlineMoon className="w-4 h-4 text-primary-400" />
                            : <HiOutlineSun className="w-4 h-4 text-amber-500" />
                        }
                        <span className="text-xs font-medium" style={{ color: 'rgb(var(--t-secondary))' }}>
                            {isDark ? 'Dark Mode' : 'Light Mode'}
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            {/* ── User footer ──────────────────────────────────── */}
            <div className="px-3 py-3" style={{ borderTop: '1px solid rgb(var(--border) / 0.08)' }}>
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors"
                    style={{ cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--border) / 0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className={`w-9 h-9 rounded-xl ${avatarBg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-bold">{userInits}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--t-primary))' }}>{user?.name}</p>
                        <p className="text-[10px] capitalize" style={{ color: 'rgb(var(--t-subtle))' }}>{user?.role} · {user?.department}</p>
                    </div>
                    <button onClick={handleLogout} title="Logout"
                        className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                        style={{ color: 'rgb(var(--t-muted))' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--t-muted))'}
                    >
                        <HiOutlineLogout className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
