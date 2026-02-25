const express = require('express');
const { body } = require('express-validator');

const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

// ── Validation rule sets ──────────────────────────────────────────────────────

const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number'),

    body('department')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Department cannot exceed 50 characters'),

    body('position')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Position cannot exceed 50 characters'),

    body('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please enter a valid phone number'),
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

    body('department')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Department name too long'),

    body('position')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Position name too long'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isMobilePhone().withMessage('Please enter a valid phone number'),
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
        .matches(/\d/).withMessage('New password must contain at least one number'),
];

// ── Route definitions ─────────────────────────────────────────────────────────

// POST /api/auth/register — Public
router.post('/register', registerValidation, validateRequest, register);

// POST /api/auth/login — Public
router.post('/login', loginValidation, validateRequest, login);

// GET /api/auth/me — Private
router.get('/me', protect, getMe);

// PUT /api/auth/profile — Private
router.put('/profile', protect, updateProfileValidation, validateRequest, updateProfile);

// PUT /api/auth/change-password — Private
router.put('/change-password', protect, changePasswordValidation, validateRequest, changePassword);

module.exports = router;
