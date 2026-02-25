const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build safe user object (strip password, add token)
// ─────────────────────────────────────────────────────────────────────────────
const buildUserResponse = (user, token) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    position: user.position,
    phone: user.phone,
    avatar: user.avatar,
    manager: user.manager,
    leaveBalance: user.leaveBalance,
    isActive: user.isActive,
    joinedDate: user.joinedDate,
    initials: user.initials,
    createdAt: user.createdAt,
    token,
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user (employee by default)
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password, department, position, phone } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        // Create new user (role defaults to 'employee')
        const user = await User.create({
            name,
            email,
            password,
            department: department || 'General',
            position: position || 'Staff',
            phone: phone || '',
        });

        const token = generateToken(user._id, user.role);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome aboard.',
            data: buildUserResponse(user, token),
        });
    } catch (error) {
        console.error('Register Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login with email & password → returns JWT
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and explicitly select password (it's select:false by default)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact HR.',
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Populate manager details for response
        await user.populate('manager', 'name email department');

        const token = generateToken(user._id, user.role);

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            data: buildUserResponse(user, token),
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently authenticated user's profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        // req.user is already attached by authMiddleware (without password)
        const user = await User.findById(req.user._id).populate('manager', 'name email department position');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        return res.status(200).json({
            success: true,
            data: buildUserResponse(user, null),
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Could not fetch profile.',
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/profile
// @desc    Update own profile (name, department, phone, position)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const { name, department, position, phone, avatar } = req.body;

        const allowedUpdates = {};
        if (name) allowedUpdates.name = name;
        if (department) allowedUpdates.department = department;
        if (position) allowedUpdates.position = position;
        if (phone) allowedUpdates.phone = phone;
        if (avatar) allowedUpdates.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: allowedUpdates },
            { new: true, runValidators: true }
        ).populate('manager', 'name email department');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: buildUserResponse(user, null),
        });
    } catch (error) {
        console.error('UpdateProfile Error:', error);
        return res.status(500).json({ success: false, message: 'Profile update failed.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @desc    Change own password (requires current password)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Re-fetch user WITH password field
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect.',
            });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password.',
            });
        }

        // Update password (pre-save hook will auto-hash it)
        user.password = newPassword;
        await user.save();

        // Issue fresh token
        const token = generateToken(user._id, user.role);

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully.',
            data: { token },
        });
    } catch (error) {
        console.error('ChangePassword Error:', error);
        return res.status(500).json({ success: false, message: 'Password change failed.' });
    }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
