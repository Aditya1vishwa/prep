import axiosInstance from "./axiosInstance";

export interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: "user" | "admin";
    status: "active" | "inactive" | "suspended";
    isEmailVerified: boolean;
    lastLogin?: string;
    avatar?: { url?: string; path?: string };
    defaultWorkspace?: { _id: string; name: string; slug: string; type: string; status: string };
    workspaces?: { _id: string; name: string; slug: string; type: string; status: string }[];
    createdAt: string;
}

export interface ListUsersParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sort?: string;
    order?: "asc" | "desc";
}

export interface AddUserPayload {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: string;
    workspaces?: { _id?: string; name: string; type: string; slug?: string; status?: string }[];
}

// ─── Credit ───────────────────────────────────────────────────────────────────

export interface Credit {
    _id: string;
    userId: string;
    amount: number;
    type: "assigned" | "purchased" | "used";
    creditAssign: number;
    creditUsed: number;
    description?: string;
    expiryDate: string;
    createdAt: string;

}

export interface AddCreditPayload {
    amount: number | string;
    type: "assigned" | "purchased" | "used";
    description?: string;
    expiryDate: string;
    creditUsed?: number;
}

// ─── Access Level ─────────────────────────────────────────────────────────────

export interface AccessLevel {
    _id: string;
    userId: string;
    plan: "free" | "basic" | "pro" | "enterprise";
    canCreateWorkspace: boolean;
    maxWorkspaces: number;
    canInviteMembers: boolean;
    maxTeamMembers: number;
    canExportData: boolean;
    canAccessAnalytics: boolean;
    currentCredits: number;
}

export interface DefaultAccessSetting {
    plan: "free" | "basic" | "pro" | "enterprise";
    canCreateWorkspace: boolean;
    maxWorkspaces: number;
    canInviteMembers: boolean;
    maxTeamMembers: number;
    canExportData: boolean;
    canAccessAnalytics: boolean;
    currentCredits: number;
}

export interface DefaultAssetSetting {
    appLogoUrl: string;
    smallLogoUrl: string;
    faviconUrl: string;
    appName: string;
    primaryColor: string;
}

// ─── Workspace (admin view) ───────────────────────────────────────────────────

export interface AdminWorkspace {
    _id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    userId: string;
    members: { user: string; role: string; joinedAt: string }[];
    createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const adminApi = {
    // ── Users
    listUsers: (params?: ListUsersParams) =>
        axiosInstance.get("/admin/users", { params }),
    getUser: (userId: string) => axiosInstance.get(`/admin/users/${userId}`),
    addUser: (data: AddUserPayload) => axiosInstance.post("/admin/users", data),
    updateUser: (userId: string, data: UpdateUserPayload) =>
        axiosInstance.put(`/admin/users/${userId}`, data),
    deleteUser: (userId: string, hard = false) =>
        axiosInstance.delete(`/admin/users/${userId}`, { params: { hard } }),
    createWorkspace: (userId: string, data: { name: string; type?: string; description?: string; members?: { email: string; role?: string }[] }) =>
        axiosInstance.post(`/admin/users/${userId}/workspaces`, data),
    changeStatus: (userId: string, status: string) =>
        axiosInstance.patch(`/admin/users/${userId}/status`, { status }),

    // ── Credits
    listCredits: (userId: string, params?: { page?: number; limit?: number }) =>
        axiosInstance.get<{ data: { data: Credit[]; totalCounts: number } }>(`/admin/users/${userId}/credits`, { params }),
    addCredit: (userId: string, data: AddCreditPayload) =>
        axiosInstance.post(`/admin/users/${userId}/credits`, data),
    updateCredit: (creditId: string, data: Partial<Pick<Credit, "amount" | "description">>) =>
        axiosInstance.put(`/admin/credits/${creditId}`, data),

    // ── Access Level
    getAccessLevel: (userId: string) =>
        axiosInstance.get<{ data: AccessLevel }>(`/admin/users/${userId}/access-level`),
    updateAccessLevel: (userId: string, data: Partial<Omit<AccessLevel, "_id" | "user">>) =>
        axiosInstance.put(`/admin/users/${userId}/access-level`, data),

    // ── Workspaces
    getUserWorkspaces: (userId: string) =>
        axiosInstance.get<{ data: AdminWorkspace[] }>(`/admin/users/${userId}/workspaces`),

    // ── Analytics
    getAnalytics: () => axiosInstance.get("/admin/analytics"),

    // ── Settings
    getDefaultAccessSetting: () =>
        axiosInstance.get<{ data: DefaultAccessSetting }>("/admin/settings/default-access"),
    updateDefaultAccessSetting: (data: Partial<DefaultAccessSetting>) =>
        axiosInstance.put("/admin/settings/default-access", data),
    getDefaultAssetSetting: () =>
        axiosInstance.get<{ data: DefaultAssetSetting }>("/admin/settings/default-assets"),
    updateDefaultAssetSetting: (data: Partial<DefaultAssetSetting>) =>
        axiosInstance.put("/admin/settings/default-assets", data),
};
