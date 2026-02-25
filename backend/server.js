require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');

// ── Route imports (will be added phase by phase) ─────────────────────────────
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reimbursementRoutes = require('./routes/reimbursementRoutes');

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🟢 Leave Management API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reimbursements', reimbursementRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(400).json({ success: false, message: 'Validation Error', errors });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});
