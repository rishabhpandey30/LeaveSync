const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect routes: Verify JWT token ─────────────────────────────────────────
const protect = async (req, res, next) => {
    let token;

    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request (exclude password)
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token is invalid. User no longer exists.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Contact admin.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        const message =
            error.name === 'TokenExpiredError'
                ? 'Session expired. Please log in again.'
                : 'Invalid token. Please log in again.';

        return res.status(401).json({ success: false, message });
    }
};

module.exports = { protect };
