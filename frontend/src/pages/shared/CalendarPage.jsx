import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useLeave } from '../../context/LeaveContext';
import { useAuth } from '../../context/AuthContext';
import { LeaveTypeBadge, StatusBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import {
    HiOutlineCalendar, HiOutlineFilter, HiOutlineX,
    HiOutlineChevronLeft, HiOutlineChevronRight,
} from 'react-icons/hi';

// ── Event colour map ───────────────────────────────────────────────────────────
const EVENT_COLORS = {
    annual_approved: { bg: '#3b82f6', border: '#2563eb' },
    annual_pending: { bg: '#60a5fa', border: '#3b82f6' },
    sick_approved: { bg: '#f43f5e', border: '#e11d48' },
    sick_pending: { bg: '#fb7185', border: '#f43f5e' },
    casual_approved: { bg: '#8b5cf6', border: '#7c3aed' },
    casual_pending: { bg: '#a78bfa', border: '#8b5cf6' },
    unpaid_approved: { bg: '#6b7280', border: '#4b5563' },
    unpaid_pending: { bg: '#9ca3af', border: '#6b7280' },
    rejected: { bg: '#374151', border: '#4b5563' },
    cancelled: { bg: '#374151', border: '#4b5563' },
};

const getEventColor = (type, status) => {
    if (status === 'rejected' || status === 'cancelled') return EVENT_COLORS[status];
    return EVENT_COLORS[`${type}_${status}`] || { bg: '#6366f1', border: '#4f46e5' };
};

// ── Small legend ───────────────────────────────────────────────────────────────
const Legend = () => (
    <div className="flex flex-wrap gap-3 text-xs">
        {[
            { label: 'Annual', color: '#3b82f6' }, { label: 'Sick', color: '#f43f5e' },
            { label: 'Casual', color: '#8b5cf6' }, { label: 'Unpaid', color: '#6b7280' },
            { label: 'Pending', color: '#94a3b8', dashed: true },
        ].map(({ label, color, dashed }) => (
            <div key={label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm border ${dashed ? 'border-dashed' : 'border-transparent'}`}
                    style={{ backgroundColor: dashed ? 'transparent' : color, borderColor: dashed ? color : 'transparent' }} />
                <span className="text-slate-400">{label}</span>
            </div>
        ))}
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const CalendarPage = () => {
    const calRef = useRef(null);
    const { calendarEvents, fetchCalendarEvents, loading } = useLeave();
    const { isAdmin, isManager } = useAuth();

    const [view, setView] = useState('dayGridMonth');
    const [title, setTitle] = useState('');
    const [popup, setPopup] = useState(null);   // hovered / clicked event
    const [filters, setFilters] = useState({ status: '' });

    useEffect(() => { fetchCalendarEvents(); }, []);

    // ── Convert backend events to FullCalendar format ─────────────────────────
    const fcEvents = calendarEvents
        .filter(ev => !filters.status || ev.extendedProps?.status === filters.status)
        .map((ev) => {
            const status = ev.extendedProps?.status || 'pending';
            const type = ev.extendedProps?.leaveType || 'annual';
            const colors = getEventColor(type, status);
            return {
                ...ev,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                textColor: '#fff',
                // FullCalendar end is exclusive — add 1 day for multi-day display
                end: ev.end
                    ? new Date(new Date(ev.end).getTime() + 86400000).toISOString().split('T')[0]
                    : undefined,
            };
        });

    const updateTitle = () => {
        const api = calRef.current?.getApi();
        if (api) setTitle(api.view.title);
    };

    const navigate = (dir) => {
        const api = calRef.current?.getApi();
        if (!api) return;
        dir === 'prev' ? api.prev() : api.next();
        updateTitle();
    };

    const goToday = () => {
        const api = calRef.current?.getApi();
        if (!api) return;
        api.today();
        updateTitle();
    };

    const switchView = (v) => {
        const api = calRef.current?.getApi();
        if (!api) return;
        api.changeView(v);
        setView(v);
        updateTitle();
    };

    return (
        <div className="page-container animate-fade-in">
            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="page-header">
                <h1 className="page-title">Leave Calendar</h1>
                <p className="page-subtitle">
                    {isAdmin || isManager ? 'Team & system-wide leave overview' : 'Your personal leave calendar'}
                </p>
            </div>

            {/* ── Toolbar ─────────────────────────────────────────── */}
            <div className="card p-3 mb-5 flex flex-wrap items-center gap-3">
                {/* Navigate */}
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate('prev')} className="btn-ghost p-2">
                        <HiOutlineChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={goToday} className="btn-secondary btn-sm">Today</button>
                    <button onClick={() => navigate('next')} className="btn-ghost p-2">
                        <HiOutlineChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Dynamic title */}
                <h2 className="text-white font-semibold text-sm flex-1 text-center lg:text-left">{title}</h2>

                {/* Status filter */}
                <div className="flex items-center gap-2">
                    <HiOutlineFilter className="w-3.5 h-3.5 text-slate-500" />
                    <select value={filters.status}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                        className="select w-32 py-1.5 text-xs">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* View switchers */}
                <div className="flex items-center bg-surface-900/60 rounded-xl p-0.5 border border-white/5">
                    {[
                        { v: 'dayGridMonth', label: 'Month' },
                        { v: 'timeGridWeek', label: 'Week' },
                        { v: 'listMonth', label: 'List' },
                    ].map(({ v, label }) => (
                        <button key={v} onClick={() => switchView(v)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                ${view === v ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Legend ──────────────────────────────────────────── */}
            <div className="mb-4 px-1">
                <Legend />
            </div>

            {/* ── Calendar ────────────────────────────────────────── */}
            <div className="card p-4 relative">
                {loading && (
                    <div className="absolute inset-0 bg-surface-900/60 rounded-2xl z-10 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-7 h-7 border-2 border-white/10 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                )}
                <FullCalendar
                    ref={calRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    events={fcEvents}
                    headerToolbar={false}
                    height="auto"
                    aspectRatio={1.6}
                    datesSet={updateTitle}
                    eventClick={({ event }) => {
                        setPopup({
                            id: event.id,
                            title: event.title,
                            start: event.startStr,
                            end: event.endStr,
                            status: event.extendedProps?.status,
                            leaveType: event.extendedProps?.leaveType,
                            employee: event.extendedProps?.employee,
                            reason: event.extendedProps?.reason,
                            totalDays: event.extendedProps?.totalDays,
                            color: event.backgroundColor,
                        });
                    }}
                    eventMouseEnter={({ event, el }) => {
                        el.style.cursor = 'pointer';
                    }}
                    eventContent={({ event }) => (
                        <div className="px-1.5 py-0.5 truncate text-xs font-medium">
                            {event.title}
                        </div>
                    )}
                    dayMaxEvents={3}
                    moreLinkContent={({ num }) => (
                        <span className="text-primary-400 text-xs font-medium">+{num} more</span>
                    )}
                    nowIndicator
                    selectable
                    weekends
                    firstDay={1}
                />
            </div>

            {/* ── Event Popup ──────────────────────────────────────── */}
            {popup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setPopup(null)}
                >
                    <div
                        className="bg-surface-800 border border-white/8 rounded-2xl shadow-card-hover w-full max-w-sm animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Coloured top strip */}
                        <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: popup.color }} />

                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-white font-semibold">{popup.employee || popup.title}</p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <LeaveTypeBadge type={popup.leaveType} />
                                        <StatusBadge status={popup.status} />
                                    </div>
                                </div>
                                <button onClick={() => setPopup(null)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div className="p-2.5 rounded-xl bg-surface-900/60">
                                    <p className="text-slate-500 text-xs">From</p>
                                    <p className="text-white font-medium">{formatDate(popup.start)}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-surface-900/60">
                                    <p className="text-slate-500 text-xs">To</p>
                                    <p className="text-white font-medium">
                                        {popup.end
                                            ? formatDate(new Date(new Date(popup.end).getTime() - 86400000))
                                            : formatDate(popup.start)}
                                    </p>
                                </div>
                                {popup.totalDays && (
                                    <div className="p-2.5 rounded-xl bg-surface-900/60 col-span-2">
                                        <p className="text-slate-500 text-xs">Duration</p>
                                        <p className="text-white font-medium">{popup.totalDays} day{popup.totalDays !== 1 ? 's' : ''}</p>
                                    </div>
                                )}
                            </div>

                            {popup.reason && (
                                <div className="p-3 rounded-xl bg-surface-900/60">
                                    <p className="text-slate-500 text-xs mb-1">Reason</p>
                                    <p className="text-slate-200 text-sm">{popup.reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
