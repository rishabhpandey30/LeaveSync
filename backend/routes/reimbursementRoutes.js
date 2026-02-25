const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
    applyReimbursement,
    getReimbursements,
    getReimbursementStats,
    getReimbursementById,
    approveReimbursement,
    rejectReimbursement,
} = require('../controllers/reimbursementController');

router.use(protect); // All routes require authentication

router.route('/')
    .post(upload.single('receipt'), applyReimbursement)
    .get(getReimbursements);

router.get('/stats', getReimbursementStats);

router.route('/:id')
    .get(getReimbursementById);

// Manager/Admin only routes for approval
router.use(authorize('manager', 'admin'));

router.put('/:id/approve', approveReimbursement);
router.put('/:id/reject', rejectReimbursement);

module.exports = router;
