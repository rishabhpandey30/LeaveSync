const User = require('../models/User');
const Leave = require('../models/Leave');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/admin/stats
// @desc    High-level dashboard stats card data
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalEmployees,
            totalManagers,
            totalLeaves,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            activeUsers,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'employee' }),
            User.countDocuments({ role: 'manager' }),
            Leave.countDocuments(),
            Leave.countDocuments({ status: 'pending' }),
            Leave.countDocuments({ status: 'approved' }),
            Leave.countDocuments({ status: 'rejected' }),
            User.countDocuments({ isActive: true }),
        ]);

        // Leaves by type (approved)
        const leavesByType = await Leave.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$leaveType', count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
            { $sort: { count: -1 } },
        ]);

        // Monthly leave trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const monthlyTrend = await Leave.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    total: { $sum: 1 },
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Department-wise leave distribution
        const deptStats = await Leave.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'emp',
                },
            },
            { $unwind: '$emp' },
            {
                $group: {
                    _id: '$emp.department',
                    total: { $sum: 1 },
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                },
            },
            { $sort: { total: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    employees: totalEmployees,
                    managers: totalManagers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                },
                leaves: {
                    total: totalLeaves,
                    pending: pendingLeaves,
                    approved: approvedLeaves,
                    rejected: rejectedLeaves,
                },
                leavesByType,
                monthlyTrend,
                deptStats,
            },
        });
    } catch (error) {
        console.error('GetDashboardStats Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/admin/users
// @desc    All users with full details (admin view)
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const { role, department, isActive, search, page = 1, limit = 15 } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (department) filter.department = department;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        const users = await User.find(filter)
            .select('-password')
            .populate('manager', 'name email department')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            data: users,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages },
        });
    } catch (error) {
        console.error('GetAllUsers Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/role
// @desc    Admin changes a user's role
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['employee', 'manager', 'admin'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
            });
        }

        // Admin cannot demote themselves
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role.',
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { role } },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `${user.name}'s role changed to ${role}.`,
            data: user,
        });
    } catch (error) {
        console.error('ChangeUserRole Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to change role.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/toggle
// @desc    Activate / Deactivate a user account
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        user.isActive = !user.isActive;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `${user.name}'s account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
            data: { _id: user._id, isActive: user.isActive, name: user.name },
        });
    } catch (error) {
        console.error('ToggleUserStatus Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/assign-manager
// @desc    Assign a manager to an employee
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const assignManager = async (req, res) => {
    try {
        const { managerId } = req.body;

        if (managerId) {
            const manager = await User.findById(managerId);
            if (!manager || manager.role !== 'manager') {
                return res.status(400).json({ success: false, message: 'Invalid manager ID or user is not a manager.' });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { manager: managerId || null } },
            { new: true }
        )
            .select('-password')
            .populate('manager', 'name email department');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({
            success: true,
            message: managerId
                ? `${user.name} has been assigned to manager ${user.manager.name}.`
                : `${user.name}'s manager assignment has been removed.`,
            data: user,
        });
    } catch (error) {
        console.error('AssignManager Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to assign manager.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/leave-balance
// @desc    Admin manually adjusts a user's leave balance
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const adjustLeaveBalance = async (req, res) => {
    try {
        const { annual, sick, casual } = req.body;

        const updates = {};
        if (annual !== undefined) updates['leaveBalance.annual'] = Math.max(0, parseInt(annual));
        if (sick !== undefined) updates['leaveBalance.sick'] = Math.max(0, parseInt(sick));
        if (casual !== undefined) updates['leaveBalance.casual'] = Math.max(0, parseInt(casual));

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No balance values provided.' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).select('name email leaveBalance');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Leave balance updated for ${user.name}.`,
            data: user,
        });
    } catch (error) {
        console.error('AdjustLeaveBalance Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to adjust leave balance.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/admin/users/:id
// @desc    Permanently delete a user (use isActive toggle instead)
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Also remove all their leave records
        await Leave.deleteMany({ employee: req.params.id });

        return res.status(200).json({
            success: true,
            message: `User ${user.name} and all their leave records have been deleted.`,
        });
    } catch (error) {
        console.error('DeleteUser Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/admin/leaves
// @desc    ALL leaves system-wide with full filters
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAllLeaves = async (req, res) => {
    try {
        const { status, leaveType, department, startDate, endDate, page = 1, limit = 15 } = req.query;

        let employeeIds;
        if (department) {
            const deptUsers = await User.find({ department }).select('_id');
            employeeIds = deptUsers.map((u) => u._id);
        }

        const filter = {};
        if (status) filter.status = status;
        if (leaveType) filter.leaveType = leaveType;
        if (employeeIds) filter.employee = { $in: employeeIds };
        if (startDate || endDate) {
            filter.startDate = {};
            if (startDate) filter.startDate.$gte = new Date(startDate);
            if (endDate) filter.startDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Leave.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        const leaves = await Leave.find(filter)
            .populate('employee', 'name email department position avatar')
            .populate('reviewedBy', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            data: leaves,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages },
        });
    } catch (error) {
        console.error('GetAllLeaves Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch all leaves.' });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    changeUserRole,
    toggleUserStatus,
    assignManager,
    adjustLeaveBalance,
    deleteUser,
    getAllLeaves,
};
