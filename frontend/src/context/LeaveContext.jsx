import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── Context ───────────────────────────────────────────────────────────────────
const LeaveContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const LeaveProvider = ({ children }) => {
    const [leaves, setLeaves] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [stats, setStats] = useState(null);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({});

    // ── Fetch paginated leave list ─────────────────────────────────────────────
    const fetchLeaves = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
            );
            const { data } = await api.get(`/leaves?${params}`);
            if (data.success) {
                setLeaves(data.data);
                setPagination(data.pagination || {});
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load leaves.');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch calendar events ──────────────────────────────────────────────────
    const fetchCalendarEvents = useCallback(async (month, year) => {
        try {
            const params = month && year ? `?month=${month}&year=${year}` : '';
            const { data } = await api.get(`/leaves/calendar${params}`);
            if (data.success) setCalendarEvents(data.data);
        } catch (err) {
            toast.error('Failed to load calendar data.');
        }
    }, []);

    // ── Fetch dashboard stats ──────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/leaves/stats');
            if (data.success) setStats(data.data);
        } catch {/* silent */ }
    }, []);

    // ── Fetch leave balance ────────────────────────────────────────────────────
    const fetchBalance = useCallback(async () => {
        try {
            const { data } = await api.get('/leaves/my-balance');
            if (data.success) setBalance(data.data);
        } catch {/* silent */ }
    }, []);

    // ── Apply for leave ────────────────────────────────────────────────────────
    const applyLeave = useCallback(async (formData) => {
        try {
            const { data } = await api.post('/leaves', formData);
            if (data.success) {
                toast.success(data.message || 'Leave applied successfully!');
                await fetchLeaves();
                await fetchCalendarEvents();
                await fetchBalance();
                return { success: true, data: data.data };
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to apply for leave.';
            toast.error(msg);
            return { success: false, message: msg };
        }
    }, [fetchLeaves, fetchCalendarEvents, fetchBalance]);

    // ── Approve leave ──────────────────────────────────────────────────────────
    const approveLeave = useCallback(async (leaveId, reviewComment = '') => {
        try {
            const { data } = await api.put(`/leaves/${leaveId}/approve`, { reviewComment });
            if (data.success) {
                toast.success(data.message || 'Leave approved!');
                // Update local state without refetch
                setLeaves((prev) =>
                    prev.map((l) => (l._id === leaveId ? { ...l, status: 'approved', reviewComment } : l))
                );
                setCalendarEvents((prev) =>
                    prev.map((e) =>
                        e.id === leaveId
                            ? { ...e, extendedProps: { ...e.extendedProps, status: 'approved' }, backgroundColor: '#10B981', borderColor: '#10B981' }
                            : e
                    )
                );
                return { success: true };
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to approve leave.';
            toast.error(msg);
            return { success: false, message: msg };
        }
    }, []);

    // ── Reject leave ───────────────────────────────────────────────────────────
    const rejectLeave = useCallback(async (leaveId, reviewComment) => {
        try {
            const { data } = await api.put(`/leaves/${leaveId}/reject`, { reviewComment });
            if (data.success) {
                toast.success(data.message || 'Leave rejected.');
                setLeaves((prev) =>
                    prev.map((l) => (l._id === leaveId ? { ...l, status: 'rejected', reviewComment } : l))
                );
                setCalendarEvents((prev) =>
                    prev.map((e) =>
                        e.id === leaveId
                            ? { ...e, extendedProps: { ...e.extendedProps, status: 'rejected' }, backgroundColor: '#EF4444', borderColor: '#EF4444' }
                            : e
                    )
                );
                return { success: true };
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reject leave.';
            toast.error(msg);
            return { success: false, message: msg };
        }
    }, []);

    // ── Cancel leave ───────────────────────────────────────────────────────────
    const cancelLeave = useCallback(async (leaveId) => {
        try {
            const { data } = await api.put(`/leaves/${leaveId}/cancel`);
            if (data.success) {
                toast.success('Leave cancelled successfully.');
                setLeaves((prev) =>
                    prev.map((l) => (l._id === leaveId ? { ...l, status: 'cancelled' } : l))
                );
                await fetchBalance();
                return { success: true };
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to cancel leave.';
            toast.error(msg);
            return { success: false, message: msg };
        }
    }, [fetchBalance]);

    const value = {
        leaves,
        calendarEvents,
        stats,
        balance,
        loading,
        pagination,
        fetchLeaves,
        fetchCalendarEvents,
        fetchStats,
        fetchBalance,
        applyLeave,
        approveLeave,
        rejectLeave,
        cancelLeave,
    };

    return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
};

// ── Custom hook ───────────────────────────────────────────────────────────────
export const useLeave = () => {
    const context = useContext(LeaveContext);
    if (!context) {
        throw new Error('useLeave must be used within a LeaveProvider');
    }
    return context;
};

export default LeaveContext;
