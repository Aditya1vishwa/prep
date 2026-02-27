import { Request, Response } from "express";
import { Types } from "mongoose";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../db/mongodb/models/User.js";
import Workspace, { generateWorkspaceSlug } from "../db/mongodb/models/Workspace.js";
import Credit from "../db/mongodb/models/Credit.js";
import AccessLevel from "../db/mongodb/models/AccessLevel.js";
import Notification from "../db/mongodb/models/Notification.js";
import ServiceData from "../db/mongodb/models/ServiceData.js";
import authHelpers from "../helpers/Auth.js";
import { PAGINATION } from "../constant/dbConstant.js";
import { getDefaultAccessConfig, getDefaultAssetConfig } from "../helpers/serviceData.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Finds a user by email or creates a placeholder user if not found.
 */
async function findOrCreateUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
        // Create placeholder user with default data
        const password = crypto.randomBytes(16).toString("hex");
        const hashedPassword = await authHelpers.hashPassword(password);
        user = await User.create({
            name: cleanEmail.split("@")[0],
            email: cleanEmail,
            password: hashedPassword,
            status: "active",
            isEmailVerified: false,
        });
    }
    return user;
}

function normalizeWorkspaceRole(role?: string) {
    if (!role) return "member";
    return role === "viewer" ? "read" : role;
}

// ─── User Management ──────────────────────────────────────────────────────────

const listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT,
        search = "",
        role,
        status,
        sort = "createdAt",
        order = "desc",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(parseInt(String(limit)), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
        ];
    }

    if (role) query.role = role;
    if (status) query.status = status;

    const allowedSorts = ["name", "email", "createdAt", "lastLogin", "role", "status"];
    const sortField = allowedSorts.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [users, totalCounts] = await Promise.all([
        User.find(query)
            .select("-password -refreshToken -forgetPasswordToken")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limitNum)
            .populate("defaultWorkspace", "name slug type status"),
        User.countDocuments(query),
    ]);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                data: users,
                totalCounts,
                pageCounts: Math.ceil(totalCounts / limitNum),
                currentPage: pageNum,
                perPage: limitNum,
            },
            "Users fetched successfully"
        )
    );
});

const getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const user = await User.findById(userId)
        .select("-password -refreshToken -forgetPasswordToken")
        .populate("defaultWorkspace", "name slug type status meta settings");

    if (!user) throw new ApiError(404, "User not found");
    res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

const addUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, phone, role = "user" } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
        throw new ApiError(400, "Name, email and password are required");
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) throw new ApiError(409, "A user with this email already exists");

    const hashedPassword = await authHelpers.hashPassword(password);
    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim(),
        role,
    });

    const slug = generateWorkspaceSlug(`${name.trim()}'s Workspace`, String(user._id));
    const workspace = await Workspace.create({
        name: `${name.trim()}'s Workspace`,
        slug,
        userId: user._id,
        membersUser: [user._id],
        type: "personal",
        members: [{ user: user._id, role: "owner", status: "active", joinedAt: new Date() }],
    });

    user.defaultWorkspace = workspace._id;
    await user.save({ validateBeforeSave: false });

    await AccessLevel.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, ...(await getDefaultAccessConfig()) } },
        { upsert: true, new: true }
    );

    await Notification.create({
        userId: user._id,
        key: "account-created",
        value: "Your account was created by an admin.",
    });

    const safeUser = await User.findById(user._id)
        .select("-password -refreshToken -forgetPasswordToken")
        .populate("defaultWorkspace", "name slug type status");

    res.status(201).json(new ApiResponse(201, safeUser, "User created successfully"));
});

const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { name, email, phone, role, status } = req.body;

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (req.user && String(req.user._id) === userId && status && status !== "active") {
        throw new ApiError(400, "You cannot change your own account status");
    }

    if (name?.trim()) user.name = name.trim();
    if (phone?.trim() !== undefined) user.phone = phone.trim();
    if (role) user.role = role;
    if (status) user.status = status;

    if (email?.trim() && email.toLowerCase() !== user.email) {
        const emailExists = await User.findOne({
            email: email.toLowerCase().trim(),
            _id: { $ne: new Types.ObjectId(userId as string) },
        });
        if (emailExists) throw new ApiError(409, "This email is already in use");
        user.email = email.toLowerCase().trim();
    }

    await user.save();
    const updated = await User.findById(userId)
        .select("-password -refreshToken -forgetPasswordToken")
        .populate("defaultWorkspace", "name slug type status");

    res.status(200).json(new ApiResponse(200, updated, "User updated successfully"));
});

const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const hardDelete = req.query.hard === "true";

    if (req.user && String(req.user._id) === userId) {
        throw new ApiError(400, "You cannot delete your own account");
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (hardDelete) {
        await User.findByIdAndDelete(userId);
        res.status(200).json(new ApiResponse(200, {}, "User permanently deleted"));
    } else {
        user.status = "inactive";
        await user.save({ validateBeforeSave: false });
        res.status(200).json(new ApiResponse(200, {}, "User deactivated successfully"));
    }
});

// ─── Credits Management ───────────────────────────────────────────────────────

const listCredits = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
    const skip = (page - 1) * limit;

    const [credits, totalCounts] = await Promise.all([
        Credit.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Credit.countDocuments({ userId }),
    ]);

    res.json(new ApiResponse(200, { data: credits, totalCounts, page, limit }, "Credits fetched"));
});

const addCredit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { amount, type, description, expiryDate, creditUsed = 0 } = req.body;

    if (!amount || !type || !expiryDate) {
        throw new ApiError(400, "amount, type and expiryDate are required");
    }

    const creditAssign = type === "used" ? 0 : Math.abs(amount);
    const actualCreditUsed = type === "used" ? Math.abs(amount) : Math.abs(creditUsed);

    const credit = await Credit.create({
        userId: new Types.ObjectId(userId as string),
        amount,
        type,
        description,
        creditAssign,
        creditUsed: actualCreditUsed,
        expiryDate: new Date(expiryDate),
    });

    const delta = type === "used" ? -Math.abs(amount) : Math.abs(amount);
    await AccessLevel.findOneAndUpdate(
        { userId: userId },
        { $inc: { currentCredits: delta } },
        { upsert: true, new: true }
    );

    res.status(201).json(new ApiResponse(201, credit, "Credit added"));
});

const updateCredit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { creditId } = req.params;
    const { amount, description, expiryDate } = req.body;

    const credit = await Credit.findById(creditId);
    if (!credit) throw new ApiError(404, "Credit record not found");

    if (amount !== undefined && amount !== credit.amount) {
        const oldDelta = credit.type === "used" ? -Math.abs(credit.amount) : Math.abs(credit.amount);
        const newDelta = credit.type === "used" ? -Math.abs(amount) : Math.abs(amount);
        const diff = newDelta - oldDelta;

        await AccessLevel.findOneAndUpdate(
            { userId: credit.userId },
            { $inc: { currentCredits: diff } }
        );
        credit.amount = amount;
    }

    if (description !== undefined) credit.description = description;
    if (expiryDate !== undefined) credit.expiryDate = new Date(expiryDate);
    await credit.save();

    res.json(new ApiResponse(200, credit, "Credit updated"));
});

// ─── Access Level Management ──────────────────────────────────────────────────

const getAccessLevel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    let accessLevel = await AccessLevel.findOne({ userId });
    if (!accessLevel) {
        const defaultAccess = await getDefaultAccessConfig();
        accessLevel = await AccessLevel.create({
            userId: new Types.ObjectId(userId as string),
            ...defaultAccess,
        });
    }
    res.json(new ApiResponse(200, accessLevel, "Access level fetched"));
});

const updateAccessLevel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const fields = req.body;
    const allowedFields: Record<string, any> = {};
    const keys = ["plan", "canCreateWorkspace", "maxWorkspaces", "canInviteMembers", "maxTeamMembers", "canExportData", "canAccessAnalytics", "currentCredits"];

    keys.forEach(k => {
        if (fields[k] !== undefined) allowedFields[k] = fields[k];
    });

    const accessLevel = await AccessLevel.findOneAndUpdate(
        { userId },
        { $set: allowedFields },
        { new: true, upsert: true, runValidators: true }
    );
    res.json(new ApiResponse(200, accessLevel, "Access level updated"));
});

// ─── Workspace Management ─────────────────────────────────────────────────────

const listMyWorkspaces = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id;
    const workspaces = await Workspace.find({ membersUser: userId }).sort({ createdAt: 1 })
        .populate("members.user", "name email avatar");
    res.json(new ApiResponse(200, workspaces, "Workspaces fetched"));
});

const createWorkspace = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id;
    const { name, description, type = "team", members = [] } = req.body;
    if (!name?.trim()) throw new ApiError(400, "Workspace name is required");

    const accessLevel = await AccessLevel.findOne({ userId });
    if (!accessLevel || !accessLevel.canCreateWorkspace) {
        throw new ApiError(403, "Your plan does not allow creating additional workspaces");
    }

    const existingCount = await Workspace.countDocuments({
        $or: [{ userId: userId }, { membersUser: userId }, { "members.user": userId }],
        status: "active",
    });
    if (existingCount >= accessLevel.maxWorkspaces) {
        throw new ApiError(403, `You have reached your workspace limit (${accessLevel.maxWorkspaces})`);
    }

    const memberActions = (members || []).map(async (m: { email: string; role?: string }) => {
        if (!m.email) return null;
        const user = await findOrCreateUserByEmail(m.email);
        return {
            user: user._id,
            role: normalizeWorkspaceRole(m.role) as any,
            status: "active" as const,
            joinedAt: new Date(),
        };
    });
    const resolvedMembers = (await Promise.all(memberActions)).filter(Boolean);

    const slug = generateWorkspaceSlug(name.trim(), String(userId));
    const memberList = [
        { user: userId, role: "owner", status: "active" as const, joinedAt: new Date() },
        ...resolvedMembers.filter((m: any) => String(m.user) !== String(userId)),
    ];

    const workspace = await Workspace.create({
        name: name.trim(),
        slug,
        description: description?.trim(),
        userId: userId,
        type,
        membersUser: [userId, ...resolvedMembers.map(m => m.user)],
        members: memberList,
    });
    res.status(201).json(new ApiResponse(201, workspace, "Workspace created"));
});

const addMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { workspaceId } = req.params;
    const { email, role = "member" } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    if (!req.workspace || req.workspace._id !== workspaceId) {
        throw new ApiError(403, "Workspace access context is missing");
    }
    if (!["owner", "admin"].includes(req.workspace.role)) {
        throw new ApiError(403, "Only workspace owner or admin can add members");
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new ApiError(404, "Workspace not found");

    const user = await findOrCreateUserByEmail(email);
    if (workspace.members.some(m => String(m.user) === String(user._id))) {
        throw new ApiError(409, "User is already a member");
    }

    workspace.members.push({
        user: user._id as any,
        role: normalizeWorkspaceRole(role) as any,
        status: "active",
        joinedAt: new Date(),
    });
    await workspace.save();
    res.json(new ApiResponse(200, workspace, "Member added"));
});

const removeMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { workspaceId, memberId } = req.params;

    if (!req.workspace || req.workspace._id !== workspaceId) {
        throw new ApiError(403, "Workspace access context is missing");
    }
    if (!["owner", "admin"].includes(req.workspace.role)) {
        throw new ApiError(403, "Only workspace owner or admin can remove members");
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new ApiError(404, "Workspace not found");

    const targetMember = workspace.members.find(m => String(m.user) === String(memberId));
    if (!targetMember) throw new ApiError(404, "Member not found in workspace");
    if (targetMember.role === "owner") throw new ApiError(400, "Cannot remove the workspace owner");

    workspace.members = workspace.members.filter(m => String(m.user) !== String(memberId));
    await workspace.save();
    res.json(new ApiResponse(200, workspace, "Member removed"));
});

const updateMemberStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { workspaceId, memberId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
        throw new ApiError(400, "Invalid status. Must be 'active' or 'inactive'");
    }

    if (!req.workspace || req.workspace._id !== workspaceId) {
        throw new ApiError(403, "Workspace access context is missing");
    }
    if (!["owner", "admin"].includes(req.workspace.role)) {
        throw new ApiError(403, "Only workspace owner or admin can update member status");
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new ApiError(404, "Workspace not found");

    const targetMember = workspace.members.find(m => String(m.user) === String(memberId));
    if (!targetMember) throw new ApiError(404, "Member not found in workspace");
    if (targetMember.role === "owner") throw new ApiError(400, "Cannot change owner status");

    targetMember.status = status;
    await workspace.save();

    res.json(new ApiResponse(200, workspace, `Member status updated to ${status}`));
});

const getUserWorkspaces = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const workspaces = await Workspace.find({ membersUser: userId })
        .sort({ createdAt: -1 })
        .populate("members.user", "name email avatar");
    res.json(new ApiResponse(200, workspaces, "User workspaces fetched"));
});



// ─── Analytics ────────────────────────────────────────────────────────────────

const getAnalytics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [totalUsers, activeUsers, totalWorkspaces, newUsersLast30Days, newUsersPerDay] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: "active" }),
        Workspace.countDocuments(),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", count: 1 } },
        ]),
    ]);

    const newUsersLast7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const found = (newUsersPerDay as any[]).find(x => x.date === dateStr);
        newUsersLast7Days.push({ date: dateStr, count: found?.count ?? 0 });
    }

    res.status(200).json(new ApiResponse(200, { totalUsers, activeUsers, totalWorkspaces, newUsersLast30Days, newUsersLast7Days }, "Analytics fetched successfully"));
});

// ─── Controller Bundles ───────────────────────────────────────────────────────

const userControllerV1 = {
    get: { listUsers, getUser },
    post: { addUser },
    put: { updateUser },
    delete: { deleteUser },
};

const creditControllerV1 = {
    get: { listCredits },
    post: { addCredit },
    put: { updateCredit },
};

const accessLevelControllerV1 = {
    get: { getAccessLevel },
    post: { updateAccessLevel },
};

const workspaceControllerV1 = {
    get: { getUserWorkspaces, listMyWorkspaces },
    post: { createWorkspace, addMember },
    put: { updateMemberStatus },
    delete: { removeMember },
};

const analyticsControllerV1 = {
    get: { getAnalytics },
};

// ─── Settings (Default Access) ───────────────────────────────────────────────

const getDefaultAccessSetting = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = await getDefaultAccessConfig();
    res.status(200).json(new ApiResponse(200, data, "Default access fetched"));
});

const updateDefaultAccessSetting = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const incoming = req.body ?? {};
    const current = await getDefaultAccessConfig();
    const next = { ...current, ...incoming };

    await ServiceData.findOneAndUpdate(
        { key: "default-access" },
        { $set: { key: "default-access", accessTo: "default", value: next } },
        { upsert: true, new: true }
    );

    res.status(200).json(new ApiResponse(200, next, "Default access updated"));
});

const getDefaultAssetSetting = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = await getDefaultAssetConfig();
    res.status(200).json(new ApiResponse(200, data, "Default asset settings fetched"));
});

const updateDefaultAssetSetting = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const incoming = req.body ?? {};
    const current = await getDefaultAssetConfig();
    const next = { ...current, ...incoming };

    await ServiceData.findOneAndUpdate(
        { key: "default-assets" },
        { $set: { key: "default-assets", accessTo: "default", value: next } },
        { upsert: true, new: true }
    );

    res.status(200).json(new ApiResponse(200, next, "Default asset settings updated"));
});

const settingsControllerV1 = {
    get: { getDefaultAccessSetting, getDefaultAssetSetting },
    put: { updateDefaultAccessSetting, updateDefaultAssetSetting },
};

export {
    userControllerV1,
    creditControllerV1,
    accessLevelControllerV1,
    workspaceControllerV1,
    analyticsControllerV1,
    settingsControllerV1,
};
