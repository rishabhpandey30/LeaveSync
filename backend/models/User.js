const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const leaveBalanceSchema = new mongoose.Schema({
    annual: { type: Number, default: 20 },
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 5 },
    unpaid: { type: Number, default: 999 }, // Unlimited unpaid
}, { _id: false });

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Never returned in queries by default
        },
        role: {
            type: String,
            enum: {
                values: ['employee', 'manager', 'admin'],
                message: 'Role must be employee, manager, or admin',
            },
            default: 'employee',
        },
        department: {
            type: String,
            trim: true,
            default: 'General',
        },
        position: {
            type: String,
            trim: true,
            default: 'Staff',
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        leaveBalance: {
            type: leaveBalanceSchema,
            default: () => ({}),
        },
        avatar: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        joinedDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ── Virtual: Full name initials for avatar fallback ─────────────────────────
userSchema.virtual('initials').get(function () {
    return this.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
});

// ── Pre-save middleware: Hash password before saving ─────────────────────────
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ── Instance method: Compare entered password with stored hash ────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ── Index for fast lookups ────────────────────────────────────────────────────
// Note: email index is already created by `unique: true` in the schema field
userSchema.index({ role: 1, department: 1 });
userSchema.index({ manager: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
