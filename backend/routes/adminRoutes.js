const express = require('express');
const { body } = require('express-validator');

const {
    getDashboardStats,
    getAllUsers,
    changeUserRole,
    toggleUserStatus,
    assignManager,
    adjustLeaveBalance,
    deleteUser,
    getAllLeaves,
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize('admin'));

// ── Validation ────────────────────────────────────────────────────────────────
const roleValidation = [
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['employee', 'manager', 'admin']).withMessage('Invalid role'),
];

const balanceValidation = [
    body('annual').optional().isInt({ min: 0 }).withMessage('Annual must be a non-negative integer'),
    body('sick').optional().isInt({ min: 0 }).withMessage('Sick must be a non-negative integer'),
    body('casual').optional().isInt({ min: 0 }).withMessage('Casual must be a non-negative integer'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET  /api/admin/stats                   — Dashboard overview stats
router.get('/stats', getDashboardStats);

// GET  /api/admin/users                   — All users with filters
router.get('/users', getAllUsers);

// GET  /api/admin/leaves                  — All leaves system-wide
router.get('/leaves', getAllLeaves);

// PUT  /api/admin/users/:id/role          — Change role
router.put('/users/:id/role', roleValidation, validateRequest, changeUserRole);

// PUT  /api/admin/users/:id/toggle        — Activate/Deactivate
router.put('/users/:id/toggle', toggleUserStatus);

// PUT  /api/admin/users/:id/assign-manager — Assign manager
router.put('/users/:id/assign-manager', assignManager);

// PUT  /api/admin/users/:id/leave-balance — Adjust leave balance
router.put('/users/:id/leave-balance', balanceValidation, validateRequest, adjustLeaveBalance);

// DELETE /api/admin/users/:id             — Delete user
router.delete('/users/:id', deleteUser);

module.exports = router;
