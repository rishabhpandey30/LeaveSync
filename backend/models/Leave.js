const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee reference is required'],
        },
        leaveType: {
            type: String,
            enum: {
                values: ['annual', 'sick', 'casual', 'unpaid'],
                message: 'Leave type must be annual, sick, casual, or unpaid',
            },
            required: [true, 'Leave type is required'],
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        totalDays: {
            type: Number,
            min: [0.5, 'Total days must be at least 0.5'],
        },
        isHalfDay: {
            type: Boolean,
            default: false,
        },
        halfDayPeriod: {
            type: String,
            enum: ['morning', 'afternoon', null],
            default: null,
        },
        reason: {
            type: String,
            required: [true, 'Reason for leave is required'],
            trim: true,
            minlength: [10, 'Reason must be at least 10 characters'],
            maxlength: [500, 'Reason cannot exceed 500 characters'],
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected', 'cancelled'],
                message: 'Status must be pending, approved, rejected, or cancelled',
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
        attachmentUrl: {
            type: String,
            default: '',
        },
        emergencyContact: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ── Virtual: Duration label ───────────────────────────────────────────────────
leaveSchema.virtual('durationLabel').get(function () {
    if (this.isHalfDay) return `Half Day (${this.halfDayPeriod})`;
    return `${this.totalDays} day${this.totalDays !== 1 ? 's' : ''}`;
});

// ── Pre-save middleware: Auto-calculate totalDays ─────────────────────────────
leaveSchema.pre('save', function (next) {
    if (this.startDate && this.endDate) {
        if (this.isHalfDay) {
            this.totalDays = 0.5;
        } else {
            const diffTime = Math.abs(this.endDate - this.startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            this.totalDays = diffDays;
        }
    }

    // Set reviewedAt timestamp when status changes
    if (this.isModified('status') && ['approved', 'rejected'].includes(this.status)) {
        this.reviewedAt = new Date();
    }

    next();
});

// ── Indexes for performance ───────────────────────────────────────────────────
leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ employee: 1, startDate: -1 });
leaveSchema.index({ status: 1, createdAt: -1 });
leaveSchema.index({ reviewedBy: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);
module.exports = Leave;
