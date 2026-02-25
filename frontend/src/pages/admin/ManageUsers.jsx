import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Avatar from '../../components/common/Avatar';
import { RoleBadge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { formatDate, timeAgo, ROLES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
    HiOutlineFilter, HiOutlineSearch, HiOutlineUsers,
    HiOutlineChevronLeft, HiOutlineChevronRight,
    HiOutlinePencil, HiOutlineTrash, HiOutlineSwitchHorizontal,
} from 'react-icons/hi';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({ search: '', role: '', department: '', page: 1, limit: 10 });

    const [editUser, setEditUser] = useState(null);  // modal: role, manager, balance
    const [deleteUser, setDeleteUser] = useState(null);  // confirm modal
    const [editForm, setEditForm] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchUsers(); }, [filters]);
    useEffect(() => { fetchManagers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
            );
            const { data } = await api.get(`/admin/users?${params}`);
            if (data.success) { setUsers(data.data); setPagination(data.pagination || {}); }
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    const fetchManagers = async () => {
        try {
            const { data } = await api.get('/users/managers');
            if (data.success) setManagers(data.data);
        } catch {/* silent */ }
    };

    const openEdit = (user) => {
        setEditUser(user);
        setEditForm({
            role: user.role,
            managerId: user.manager?._id || '',
            annualBalance: user.leaveBalance?.annual || 20,
        });
    };

    const handleEditSubmit = async () => {
        setSubmitting(true);
        try {
            // Change role if updated
            if (editForm.role !== editUser.role) {
                await api.put(`/admin/users/${editUser._id}/role`, { role: editForm.role });
                toast.success('Role updated');
            }
            // Assign manager if updated
            if (editForm.managerId !== (editUser.manager?._id || '')) {
                await api.put(`/admin/users/${editUser._id}/assign-manager`, { managerId: editForm.managerId });
                toast.success('Manager assigned');
            }
            // Adjust balance if changed
            if (parseInt(editForm.annualBalance) !== (editUser.leaveBalance?.annual || 20)) {
                await api.put(`/admin/users/${editUser._id}/leave-balance`, {
                    leaveType: 'annual', balance: parseInt(editForm.annualBalance)
                });
                toast.success('Balance updated');
            }
            setEditUser(null);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const { data } = await api.put(`/admin/users/${user._id}/toggle`);
            if (data.success) {
                toast.success(data.message);
                setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
            }
        } catch { toast.error('Failed to toggle status'); }
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            await api.delete(`/admin/users/${deleteUser._id}`);
            toast.success('User deleted successfully');
            setDeleteUser(null);
            fetchUsers();
        } catch { toast.error('Failed to delete user'); }
        finally { setSubmitting(false); }
    };

    const handleFilterChange = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Manage Users</h1>
                <p className="page-subtitle">Manage roles, managers, balances, and accounts</p>
            </div>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input value={filters.search} onChange={e => handleFilterChange('search', e.target.value)}
                        className="input pl-8 w-48 py-1.5 text-sm" placeholder="Search by name / email..." />
                </div>
                <select value={filters.role} onChange={e => handleFilterChange('role', e.target.value)} className="select w-32">
                    <option value="">All Roles</option>
                    {Object.entries(ROLES).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                </select>
                <select value={filters.department} onChange={e => handleFilterChange('department', e.target.value)} className="select w-40">
                    <option value="">All Departments</option>
                    {['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'].map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                {(filters.search || filters.role || filters.department) && (
                    <button onClick={() => setFilters({ search: '', role: '', department: '', page: 1, limit: 10 })}
                        className="text-primary-400 text-sm hover:text-primary-300">× Clear</button>
                )}
                {pagination?.total > 0 && (
                    <span className="text-slate-500 text-sm ml-auto">{pagination.total} users</span>
                )}
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            {loading ? <PageLoader /> : users.length === 0 ? (
                <div className="card p-12 text-center">
                    <HiOutlineUsers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No users found</p>
                </div>
            ) : (
                <>
                    <div className="table-container mb-4">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr><th>User</th><th>Role</th><th>Department</th><th>Manager</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id}>
                                            <td>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar name={u.name} size="sm" />
                                                    <div>
                                                        <p className="text-slate-200 text-sm font-medium">{u.name}</p>
                                                        <p className="text-slate-500 text-xs">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><RoleBadge role={u.role} /></td>
                                            <td className="text-slate-400 text-sm">{u.department || '—'}</td>
                                            <td className="text-slate-400 text-sm">{u.manager?.name || '—'}</td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold
                          ${u.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="text-slate-500 text-xs">{formatDate(u.createdAt, 'MMM dd, yyyy')}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEdit(u)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                                                        title="Edit user">
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(u)}
                                                        className={`p-1.5 rounded-lg transition-all ${u.isActive
                                                            ? 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                                                            : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                                        title={u.isActive ? 'Deactivate' : 'Activate'}>
                                                        <HiOutlineSwitchHorizontal className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteUser(u)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                        title="Delete user">
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {pagination?.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button disabled={!pagination.hasPrevPage} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="btn-secondary btn-sm disabled:opacity-30">
                                <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-slate-400 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                            <button disabled={!pagination.hasNextPage} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="btn-secondary btn-sm disabled:opacity-30">
                                <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Edit Modal ───────────────────────────────────────── */}
            <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`Edit: ${editUser?.name}`}>
                {editUser && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Role</label>
                                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="select">
                                    {Object.entries(ROLES).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Annual Balance (days)</label>
                                <input type="number" min="0" max="365" value={editForm.annualBalance}
                                    onChange={e => setEditForm(f => ({ ...f, annualBalance: e.target.value }))}
                                    className="input" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Assign Manager</label>
                            <select value={editForm.managerId} onChange={e => setEditForm(f => ({ ...f, managerId: e.target.value }))} className="select">
                                <option value="">No Manager</option>
                                {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.department || 'N/A'})</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleEditSubmit} disabled={submitting} className="btn-primary flex-1">
                                {submitting ? <span className="spinner w-4 h-4" /> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Delete Modal ─────────────────────────────────────── */}
            <Modal isOpen={!!deleteUser} onClose={() => setDeleteUser(null)} title="Delete User" size="sm">
                {deleteUser && (
                    <div>
                        <p className="text-slate-300 text-sm mb-2">
                            Are you sure you want to permanently delete <strong className="text-white">{deleteUser.name}</strong>?
                        </p>
                        <p className="text-red-400/70 text-xs mb-6">This will also delete all their leave records. This action is irreversible.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteUser(null)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleDelete} disabled={submitting} className="btn-danger flex-1">
                                {submitting ? <span className="spinner w-4 h-4" /> : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ManageUsers;
