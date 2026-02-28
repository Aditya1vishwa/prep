import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppLayout from "@/AppLayout";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import UserDashboardPage from "@/pages/user/UserDashboardPage";
import OnboardingPage from "@/pages/user/OnboardingPage";
import UsersPage from "@/pages/admin/UsersPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import ProfilePage from "@/pages/user/ProfilePage";
import OverviewPage from "@/pages/OverviewPage";
import NotificationsPage from "@/pages/common/NotificationsPage";
import ProtectedRoute from "@/ProtectedRoute";
import AuthLayout from "@/layouts/AuthLayout";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AuthLayout />}>
                    <Route path="/" element={<OverviewPage />} />
                    <Route
                        path="/login"
                        element={
                            <ProtectedRoute allowedFor="no-auth">
                                <LoginPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/signup"
                        element={
                            <ProtectedRoute allowedFor="no-auth">
                                <SignupPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/overview"
                        element={<Navigate to="/" replace />}
                    />
                    <Route
                        path="/onboarding"
                        element={
                            <ProtectedRoute allowedFor="authenticated">
                                <OnboardingPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        element={
                            <ProtectedRoute allowedFor="authenticated">
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            path="admin/dashboard"
                            element={
                                <ProtectedRoute allowedFor={["admin"]}>
                                    <AdminDashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="dashboard"
                            element={
                                <ProtectedRoute allowedFor={["user"]}>
                                    <UserDashboardPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="profile"
                            element={
                                <ProtectedRoute allowedFor="authenticated">
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="notifications"
                            element={
                                <ProtectedRoute allowedFor="authenticated">
                                    <NotificationsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/users"
                            element={
                                <ProtectedRoute allowedFor={["admin"]}>
                                    <UsersPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="admin/settings"
                            element={
                                <ProtectedRoute allowedFor={["admin"]}>
                                    <SettingsPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
