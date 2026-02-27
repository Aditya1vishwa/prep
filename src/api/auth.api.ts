import axiosInstance from "./axiosInstance";
import type { AuthUser } from "@/store/userStore";
import type { WorkspaceItem } from "@/store/userStore";

export type { AuthUser };



export interface LoginPayload {
    email: string;
    password: string;
}

export interface SignupPayload {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface MeResponse {
    user: AuthUser;
    workspaces: WorkspaceItem[];
}

export interface LoginResponse extends MeResponse {}

export const authApi = {
    login: (data: LoginPayload) => axiosInstance.post<{ data: LoginResponse }>("/auth/login", data),
    signup: (data: SignupPayload) => axiosInstance.post("/auth/signup", data),
    me: () => axiosInstance.get<{ data: MeResponse }>("/auth/me"),
    logout: () => axiosInstance.post("/auth/logout"),
    forgotPassword: (email: string) =>
        axiosInstance.post("/auth/forgot-password", { email }),
    resetPassword: (token: string, newPassword: string) =>
        axiosInstance.post("/auth/reset-password", { token, newPassword }),
    refreshToken: () => axiosInstance.post("/auth/refresh-token"),
    updateMe: (data: { name?: string; phone?: string }) =>
        axiosInstance.patch("/auth/me", data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        axiosInstance.post("/auth/change-password", data),
    getMyAccessLevel: () => axiosInstance.get("/auth/me/access-level"),
};
