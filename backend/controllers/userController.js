const User = require('../models/User');
const Leave = require('../models/Leave');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/users
// @desc    Get all users — scoped by role
//            manager → their direct reports
//            admin   → everyone
// @access  Private (manager, admin)
// ─────────────────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
    try {
        const { department, role, search, page = 1, limit = 20 } = req.query;

        const filter = { isActive: true };

        // Manager sees only their team
        if (req.user.role === 'manager') {
            filter.manager = req.user._id;
        }

        if (department) filter.department = department;
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        const users = await User.find(filter)
            .select('-password')
            .populate('manager', 'name email department')
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            data: users,
            pagination: { total, page: parseInt(page), totalPages },
        });
    } catch (error) {
        console.error('GetUsers Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/users/managers
// @desc    Get list of all managers (for assignment dropdowns)
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: 'manager', isActive: true })
            .select('name email department position')
            .sort({ name: 1 });

        return res.status(200).json({ success: true, data: managers });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch managers.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/users/:id
// @desc    Get single user profile with leave summary
// @access  Private (self, manager of that user, admin)
// ─────────────────────────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('manager', 'name email department position');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Access control
        if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        if (req.user.role === 'manager') {
            const isSelf = req.user._id.toString() === req.params.id;
            const isTeam = user.manager?.toString() === req.user._id.toString();
            if (!isSelf && !isTeam) {
                return res.status(403).json({ success: false, message: 'Access denied. Not your team member.' });
            }
        }

        // Attach quick leave summary
        const leaveSummary = await Leave.aggregate([
            { $match: { employee: user._id } },
            { $group: { _id: '$status', count: { $sum: 1 }, days: { $sum: '$totalDays' } } },
        ]);

        return res.status(200).json({
            success: true,
            data: { ...user.toObject(), leaveSummary },
        });
    } catch (error) {
        console.error('GetUserById Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch user.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/users/:id
// @desc    Update user (admin or self — limited fields)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
    try {
        const { name, department, position, phone, avatar, manager } = req.body;

        const isSelf = req.user._id.toString() === req.params.id;
        const isAdmin = req.user.role === 'admin';

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (department) updates.department = department;
        if (position) updates.position = position;
        if (phone) updates.phone = phone;
        if (avatar) updates.avatar = avatar;
        // Only admin can change manager assignment
        if (manager && isAdmin) updates.manager = manager;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .select('-password')
            .populate('manager', 'name email department');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({ success: true, message: 'User updated successfully.', data: user });
    } catch (error) {
        console.error('UpdateUser Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/users/:id/leaves
// @desc    Get all leaves for a specific user
// @access  Private (manager/admin or self)
// ─────────────────────────────────────────────────────────────────────────────
const getUserLeaves = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        // Access control
        if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const filter = { employee: req.params.id };
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Leave.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        const leaves = await Leave.find(filter)
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            data: leaves,
            pagination: { total, page: parseInt(page), totalPages },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch user leaves.' });
    }
};

module.exports = { getUsers, getManagers, getUserById, updateUser, getUserLeaves };
