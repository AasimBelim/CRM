import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthRouteProps {
    allowedRoles?: string[];
}

const AuthRoute = ({ allowedRoles }: AuthRouteProps) => {
    const { user, token, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/signin" replace />;
    }

    if (allowedRoles && user?.role && !allowedRoles.includes(user.role.toLowerCase())) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default AuthRoute;