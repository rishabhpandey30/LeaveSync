const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee reference is required'],
        },
        type: {
            type: String,
            enum: {
                values: ['travel', 'food', 'office_supplies', 'internet', 'other'],
                message: 'Type must be travel, food, office_supplies, internet, or other',
            },
            required: [true, 'Reimbursement type is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [1, 'Amount must be at least 1'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [5, 'Description must be at least 5 characters'],
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        receiptUrl: {
            type: String,
            required: [true, 'Receipt upload is required'],
        },
        expenseDate: {
            type: Date,
            required: [true, 'Expense date is required'],
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected'],
                message: 'Status must be pending, approved, or rejected',
            },
            default: 'pending',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        reviewComment: {
            type: String,
            trim: true,
            maxlength: [300, 'Review comment cannot exceed 300 characters'],
            default: '',
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

reimbursementSchema.pre('save', function (next) {
    if (this.isModified('status') && ['approved', 'rejected'].includes(this.status)) {
        this.reviewedAt = new Date();
    }
    next();
});

reimbursementSchema.index({ employee: 1, status: 1 });
reimbursementSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
