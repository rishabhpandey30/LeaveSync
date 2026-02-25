const express = require('express');
const { body } = require('express-validator');

const {
    getUsers,
    getManagers,
    getUserById,
    updateUser,
    getUserLeaves,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

const updateUserValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isMobilePhone().withMessage('Invalid phone number'),
];

// GET /api/users/managers — All managers list (admin)
router.get('/managers', authorize('admin'), getManagers);

// GET /api/users — All users (manager/admin)
router.get('/', authorize('manager', 'admin'), getUsers);

// GET /api/users/:id — User profile
router.get('/:id', getUserById);

// PUT /api/users/:id — Update user profile
router.put('/:id', updateUserValidation, validateRequest, updateUser);

// GET /api/users/:id/leaves — User leave history
router.get('/:id/leaves', getUserLeaves);

module.exports = router;
