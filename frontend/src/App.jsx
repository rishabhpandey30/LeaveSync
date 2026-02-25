import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PublicRoute, ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';

// ── Suspense fallback ─────────────────────────────────────────────────────────
const PageFallback = () => (
  <div className="min-h-screen bg-surface-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-white/10 border-t-primary-500 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  </div>
);

// ── Lazy imports — each page is a separate chunk ───────────────────────────────
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const ApplyLeave = lazy(() => import('./pages/employee/ApplyLeave'));
const MyLeaves = lazy(() => import('./pages/employee/MyLeaves'));
const ApplyReimbursement = lazy(() => import('./pages/employee/ApplyReimbursement'));
const MyReimbursements = lazy(() => import('./pages/employee/MyReimbursements'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const TeamLeaves = lazy(() => import('./pages/manager/TeamLeaves'));
const TeamReimbursements = lazy(() => import('./pages/manager/TeamReimbursements'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const AllLeaves = lazy(() => import('./pages/admin/AllLeaves'));
const AllReimbursements = lazy(() => import('./pages/admin/AllReimbursements'));
const CalendarPage = lazy(() => import('./pages/shared/CalendarPage'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));
const UnauthorizedPage = lazy(() => import('./pages/shared/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('./pages/shared/NotFoundPage'));

// ── Root redirect ─────────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const map = { admin: '/admin/dashboard', manager: '/manager/dashboard', employee: '/employee/dashboard' };
  return <Navigate to={map[user?.role] || '/employee/dashboard'} replace />;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected (all roles) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>

        {/* Employee */}
        <Route path="/employee/dashboard" element={<RoleRoute roles={['employee', 'manager', 'admin']}><EmployeeDashboard /></RoleRoute>} />
        <Route path="/employee/apply" element={<RoleRoute roles={['employee', 'manager', 'admin']}><ApplyLeave /></RoleRoute>} />
        <Route path="/employee/leaves" element={<RoleRoute roles={['employee', 'manager', 'admin']}><MyLeaves /></RoleRoute>} />
        <Route path="/employee/apply-reimbursement" element={<RoleRoute roles={['employee']}><ApplyReimbursement /></RoleRoute>} />
        <Route path="/employee/reimbursements" element={<RoleRoute roles={['employee']}><MyReimbursements /></RoleRoute>} />

        {/* Manager */}
        <Route path="/manager/dashboard" element={<RoleRoute roles={['manager', 'admin']}><ManagerDashboard /></RoleRoute>} />
        <Route path="/manager/team" element={<RoleRoute roles={['manager', 'admin']}><TeamLeaves /></RoleRoute>} />
        <Route path="/manager/reimbursements" element={<RoleRoute roles={['manager', 'admin']}><TeamReimbursements /></RoleRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute roles={['admin']}><ManageUsers /></RoleRoute>} />
        <Route path="/admin/leaves" element={<RoleRoute roles={['admin']}><AllLeaves /></RoleRoute>} />
        <Route path="/admin/reimbursements" element={<RoleRoute roles={['admin']}><AllReimbursements /></RoleRoute>} />

        {/* Shared */}
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Errors */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default App;
