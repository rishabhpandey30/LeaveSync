import { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const ReimbursementContext = createContext();

export const useReimbursement = () => useContext(ReimbursementContext);

export const ReimbursementProvider = ({ children }) => {
    const [reimbursements, setReimbursements] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(null);

    const fetchReimbursements = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const { data } = await api.get('/reimbursements', { params });
            if (data.success) {
                setReimbursements(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch reimbursements');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/reimbursements/stats');
            if (data.success) setStats(data.data);
        } catch (error) {
            console.error('Failed to fetch reimbursement stats');
        }
    }, []);

    const applyReimbursement = async (formData) => {
        try {
            const { data } = await api.post('/reimbursements', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                toast.success('Reimbursement applied successfully');
                setReimbursements(prev => [data.data, ...prev]);
                fetchStats();
                return { success: true };
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to apply for reimbursement');
            return { success: false, message: error.response?.data?.message };
        }
    };

    const approveReimbursement = async (id, reviewComment) => {
        try {
            const { data } = await api.put(`/reimbursements/${id}/approve`, { reviewComment });
            if (data.success) {
                toast.success('Reimbursement approved');
                updateLocalReimbursement(id, data.data);
                return { success: true };
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve');
            return { success: false };
        }
    };

    const rejectReimbursement = async (id, reviewComment) => {
        if (!reviewComment) {
            toast.error('Rejection reason is required');
            return { success: false };
        }
        try {
            const { data } = await api.put(`/reimbursements/${id}/reject`, { reviewComment });
            if (data.success) {
                toast.success('Reimbursement rejected');
                updateLocalReimbursement(id, data.data);
                return { success: true };
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject');
            return { success: false };
        }
    };

    const updateLocalReimbursement = (id, updatedReimbursement) => {
        setReimbursements(prev => prev.map(r => r._id === id ? updatedReimbursement : r));
        fetchStats();
    };

    return (
        <ReimbursementContext.Provider value={{
            reimbursements,
            stats,
            loading,
            pagination,
            fetchReimbursements,
            fetchStats,
            applyReimbursement,
            approveReimbursement,
            rejectReimbursement
        }}>
            {children}
        </ReimbursementContext.Provider>
    );
};
