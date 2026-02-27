import axiosInstance from "./axiosInstance";

export interface NotificationItem {
    _id: string;
    userId: string;
    key: string;
    value: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationListResponse {
    notifications: NotificationItem[];
    unreadCount: number;
}

export const notificationApi = {
    list: () => axiosInstance.get<{ data: NotificationListResponse }>("/notifications"),
    markRead: (notificationId: string) =>
        axiosInstance.patch(`/notifications/${notificationId}/read`),
    markAllRead: () => axiosInstance.patch("/notifications/read-all"),
    create: (data: { userId?: string; key: string; value: string }) =>
        axiosInstance.post("/notifications", data),
};
