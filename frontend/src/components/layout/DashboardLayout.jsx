import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { HiOutlineMenuAlt2, HiX, HiOutlineSun, HiOutlineMoon, HiOutlineShieldCheck } from 'react-icons/hi';

/* ── Animated Toggle ──────────────────────────────────────────────────────── */
export const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            className="relative flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            style={{ background: isDark ? '#4f46e5' : '#e2e8f0' }}
        >
            {/* Sun icon */}
            <HiOutlineSun className={`absolute left-1.5  top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-300
        ${isDark ? 'opacity-40 text-white' : 'opacity-100 text-amber-500'}`} />
            {/* Moon icon */}
            <HiOutlineMoon className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300
        ${isDark ? 'opacity-100 text-white' : 'opacity-30 text-slate-400'}`} />
            {/* Thumb */}
            <span
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300"
                style={{ left: isDark ? 'calc(100% - 1.625rem)' : '0.125rem' }}
            />
        </button>
    );
};

/* ── Layout ───────────────────────────────────────────────────────────────── */
const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-surface-950 transition-colors duration-300">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Desktop sidebar ───────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col">
                <Sidebar />
            </div>

            {/* ── Mobile sidebar drawer ──────────────────────────────── */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-3 right-3 z-10 p-2 rounded-xl text-slate-400 hover:text-white bg-surface-800 shadow border border-white/10"
                >
                    <HiX className="w-5 h-5" />
                </button>
                <Sidebar />
            </div>

            {/* ── Main content area ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* ── Mobile / Tablet top bar ─────────────────────────── */}
                <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between
          px-4 h-14 border-b bg-surface-900 transition-colors duration-300"
                    style={{ borderColor: 'rgb(var(--border) / 0.1)' }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl btn-ghost -ml-2"
                        aria-label="Open menu"
                    >
                        <HiOutlineMenuAlt2 className="w-5 h-5" />
                    </button>

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                            <HiOutlineShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'rgb(var(--t-primary))' }}>
                            LeaveTrack
                        </span>
                    </Link>

                    {/* Theme toggle on mobile header */}
                    <ThemeToggle />
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
