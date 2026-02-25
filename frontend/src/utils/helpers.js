import { format, formatDistanceToNow, isValid, parseISO, differenceInDays } from 'date-fns';

// ── Date Formatting ───────────────────────────────────────────────────────────
export const formatDate = (date, fmt = 'MMM dd, yyyy') => {
    if (!date) return '—';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, fmt) : '—';
};

export const formatDateShort = (date) => formatDate(date, 'dd MMM');
export const formatDateTime = (date) => formatDate(date, 'MMM dd, yyyy h:mm a');
export const timeAgo = (date) => {
    if (!date) return '—';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
};

export const daysBetween = (start, end) => {
    const s = typeof start === 'string' ? parseISO(start) : start;
    const e = typeof end === 'string' ? parseISO(end) : end;
    return Math.abs(differenceInDays(e, s)) + 1;
};

// ── String Helpers ────────────────────────────────────────────────────────────
export const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

export const initials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const truncate = (str, max = 60) =>
    str && str.length > max ? str.slice(0, max) + '…' : str || '';

// ── Status Helpers ────────────────────────────────────────────────────────────
export const STATUS_COLORS = {
    pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
    approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    rejected: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
    cancelled: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' },
};

export const LEAVE_TYPE_COLORS = {
    annual: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    sick: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    casual: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
    unpaid: { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
};

export const REIMBURSEMENT_TYPE_COLORS = {
    travel: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    food: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    office_supplies: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
    internet: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    other: { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' },
};

export const ROLES = {
    admin: { label: 'Admin', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
    manager: { label: 'Manager', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
    employee: { label: 'Employee', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
};

export const LEAVE_TYPES = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
];

export const REIMBURSEMENT_TYPES = [
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food & Meals' },
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'internet', label: 'Internet' },
    { value: 'other', label: 'Other' },
];

export const LEAVE_STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
];

// ── Number / Data helpers ─────────────────────────────────────────────────────
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const safeDiv = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

export const pluralize = (count, word) => `${count} ${word}${count !== 1 ? 's' : ''}`;

// ── Error Message Extractor ───────────────────────────────────────────────────
export const getErrorMessage = (err) =>
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.';

// ── Avatar background colors (deterministic by name) ─────────────────────────
const AVATAR_COLORS = [
    'bg-indigo-600', 'bg-violet-600', 'bg-blue-600',
    'bg-emerald-600', 'bg-rose-600', 'bg-amber-600',
    'bg-teal-600', 'bg-cyan-600', 'bg-pink-600',
];
export const avatarColor = (name = '') => {
    const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
};
