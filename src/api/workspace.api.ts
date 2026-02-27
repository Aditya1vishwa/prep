import axiosInstance from "./axiosInstance";
import type { WorkspaceItem } from "@/store/userStore";

export interface CreateWorkspacePayload {
    name: string;
    description?: string;
    type?: "personal" | "team";
    members?: { userId: string; role?: string }[];
}

export const workspaceApi = {
    listMyWorkspaces: () =>
        axiosInstance.get<{ data: WorkspaceItem[] }>("/workspaces"),

    createWorkspace: (data: CreateWorkspacePayload) =>
        axiosInstance.post<{ data: WorkspaceItem }>("/workspaces", data),

    addMember: (workspaceId: string, email: string, role = "member") =>
        axiosInstance.post(`/workspaces/${workspaceId}/members`, { email, role }),

    updateMemberStatus: (workspaceId: string, memberId: string, status: "active" | "inactive") =>
        axiosInstance.put(`/workspaces/${workspaceId}/members/${memberId}`, { status }),

    removeMember: (workspaceId: string, memberId: string) =>
        axiosInstance.delete(`/workspaces/${workspaceId}/members/${memberId}`),
};
