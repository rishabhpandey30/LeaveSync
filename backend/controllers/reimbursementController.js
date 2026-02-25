const Reimbursement = require('../models/Reimbursement');
const User = require('../models/User');

// @route   POST /api/reimbursements
// @desc    Employee applies for reimbursement
// @access  Private
const applyReimbursement = async (req, res) => {
    try {
        const { type, amount, description, expenseDate } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Receipt upload is required.' });
        }

        const receiptUrl = `/uploads/${req.file.filename}`;

        const reimbursement = await Reimbursement.create({
            employee: req.user._id,
            type,
            amount,
            description,
            receiptUrl,
            expenseDate,
        });

        await reimbursement.populate('employee', 'name email department position avatar');

        return res.status(201).json({
            success: true,
            message: 'Reimbursement request submitted successfully.',
            data: reimbursement,
        });
    } catch (error) {
        console.error('ApplyReimbursement Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit reimbursement.' });
    }
};

// @route   GET /api/reimbursements
// @desc    Get reimbursements (filtered by role)
// @access  Private
const getReimbursements = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10, employeeId } = req.query;
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

        // Optional filters
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (employeeId && req.user.role !== 'employee') {
            filter.employee = employeeId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Reimbursement.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        const reimbursements = await Reimbursement.find(filter)
            .populate('employee', 'name email department position avatar')
            .populate('reviewedBy', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            data: reimbursements,
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
        console.error('GetReimbursements Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch reimbursements.' });
    }
};

// @route   GET /api/reimbursements/stats
// @desc    Reimbursement stats for dashboard
// @access  Private
const getReimbursementStats = async (req, res) => {
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

        const stats = await Reimbursement.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                },
            },
        ]);

        const byType = await Reimbursement.aggregate([
            { $match: { ...matchFilter, status: 'approved' } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                },
            },
        ]);

        const formatted = { pending: 0, approved: 0, rejected: 0, totalAmount: 0 };
        stats.forEach(({ _id, count, totalAmount }) => {
            formatted[_id] = count;
            if (_id === 'approved') formatted.totalAmount = totalAmount;
        });

        return res.status(200).json({
            success: true,
            data: { byStatus: formatted, byType },
        });
    } catch (error) {
        console.error('GetReimbursementStats Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
    }
};

// @route   GET /api/reimbursements/:id
// @desc    Get single reimbursement
// @access  Private
const getReimbursementById = async (req, res) => {
    try {
        const reimbursement = await Reimbursement.findById(req.params.id)
            .populate('employee', 'name email department position avatar manager')
            .populate('reviewedBy', 'name email role');

        if (!reimbursement) {
            return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
        }

        // Access control
        if (req.user.role === 'employee' && reimbursement.employee._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        if (req.user.role === 'manager') {
            const employee = await User.findById(reimbursement.employee._id);
            if (employee.manager?.toString() !== req.user._id.toString() && reimbursement.employee._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied. Not your team member.' });
            }
        }

        return res.status(200).json({ success: true, data: reimbursement });
    } catch (error) {
        console.error('GetReimbursementById Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch details.' });
    }
};

// @route   PUT /api/reimbursements/:id/approve
// @desc    Approve reimbursement
// @access  Private (manager, admin)
const approveReimbursement = async (req, res) => {
    try {
        const { reviewComment } = req.body;
        const reimbursement = await Reimbursement.findById(req.params.id).populate('employee', 'name email manager');

        if (!reimbursement) return res.status(404).json({ success: false, message: 'Not found.' });
        if (reimbursement.status !== 'pending') return res.status(400).json({ success: false, message: `Already ${reimbursement.status}.` });

        if (req.user.role === 'manager' && reimbursement.employee.manager?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Can only approve your direct reports.' });
        }

        reimbursement.status = 'approved';
        reimbursement.reviewedBy = req.user._id;
        reimbursement.reviewComment = reviewComment || 'Approved';
        await reimbursement.save();
        await reimbursement.populate('reviewedBy', 'name email role');

        return res.status(200).json({
            success: true,
            message: `Reimbursement approved for ${reimbursement.employee.name}.`,
            data: reimbursement,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to approve.' });
    }
};

// @route   PUT /api/reimbursements/:id/reject
// @desc    Reject reimbursement
// @access  Private (manager, admin)
const rejectReimbursement = async (req, res) => {
    try {
        const { reviewComment } = req.body;
        if (!reviewComment || reviewComment.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Rejection reason required (min 5 chars).' });
        }

        const reimbursement = await Reimbursement.findById(req.params.id).populate('employee', 'name email manager');
        if (!reimbursement) return res.status(404).json({ success: false, message: 'Not found.' });
        if (reimbursement.status !== 'pending') return res.status(400).json({ success: false, message: `Already ${reimbursement.status}.` });

        if (req.user.role === 'manager' && reimbursement.employee.manager?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Can only reject your direct reports.' });
        }

        reimbursement.status = 'rejected';
        reimbursement.reviewedBy = req.user._id;
        reimbursement.reviewComment = reviewComment;
        await reimbursement.save();
        await reimbursement.populate('reviewedBy', 'name email role');

        return res.status(200).json({
            success: true,
            message: `Reimbursement rejected for ${reimbursement.employee.name}.`,
            data: reimbursement,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to reject.' });
    }
};

module.exports = {
    applyReimbursement,
    getReimbursements,
    getReimbursementStats,
    getReimbursementById,
    approveReimbursement,
    rejectReimbursement,
};
