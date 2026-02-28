import axiosInstance from "./axiosInstance";
import type { WorkspaceItem } from "@/store/userStore";

export interface CreateWorkspacePayload {
    name: string;
    description?: string;
    type?: "personal" | "team";
    members?: { email: string; role?: string }[];
}

export const workspaceApi = {
    listMyWorkspaces: () =>
        axiosInstance.get<{ data: WorkspaceItem[] }>("/user/workspaces"),
    createWorkspace: (data: CreateWorkspacePayload) =>
        axiosInstance.post<{ data: WorkspaceItem }>("/user/workspaces", data),
    addMember: (workspaceId: string, email: string, role = "member") =>
        axiosInstance.post(`/user/workspaces/${workspaceId}/members`, { email, role }),
    updateMemberStatus: (workspaceId: string, memberId: string, status: "active" | "inactive") =>
        axiosInstance.put(`/user/workspaces/${workspaceId}/members/${memberId}`, { status }),
    removeMember: (workspaceId: string, memberId: string) =>
        axiosInstance.delete(`/user/workspaces/${workspaceId}/members/${memberId}`),
};
