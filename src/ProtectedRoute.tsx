import React from "react";
import { Navigate, useLocation } from "react-router";
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
    onboardingCompleted?: boolean;
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
    const location = useLocation();
    const isOnboardingRoute = location.pathname === "/onboarding";

    const getAuthenticatedRedirect = (currentUser: User) => {
        if (currentUser.role === "user" && !currentUser.onboardingCompleted && !isOnboardingRoute) {
            return "/onboarding";
        }
        if (currentUser.role === "user" && currentUser.onboardingCompleted && isOnboardingRoute) {
            return getDashboardRoute(currentUser.role);
        }
        return getDashboardRoute(currentUser.role);
    };

    // Guest only pages
    if (allowedFor === "no-auth") {
        return !user ? <>{children}</> : <Navigate to={getAuthenticatedRedirect(user)} replace />;
    }

    // Any authenticated user
    if (allowedFor === "authenticated") {
        if (!user) return <Navigate to="/login" replace />;
        if (user.role === "user" && !user.onboardingCompleted && !isOnboardingRoute) {
            return <Navigate to="/onboarding" replace />;
        }
        if (user.role === "user" && user.onboardingCompleted && isOnboardingRoute) {
            return <Navigate to={getDashboardRoute(user.role)} replace />;
        }
        return <>{children}</>;
    }

    // Role-based
    if (Array.isArray(allowedFor)) {
        if (!user) return <Navigate to="/login" replace />;
        if (user.role === "user" && !user.onboardingCompleted && !isOnboardingRoute) {
            return <Navigate to="/onboarding" replace />;
        }
        return allowedFor.includes(user.role) ? (
            <>{children}</>
        ) : (
            <Navigate to={getDashboardRoute(user.role)} replace />
        );
    }

    return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
