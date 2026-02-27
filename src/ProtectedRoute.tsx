import React from "react";
import { Navigate } from "react-router";
import useUserStore from "@/store/userStore";
import { getDashboardRoute } from "@/lib/dashboard-route";

export type UserRole = "admin" | "user";

export type AllowedAccess =
    | "no-auth"
    | "authenticated"
    | UserRole[];

interface User {
    _id: string;
    role: UserRole;
}

interface ProtectedRouteProps {
    allowedFor: AllowedAccess;
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedFor,
    children,
}) => {
    const user = useUserStore((s) => s.user) as User | null;

    // Guest only pages
    if (allowedFor === "no-auth") {
        return !user ? <>{children}</> : <Navigate to={getDashboardRoute(user.role)} replace />;
    }

    // Any authenticated user
    if (allowedFor === "authenticated") {
        return user ? <>{children}</> : <Navigate to="/login" replace />;
    }

    // Role-based
    if (Array.isArray(allowedFor)) {
        if (!user) return <Navigate to="/login" replace />;
        return allowedFor.includes(user.role) ? (
            <>{children}</>
        ) : (
            <Navigate to={getDashboardRoute(user.role)} replace />
        );
    }

    return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
