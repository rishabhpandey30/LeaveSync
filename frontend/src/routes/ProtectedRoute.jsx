import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── FullPageLoader shown during auth check ────────────────────────────────────
const AuthLoader = () => (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Verifying session...</p>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — Requires authentication; redirects to /login if not logged in
// ─────────────────────────────────────────────────────────────────────────────
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <AuthLoader />;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

// ─────────────────────────────────────────────────────────────────────────────
// RoleRoute — Requires specific role(s); shows 403 page if unauthorized
// Usage: <RoleRoute roles={['admin']}> or <RoleRoute roles={['admin','manager']}>
// ─────────────────────────────────────────────────────────────────────────────
export const RoleRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <AuthLoader />;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

// ─────────────────────────────────────────────────────────────────────────────
// PublicRoute — Redirects authenticated users away from login/register pages
// ─────────────────────────────────────────────────────────────────────────────
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <AuthLoader />;

    if (isAuthenticated) {
        // Redirect to role-specific dashboard
        const dashboardMap = {
            admin: '/admin/dashboard',
            manager: '/manager/dashboard',
            employee: '/employee/dashboard',
        };
        return <Navigate to={dashboardMap[user?.role] || '/employee/dashboard'} replace />;
    }

    return children;
};

export default ProtectedRoute;
