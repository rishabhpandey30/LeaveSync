const express = require('express');
const { body } = require('express-validator');

const {
    applyLeave,
    getLeaves,
    getCalendarLeaves,
    getLeaveById,
    approveLeave,
    rejectLeave,
    cancelLeave,
    getMyBalance,
    getLeaveStats,
} = require('../controllers/leaveController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

// ── All routes require authentication ─────────────────────────────────────────
router.use(protect);

// ── Validation rules ──────────────────────────────────────────────────────────
const applyLeaveValidation = [
    body('leaveType')
        .notEmpty().withMessage('Leave type is required')
        .isIn(['annual', 'sick', 'casual', 'unpaid']).withMessage('Invalid leave type'),

    body('startDate')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Start date must be a valid date'),

    body('endDate')
        .notEmpty().withMessage('End date is required')
        .isISO8601().withMessage('End date must be a valid date'),

    body('reason')
        .trim()
        .notEmpty().withMessage('Reason is required')
        .isLength({ min: 10, max: 500 }).withMessage('Reason must be 10–500 characters'),

    body('isHalfDay')
        .optional()
        .isBoolean().withMessage('isHalfDay must be true or false'),

    body('halfDayPeriod')
        .optional()
        .isIn(['morning', 'afternoon', null]).withMessage('Half day period must be morning or afternoon'),
];

const reviewValidation = [
    body('reviewComment')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Review comment cannot exceed 300 characters'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET  /api/leaves/calendar  — Formatted for FullCalendar
router.get('/calendar', getCalendarLeaves);

// GET  /api/leaves/my-balance — Own leave balance
router.get('/my-balance', getMyBalance);

// GET  /api/leaves/stats  — Dashboard stats
router.get('/stats', getLeaveStats);

// GET  /api/leaves  — List leaves (role-filtered)
router.get('/', getLeaves);

// POST /api/leaves  — Apply for leave
router.post('/', applyLeaveValidation, validateRequest, applyLeave);

// GET  /api/leaves/:id
router.get('/:id', getLeaveById);

// PUT  /api/leaves/:id/approve — Manager/Admin only
router.put('/:id/approve', authorize('manager', 'admin'), reviewValidation, validateRequest, approveLeave);

// PUT  /api/leaves/:id/reject — Manager/Admin only
router.put('/:id/reject', authorize('manager', 'admin'), reviewValidation, validateRequest, rejectLeave);

// PUT  /api/leaves/:id/cancel — Own leave
router.put('/:id/cancel', cancelLeave);

module.exports = router;
