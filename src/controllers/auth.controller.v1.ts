import { Request, Response } from "express";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../db/mongodb/models/User.js";
import Workspace, { generateWorkspaceSlug } from "../db/mongodb/models/Workspace.js";
import AccessLevel from "../db/mongodb/models/AccessLevel.js";
import Notification from "../db/mongodb/models/Notification.js";
import authHelpers from "../helpers/Auth.js";
import { Types } from "mongoose";
import { getDefaultAccessConfig } from "../helpers/serviceData.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateTokens = async (userId: string) => {
    const user = await User.findById(userId).select("+refreshToken");
    if (!user) throw new ApiError(500, "User not found in token generation");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/signup
 * Body: { name, email, password, phone? }
 */
const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
        throw new ApiError(400, "Name, email and password are required");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        throw new ApiError(409, "A user with this email already exists");
    }

    const hashedPassword = await authHelpers.hashPassword(password);

    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim(),
    });

    // Create default personal workspace
    const slug = generateWorkspaceSlug(`${name.trim()}'s Workspace`, String(user._id));
    const workspace = await Workspace.create({
        name: `${name.trim()}'s Workspace`,
        slug,
        userId: user._id,
        type: "personal",
        membersUser: [user._id],
        members: [{ user: user._id, role: "owner", joinedAt: new Date() }],
    });

    // Link default workspace to user
    user.defaultWorkspace = workspace._id as Types.ObjectId;
    await user.save({ validateBeforeSave: false });

    const defaultAccess = await getDefaultAccessConfig();

    // Create default AccessLevel from service data
    await AccessLevel.create({
        userId: user._id,
        ...defaultAccess,
    });

    await Notification.create({
        userId: user._id,
        key: "welcome",
        value: "Welcome to PrepBuddy. Your account is ready.",
    });

    const { accessToken, refreshToken } = await generateTokens(String(user._id));

    const safeUser = await User.findById(user._id).select(
        "-password -refreshToken -forgetPasswordToken"
    );

    res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, { ...cookieOptions, path: "/api/v1/auth/refresh-token" })
        .json(
            new ApiResponse(
                201,
                { user: safeUser, workspace },
                "Account created successfully"
            )
        );
});

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({
        email: email.toLowerCase().trim(),
        status: "active",
    }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await authHelpers.comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateTokens(String(user._id));

    await AccessLevel.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, ...(await getDefaultAccessConfig()) } },
        { upsert: true, new: true }
    );

    const safeUser = await User.findById(user._id)
        .select("-password -refreshToken -forgetPasswordToken")
        .populate("defaultWorkspace", "name slug type status");

    let workspaces: any[] = [];
    if (safeUser && safeUser.role !== "admin") {
        workspaces = await Workspace.find({ membersUser: user._id })
            .sort({ createdAt: 1 })
            .populate("members.user", "name email avatar");
    }

    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, { ...cookieOptions, path: "/api/v1/auth/refresh-token" })
        .json(
            new ApiResponse(
                200,
                { user: safeUser, workspaces },
                "Login successful"
            )
        );
});

/**
 * POST /api/v1/auth/logout
 * Requires: verifyJWT
 */
const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            if (decoded?.id) {
                await User.findByIdAndUpdate(
                    decoded.id,
                    { $unset: { refreshToken: 1 } },
                    { new: true }
                );
            }
        } catch {
            // token invalid/expired: still clear cookies and return success
        }
    }

    res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", { ...cookieOptions, path: "/api/v1/auth/refresh-token" })
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

/**
 * POST /api/v1/auth/forgot-password
 * Body: { email }
 */
const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return same response to prevent email enumeration
    const genericMsg = "If an account with that email exists, a reset link has been sent";

    if (!user) {
        res.status(200).json(new ApiResponse(200, {}, genericMsg));
        return;
    }

    // Generate a secure raw token, store hashed version in DB
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.forgetPasswordToken = hashedToken;
    user.forgetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // In production: send rawToken via email
    // For now we return it directly (dev/testing only)
    res.status(200).json(
        new ApiResponse(
            200,
            {
                // TODO: Remove in production — send via email instead
                resetToken: process.env.NODE_ENV !== "production" ? rawToken : undefined,
            },
            genericMsg
        )
    );
});

/**
 * POST /api/v1/auth/reset-password
 * Body: { token, newPassword }
 */
const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        throw new ApiError(400, "Reset token and new password are required");
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        forgetPasswordToken: hashedToken,
        forgetPasswordTokenExpiry: { $gt: new Date() },
    }).select("+forgetPasswordToken");

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = await authHelpers.hashPassword(newPassword);
    user.forgetPasswordToken = undefined;
    user.forgetPasswordTokenExpiry = undefined;
    user.refreshToken = undefined; // invalidate all sessions
    await user.save({ validateBeforeSave: false });

    res.status(200).json(new ApiResponse(200, {}, "Password reset successfully. Please login again."));
});

/**
 * POST /api/v1/auth/refresh-token
 * Cookie or Body: { refreshToken }
 */
const refreshAccessToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    let decoded: { id: string };
    try {
        const jwt = await import("jsonwebtoken");
        decoded = jwt.default.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_SECRET as string
        ) as { id: string };
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token mismatch. Please login again.");
    }

    const { accessToken, refreshToken } = await generateTokens(String(user._id));

    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, { ...cookieOptions, path: "/api/v1/auth/refresh-token" })
        .json(new ApiResponse(200, {}, "Token refreshed successfully"));
});

/**
 * POST /api/v1/auth/seed-user  (DEV ONLY)
 * Quickly create a user from JSON — no email verification, no workspace required.
 * Body: { name, email, password, phone?, role?, status? }
 * Returns: { user, accessToken }
 *
 * ⚠️  Disabled in production.
 */
const seedDummyUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === "production") {
        throw new ApiError(403, "This endpoint is only available in development");
    }

    const { name, email, password, phone, role = "user", status = "active" } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
        throw new ApiError(400, "name, email and password are required");
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
        throw new ApiError(409, `A user with email "${email}" already exists`);
    }

    const hashedPassword = await authHelpers.hashPassword(password);

    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim(),
        role,
        status,
        isEmailVerified: true,
    });

    await AccessLevel.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, ...(await getDefaultAccessConfig()) } },
        { upsert: true, new: true }
    );

    await Notification.create({
        userId: user._id,
        key: "welcome",
        value: `Welcome ${name.trim()}! Your account was created.`,
    });

    const { accessToken, refreshToken } = await generateTokens(String(user._id));

    const safeUser = await User.findById(user._id).select(
        "-password -refreshToken -forgetPasswordToken"
    );

    res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, { ...cookieOptions, path: "/api/v1/auth/refresh-token" })
        .json(
            new ApiResponse(
                201,
                { user: safeUser },
                `Dummy user "${name.trim()}" created successfully`
            )
        );
});

// ─── Update Current User (PATCH /auth/me) ────────────────────────────────────

export const updateMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, phone } = req.body;
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const updates: Record<string, string> = {};
    if (name?.trim()) updates.name = name.trim();
    if (phone?.trim()) updates.phone = phone.trim();

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
    ).select("-password -refreshToken -forgetPasswordToken");

    res.json(new ApiResponse(200, user, "Profile updated"));
});

// ─── Get Current User (GET /auth/me) ─────────────────────────────────────────

export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await User.findById(userId)
        .select("-password -refreshToken -forgetPasswordToken")
        .populate("defaultWorkspace", "name slug type status");

    if (!user) throw new ApiError(404, "User not found");

    let workspaces: any[] = [];
    if (user.role !== "admin") {
        workspaces = await Workspace.find({ membersUser: userId })
            .sort({ createdAt: 1 })
            .populate("members.user", "name email avatar");
    }

    res.json(new ApiResponse(200, { user, workspaces }, "Current user fetched"));
});

// ─── Change Password (POST /auth/change-password) ────────────────────────────

export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!currentPassword || !newPassword) throw new ApiError(400, "Both fields required");
    if (newPassword.length < 6) throw new ApiError(400, "New password must be at least 6 characters");

    const user = await User.findById(userId).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await authHelpers.comparePassword(currentPassword, user.password);
    if (!isMatch) throw new ApiError(400, "Current password is incorrect");

    user.password = await authHelpers.hashPassword(newPassword);
    await user.save({ validateBeforeSave: false });

    res.json(new ApiResponse(200, null, "Password changed successfully"));
});

const authControllerV1 = {
    get: {
        me: getMe,
    },
    post: {
        signup,
        login,
        logout,
        forgotPassword,
        resetPassword,
        refreshAccessToken,
        seedDummyUser,
        changePassword,
    },
    patch: {
        updateMe,
    },
}

export default authControllerV1;
