// ── Role-based authorization middleware ───────────────────────────────────────
// Usage: authorize('admin') OR authorize('admin', 'manager')

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: [${roles.join(' or ')}]. Your role: ${req.user.role}`,
            });
        }

        next();
    };
};

// ── Self or Admin guard: Allow own data OR admin ──────────────────────────────
const selfOrAdmin = (req, res, next) => {
    const requestedId = req.params.id || req.params.userId;

    if (
        req.user.role === 'admin' ||
        req.user._id.toString() === requestedId
    ) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data.',
    });
};

// ── Manager or Admin guard ────────────────────────────────────────────────────
const managerOrAdmin = (req, res, next) => {
    if (['manager', 'admin'].includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Admin role required.',
    });
};

module.exports = { authorize, selfOrAdmin, managerOrAdmin };
