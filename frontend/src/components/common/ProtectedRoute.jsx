import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-gray-400 font-medium animate-pulse">Verifying session...</p>
            </div>
        );
    }
    // User not logged in(Authentication)
    if (!user) {
        return <Navigate to="/login" />;
    }
    // User logged in but doesn't have the right role(Authorization)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" />;
    }
    return <Outlet />;
};

export default ProtectedRoute;
