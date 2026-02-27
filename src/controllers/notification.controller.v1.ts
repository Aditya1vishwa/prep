import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Notification from "../db/mongodb/models/Notification.js";

const listMyNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json(new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched"));
});

const markOneRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id;
    const { notificationId } = req.params;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const updated = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!updated) throw new ApiError(404, "Notification not found");
    res.json(new ApiResponse(200, updated, "Notification marked as read"));
});

const markAllRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    res.json(new ApiResponse(200, null, "All notifications marked as read"));
});

const createNotification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const requester = req.user;
    if (!requester) throw new ApiError(401, "Unauthorized");

    const { userId, key, value } = req.body;
    if (!key?.trim() || !value?.trim()) {
        throw new ApiError(400, "key and value are required");
    }

    const targetUserId =
        requester.role === "admin" && userId ? userId : String(requester._id);

    const notification = await Notification.create({
        userId: targetUserId,
        key: key.trim(),
        value: value.trim(),
    });

    res.status(201).json(new ApiResponse(201, notification, "Notification created"));
});

const notificationControllerV1 = {
    get: {
        listMyNotifications,
    },
    post: {
        createNotification,
    },
    patch: {
        markOneRead,
        markAllRead,
    },
};

export default notificationControllerV1;
