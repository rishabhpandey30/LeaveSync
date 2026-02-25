# Employee Leave & Reimbursement Management System

A comprehensive, full-stack Human Resources portal built with the **MERN Stack** (MongoDB, Express.js, React, Node.js) and styled with **Tailwind CSS**. This application facilitates the streamlined management of employee leaves and expense claims, featuring distinct workflows for Employees, Managers, and System Administrators.

## 🌟 Key Features

### Role-Based Access Control (RBAC)
*   **Employee**: Apply for leaves, submit reimbursement claims (with receipt parsing), and track personal history.
*   **Manager**: View team metrics, approve/reject direct reports' leaves and claims.
*   **Admin**: Total comprehensive oversight, manage user accounts, manage all departments, and monitor company-wide metrics and actions.

### Leave Management Module
*   Submit requests (Annual, Sick, Casual, Unpaid).
*   Half-day considerations.
*   Real-time balance tracking.
*   Visual calendar integration using FullCalendar.

### Reimbursement Module
*   Submit expenses under varied categories (Travel, Food, Office Supplies, Internet, Other).
*   Receipt File Uploads (PDF, PNG, JPG support up to 5MB).
*   Status tracking (Pending, Approved, Rejected).

### Modern Interface & UX
*   **Aesthetics**: Glassmorphism, smooth animations, and premium data tables.
*   **Dark Mode**: Native full-page toggle for light/dark aesthetic preference.
*   **Context States**: Fully responsive React-Toast feedback notifications globally.

---

## 🛠 Tech Stack

*   **Frontend**: React.js (Vite), React Router v6, Tailwind CSS, Context API, Axios, FullCalendar, date-fns, react-icons.
*   **Backend**: Node.js, Express.js, MongoDB + Mongoose, JSON Web Tokens (JWT), bcryptjs, multer (file uploads).
*   **Tools**: Concurrently, dotenv, cors, morgan.

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas)

### 1. Clone & Install Dependencies
First, install the dependencies for both the frontend and the backend.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the **`/backend`** directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

### 3. Database Seeding (Optional)
To instantly generate test users (Admins, Managers, Employees) to try the platform:

```bash
cd backend
npm run seed
```
*Note: Check the `backend/seed.js` script to see the generated login credentials.*

### 4. Running the Application
Open two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The application will now be running at `http://localhost:5173`.

---

## 📂 Folder Structure

```text
├── backend/
│   ├── config/          # DB connection and env setups
│   ├── controllers/     # Route logic (Auth, Leave, Reimbursement, Users)
│   ├── middleware/      # JWT validation, Role checks, Multer uploads
│   ├── models/          # Mongoose DB Schemas
│   ├── routes/          # Express route definitions
│   ├── uploads/         # Static storage for receipt files
│   └── server.js        # Main backend entry point
│
└── frontend/
    ├── src/
    │   ├── api/         # Axios global interceptors
    │   ├── components/  # Badges, Layouts, Modals, Spinners
    │   ├── context/     # Global state (Auth, Theme, Leaves, Reimbursements)
    │   ├── pages/       # Page views scoped by role
    │   ├── routes/      # Guarded protection abstractions
    │   ├── utils/       # Helpers, date parsing, UI configs
    │   ├── App.jsx      # Lazy Loading router tree
    │   └── main.jsx     # Root rendering
    ├── public/ 
    ├── index.html 
    ├── index.css        # Tailwind directives and core theme vars
    └── vite.config.js   # Proxy setups
```

---

## 🛡 API Endpoints Reference

### Authentication
*   `POST /api/auth/register` - Register a new user
*   `POST /api/auth/login` - Authenticate and get JWT
*   `GET /api/auth/me` - Get current user profile

### Leaves
*   `POST /api/leaves` - Apply for leave
*   `GET /api/leaves` - Get relevant leaves (role-scoped)
*   `PUT /api/leaves/:id/approve` - Approve a leave (Manager/Admin)
*   `PUT /api/leaves/:id/reject` - Reject a leave (Manager/Admin)

### Reimbursements
*   `POST /api/reimbursements` - Claim expense (supports `multipart/form-data`)
*   `GET /api/reimbursements` - Get relevant claims (role-scoped)
*   `PUT /api/reimbursements/:id/approve` - Approve a claim (Manager/Admin)
*   `PUT /api/reimbursements/:id/reject` - Reject a claim (Manager/Admin)

### Administration
*   `GET /api/users` - List all users
*   `POST /api/admin/users` - Explicitly provision new accounts 
*   `PUT /api/admin/users/:id` - Manage roles/departments

---

*Designed and developed specifically with modularity and robust access-control architecture.*
