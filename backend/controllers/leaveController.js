const Leave = require('../models/Leave');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/leaves
// @desc    Employee applies for a new leave
// @access  Private (all roles)
// ─────────────────────────────────────────────────────────────────────────────
const applyLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason, isHalfDay, halfDayPeriod, emergencyContact } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date logic
        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date.',
            });
        }

        // Prevent applying for past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            return res.status(400).json({
                success: false,
                message: 'Leave start date cannot be in the past.',
            });
        }

        // Calculate total days
        let totalDays;
        if (isHalfDay) {
            totalDays = 0.5;
        } else {
            const diffTime = Math.abs(end - start);
            totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        // Check for overlapping leave requests
        const overlap = await Leave.findOne({
            employee: req.user._id,
            status: { $in: ['pending', 'approved'] },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } },
            ],
        });

        if (overlap) {
            return res.status(400).json({
                success: false,
                message: `You already have a ${overlap.status} leave request overlapping these dates (${overlap.startDate.toDateString()} – ${overlap.endDate.toDateString()}).`,
            });
        }

        // Check leave balance
        const user = await User.findById(req.user._id);
        if (leaveType !== 'unpaid') {
            const balance = user.leaveBalance[leaveType] || 0;
            if (balance < totalDays) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient ${leaveType} leave balance. Available: ${balance} day(s), Requested: ${totalDays} day(s).`,
                });
            }
        }

        // Create the leave
        const leave = await Leave.create({
            employee: req.user._id,
            leaveType,
            startDate: start,
            endDate: end,
            totalDays,
            reason,
            isHalfDay: isHalfDay || false,
            halfDayPeriod: halfDayPeriod || null,
            emergencyContact: emergencyContact || '',
        });

        await leave.populate('employee', 'name email department position avatar');

        return res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully. Awaiting manager approval.',
            data: leave,
        });
    } catch (error) {
        console.error('ApplyLeave Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to apply for leave.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/leaves
// @desc    Get leaves — filtered by role:
//            employee → own leaves only
//            manager  → leaves of their direct reports
//            admin    → all leaves
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getLeaves = async (req, res) => {
    try {
        const { status, leaveType, page = 1, limit = 10, startDate, endDate, employeeId } = req.query;

        // Build query filter
        const filter = {};

        // ── Role-based scoping ────────────────────────────────────────────────────
        if (req.user.role === 'employee') {
            filter.employee = req.user._id;
        } else if (req.user.role === 'manager') {
            // Get all employees whose manager is this user
            const teamMembers = await User.find({ manager: req.user._id }).select('_id');
            const teamIds = teamMembers.map((m) => m._id);
            // Manager also sees their own leaves
            teamIds.push(req.user._id);
            filter.employee = { $in: teamIds };
        }
        // Admin: no employee filter → sees all

        // ── Optional filters ──────────────────────────────────────────────────────
        if (status) filter.status = status;
        if (leaveType) filter.leaveType = leaveType;
        if (employeeId && req.user.role !== 'employee') {
            filter.employee = employeeId;
        }
        if (startDate || endDate) {
            filter.startDate = {};
            if (startDate) filter.startDate.$gte = new Date(startDate);
            if (endDate) filter.startDate.$lte = new Date(endDate);
        }

        // ── Pagination ─────────────────────────────────────────────────────────────
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
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
            },
        });
    } catch (error) {
        console.error('GetLeaves Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch leaves.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/leaves/calendar
// @desc    Get leaves formatted for calendar display
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getCalendarLeaves = async (req, res) => {
    try {
        const { month, year, status } = req.query;

        const filter = {};

        // Role-based scoping
        if (req.user.role === 'employee') {
            filter.employee = req.user._id;
        } else if (req.user.role === 'manager') {
            const teamMembers = await User.find({ manager: req.user._id }).select('_id');
            const teamIds = teamMembers.map((m) => m._id);
            teamIds.push(req.user._id);
            filter.employee = { $in: teamIds };
        }

        // Filter by month/year if provided
        if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            filter.$or = [
                { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
                { endDate: { $gte: startOfMonth, $lte: endOfMonth } },
                { startDate: { $lte: startOfMonth }, endDate: { $gte: endOfMonth } },
            ];
        }

        if (status) filter.status = status;

        const leaves = await Leave.find(filter)
            .populate('employee', 'name email department avatar')
            .sort({ startDate: 1 });

        // Map to FullCalendar event format
        const calendarEvents = leaves.map((leave) => ({
            id: leave._id,
            title: `${leave.employee.name} — ${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}`,
            start: leave.startDate,
            end: new Date(leave.endDate.getTime() + 24 * 60 * 60 * 1000), // FullCalendar end is exclusive
            extendedProps: {
                employee: leave.employee,
                leaveType: leave.leaveType,
                status: leave.status,
                reason: leave.reason,
                totalDays: leave.totalDays,
                reviewComment: leave.reviewComment,
            },
            backgroundColor: getStatusColor(leave.status),
            borderColor: getStatusColor(leave.status),
            textColor: '#ffffff',
        }));

        return res.status(200).json({ success: true, data: calendarEvents });
    } catch (error) {
        console.error('GetCalendarLeaves Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch calendar data.' });
    }
};

// Helper: Calendar event colors by status
const getStatusColor = (status) => {
    const colors = {
        pending: '#F59E0B',  // Amber
        approved: '#10B981',  // Emerald
        rejected: '#EF4444',  // Red
        cancelled: '#6B7280',  // Gray
    };
    return colors[status] || '#6B7280';
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/leaves/:id
// @desc    Get single leave details
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getLeaveById = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate('employee', 'name email department position avatar manager')
            .populate('reviewedBy', 'name email role');

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        // Access control: Employee can only see their own
        if (
            req.user.role === 'employee' &&
            leave.employee._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Manager can only see their team's leaves
        if (req.user.role === 'manager') {
            const employee = await User.findById(leave.employee._id);
            if (
                employee.manager?.toString() !== req.user._id.toString() &&
                leave.employee._id.toString() !== req.user._id.toString()
            ) {
                return res.status(403).json({ success: false, message: 'Access denied. Not your team member.' });
            }
        }

        return res.status(200).json({ success: true, data: leave });
    } catch (error) {
        console.error('GetLeaveById Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch leave details.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/leaves/:id/approve
// @desc    Manager/Admin approves a leave — deducts from balance
// @access  Private (manager, admin)
// ─────────────────────────────────────────────────────────────────────────────
const approveLeave = async (req, res) => {
    try {
        const { reviewComment } = req.body;

        const leave = await Leave.findById(req.params.id).populate('employee', 'name email leaveBalance manager');
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve a leave that is already ${leave.status}.`,
            });
        }

        // Manager can only approve their own team
        if (req.user.role === 'manager') {
            const employee = await User.findById(leave.employee._id);
            if (employee.manager?.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'You can only approve leaves for your direct reports.' });
            }
        }

        // Update leave status
        leave.status = 'approved';
        leave.reviewedBy = req.user._id;
        leave.reviewComment = reviewComment || 'Approved';
        leave.reviewedAt = new Date();
        await leave.save();

        // Deduct from leave balance (except unpaid)
        if (leave.leaveType !== 'unpaid') {
            await User.findByIdAndUpdate(leave.employee._id, {
                $inc: { [`leaveBalance.${leave.leaveType}`]: -leave.totalDays },
            });
        }

        await leave.populate('reviewedBy', 'name email role');

        return res.status(200).json({
            success: true,
            message: `Leave approved for ${leave.employee.name}.`,
            data: leave,
        });
    } catch (error) {
        console.error('ApproveLeave Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to approve leave.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/leaves/:id/reject
// @desc    Manager/Admin rejects a leave
// @access  Private (manager, admin)
// ─────────────────────────────────────────────────────────────────────────────
const rejectLeave = async (req, res) => {
    try {
        const { reviewComment } = req.body;

        if (!reviewComment || reviewComment.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'A reason for rejection is required (minimum 5 characters).',
            });
        }

        const leave = await Leave.findById(req.params.id).populate('employee', 'name email manager');
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject a leave that is already ${leave.status}.`,
            });
        }

        // Manager access control
        if (req.user.role === 'manager') {
            const employee = await User.findById(leave.employee._id);
            if (employee.manager?.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'You can only reject leaves for your direct reports.' });
            }
        }

        leave.status = 'rejected';
        leave.reviewedBy = req.user._id;
        leave.reviewComment = reviewComment;
        leave.reviewedAt = new Date();
        await leave.save();
        await leave.populate('reviewedBy', 'name email role');

        return res.status(200).json({
            success: true,
            message: `Leave rejected for ${leave.employee.name}.`,
            data: leave,
        });
    } catch (error) {
        console.error('RejectLeave Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reject leave.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/leaves/:id/cancel
// @desc    Employee cancels their own pending leave
// @access  Private (employee — own leave only)
// ─────────────────────────────────────────────────────────────────────────────
const cancelLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        // Only the leave owner can cancel
        if (leave.employee.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You can only cancel your own leave requests.' });
        }

        if (!['pending', 'approved'].includes(leave.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a leave that is already ${leave.status}.`,
            });
        }

        // If approved leave is cancelled → restore balance
        if (leave.status === 'approved' && leave.leaveType !== 'unpaid') {
            await User.findByIdAndUpdate(leave.employee, {
                $inc: { [`leaveBalance.${leave.leaveType}`]: leave.totalDays },
            });
        }

        leave.status = 'cancelled';
        await leave.save();

        return res.status(200).json({
            success: true,
            message: 'Leave request cancelled successfully.',
            data: leave,
        });
    } catch (error) {
        console.error('CancelLeave Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to cancel leave.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/leaves/my-balance
// @desc    Get own leave balance
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('leaveBalance name');
        return res.status(200).json({ success: true, data: user.leaveBalance });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch balance.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/leaves/stats
// @desc    Leave stats for dashboards
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getLeaveStats = async (req, res) => {
    try {
        const matchFilter = {};

        if (req.user.role === 'employee') {
            matchFilter.employee = req.user._id;
        } else if (req.user.role === 'manager') {
            const teamMembers = await User.find({ manager: req.user._id }).select('_id');
            const teamIds = teamMembers.map((m) => m._id);
            teamIds.push(req.user._id);
            matchFilter.employee = { $in: teamIds };
        }

        const stats = await Leave.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    days: { $sum: '$totalDays' },
                },
            },
        ]);

        const byType = await Leave.aggregate([
            { $match: { ...matchFilter, status: 'approved' } },
            {
                $group: {
                    _id: '$leaveType',
                    count: { $sum: 1 },
                    days: { $sum: '$totalDays' },
                },
            },
        ]);

        const formatted = { pending: 0, approved: 0, rejected: 0, cancelled: 0, totalDays: 0 };
        stats.forEach(({ _id, count, days }) => {
            formatted[_id] = count;
            if (_id === 'approved') formatted.totalDays = days;
        });

        return res.status(200).json({
            success: true,
            data: { byStatus: formatted, byType },
        });
    } catch (error) {
        console.error('GetLeaveStats Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
    }
};

module.exports = {
    applyLeave,
    getLeaves,
    getCalendarLeaves,
    getLeaveById,
    approveLeave,
    rejectLeave,
    cancelLeave,
    getMyBalance,
    getLeaveStats,
};
