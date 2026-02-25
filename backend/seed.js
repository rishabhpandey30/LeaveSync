/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEED SCRIPT — Leave Management System
 * Run: node seed.js
 *
 * Creates:
 *   1 Admin user
 *   2 Manager users
 *   5 Employee users  (each assigned to a manager)
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Leave = require('./models/Leave');

const connectDB = require('./config/db');

// ── Seed Data ─────────────────────────────────────────────────────────────────
const adminData = {
    name: 'Super Admin',
    email: 'admin@company.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Management',
    position: 'HR Director',
    phone: '+1234567890',
};

const managersData = [
    {
        name: 'Sarah Johnson',
        email: 'sarah.manager@company.com',
        password: 'Manager@123',
        role: 'manager',
        department: 'Engineering',
        position: 'Engineering Manager',
        phone: '+1234567891',
    },
    {
        name: 'David Chen',
        email: 'david.manager@company.com',
        password: 'Manager@123',
        role: 'manager',
        department: 'Design',
        position: 'Design Lead',
        phone: '+1234567892',
    },
];

const employeesData = [
    {
        name: 'Alice Brown',
        email: 'alice@company.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Engineering',
        position: 'Software Engineer',
        phone: '+1234567893',
        managerKey: 0, // Index into managersData
    },
    {
        name: 'Bob Martinez',
        email: 'bob@company.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Engineering',
        position: 'Backend Developer',
        phone: '+1234567894',
        managerKey: 0,
    },
    {
        name: 'Carol White',
        email: 'carol@company.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Engineering',
        position: 'Frontend Developer',
        phone: '+1234567895',
        managerKey: 0,
    },
    {
        name: 'Daniel Kim',
        email: 'daniel@company.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Design',
        position: 'UI/UX Designer',
        phone: '+1234567896',
        managerKey: 1,
    },
    {
        name: 'Eva Singh',
        email: 'eva@company.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Design',
        position: 'Graphic Designer',
        phone: '+1234567897',
        managerKey: 1,
    },
];

// ── Helper: Create a Leave entry ──────────────────────────────────────────────
const createLeave = (employeeId, reviewerId, overrides = {}) => ({
    employee: employeeId,
    leaveType: overrides.leaveType || 'annual',
    startDate: overrides.startDate || new Date(),
    endDate: overrides.endDate || new Date(),
    reason: overrides.reason || 'Personal reasons requiring time off',
    status: overrides.status || 'pending',
    reviewedBy: overrides.status !== 'pending' ? reviewerId : null,
    reviewComment: overrides.reviewComment || '',
});

// ── Main Seed Function ────────────────────────────────────────────────────────
const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('\n🌱 Starting database seed...\n');

        // ── Clear existing data ──────────────────────────────────────────────────
        await Leave.deleteMany({});
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users and leaves');

        // ── Create Admin ─────────────────────────────────────────────────────────
        const admin = await User.create(adminData);
        console.log(`✅ Admin created:    ${admin.email}`);

        // ── Create Managers ──────────────────────────────────────────────────────
        const managers = [];
        for (const mData of managersData) {
            const manager = await User.create(mData);
            managers.push(manager);
            console.log(`✅ Manager created:  ${manager.email} (${manager.department})`);
        }

        // ── Create Employees & assign managers ────────────────────────────────────
        const employees = [];
        for (const eData of employeesData) {
            const { managerKey, ...rest } = eData;
            const employee = await User.create({
                ...rest,
                manager: managers[managerKey]._id,
            });
            employees.push(employee);
            console.log(`✅ Employee created: ${employee.email} → Manager: ${managers[managerKey].name}`);
        }

        // ── Create sample leave requests ─────────────────────────────────────────
        console.log('\n📅 Creating sample leave requests...\n');

        const now = new Date();
        const past = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() - d); return dt; };
        const future = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt; };

        const sampleLeaves = [
            // Alice — Approved annual leave (past)
            createLeave(employees[0]._id, managers[0]._id, {
                leaveType: 'annual', status: 'approved',
                startDate: past(10), endDate: past(8),
                reason: 'Family vacation planned for the long weekend.',
                reviewComment: 'Approved. Enjoy your vacation!',
            }),
            // Alice — Pending sick leave (future)
            createLeave(employees[0]._id, managers[0]._id, {
                leaveType: 'sick', status: 'pending',
                startDate: future(3), endDate: future(4),
                reason: 'Medical appointment and recovery time needed.',
            }),
            // Bob — Rejected casual leave
            createLeave(employees[1]._id, managers[0]._id, {
                leaveType: 'casual', status: 'rejected',
                startDate: past(5), endDate: past(4),
                reason: 'Personal errand that needs urgent attention.',
                reviewComment: 'Insufficient team coverage during this period.',
            }),
            // Bob — Approved annual leave (future)
            createLeave(employees[1]._id, managers[0]._id, {
                leaveType: 'annual', status: 'approved',
                startDate: future(7), endDate: future(11),
                reason: 'Annual family trip abroad.',
                reviewComment: 'Approved. Have a great trip!',
            }),
            // Carol — Pending annual leave
            createLeave(employees[2]._id, managers[0]._id, {
                leaveType: 'annual', status: 'pending',
                startDate: future(14), endDate: future(18),
                reason: 'Leisure travel and rest during festive season.',
            }),
            // Daniel — Approved sick leave
            createLeave(employees[3]._id, managers[1]._id, {
                leaveType: 'sick', status: 'approved',
                startDate: past(3), endDate: past(2),
                reason: 'Flu and fever requiring bed rest and medical care.',
                reviewComment: 'Get well soon!',
            }),
            // Eva — Pending casual leave
            createLeave(employees[4]._id, managers[1]._id, {
                leaveType: 'casual', status: 'pending',
                startDate: future(2), endDate: future(2),
                reason: 'Personal appointment that cannot be rescheduled.',
            }),
        ];

        await Leave.insertMany(sampleLeaves);
        console.log(`✅ Created ${sampleLeaves.length} sample leave requests`);

        // ── Summary ──────────────────────────────────────────────────────────────
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 Database seeded successfully!');
        console.log('═'.repeat(60));
        console.log('\n📋 LOGIN CREDENTIALS:');
        console.log('─'.repeat(60));
        console.log('🔴 ADMIN');
        console.log(`   Email:    ${adminData.email}`);
        console.log(`   Password: ${adminData.password}`);
        console.log('\n🟡 MANAGERS');
        managersData.forEach(m => {
            console.log(`   ${m.name}`);
            console.log(`   Email:    ${m.email}`);
            console.log(`   Password: ${m.password}`);
        });
        console.log('\n🟢 EMPLOYEES');
        employeesData.forEach(e => {
            console.log(`   ${e.name} (${e.department})`);
            console.log(`   Email:    ${e.email}`);
            console.log(`   Password: ${e.password}`);
        });
        console.log('─'.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seedDatabase();
