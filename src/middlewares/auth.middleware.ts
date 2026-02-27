import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../db/mongodb/models/User.js";
import Workspace from "../db/mongodb/models/Workspace.js";

// ─── Augment Express Request ──────────────────────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            workspace?: {
                _id: string;
                role: string;
            };
        }
    }
}

const pickWorkspaceId = (req: Request): string | undefined => {
    const fromHeaderRaw = req.header("x-workspace-id");
    const fromHeader = Array.isArray(fromHeaderRaw) ? fromHeaderRaw[0] : fromHeaderRaw;
    const fromParams = req.params?.workspaceId;
    const fromQuery = typeof req.query?.workspaceId === "string" ? req.query.workspaceId : undefined;
    const body = req.body as Record<string, unknown> | undefined;
    const fromBody = typeof body?.workspaceId === "string" ? body.workspaceId : undefined;

    return fromHeader || fromParams || fromQuery || fromBody;
};

// ─── Verify JWT (access token) ────────────────────────────────────────────────

export const verifyJWT = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        } catch {
            throw new ApiError(401, "Invalid or expired access token");
        }

        const user = await User.findById(decoded.id).select(
            "-password -refreshToken -forgetPasswordToken"
        );

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        if (user.status !== "active") {
            throw new ApiError(403, "Your account is inactive or suspended");
        }

        req.user = user;

        const workspaceId = pickWorkspaceId(req);
        if (workspaceId) {
            if (!Types.ObjectId.isValid(workspaceId)) {
                throw new ApiError(400, "Invalid workspace id");
            }

            const workspace = await Workspace.findById(workspaceId).select("userId members status");
            if (!workspace) {
                throw new ApiError(404, "Workspace not found");
            }

            if (workspace.status !== "active") {
                throw new ApiError(403, "Workspace is not active");
            }

            const userId = String(user._id);
            let role: string | null = null;

            if (String(workspace.userId) === userId) {
                role = "owner";
            } else {
                const member = workspace.members.find(
                    (m) => String(m.user) === userId && m.status === "active"
                );
                if (member) {
                    role = member.role;
                }
            }

            if (!role && user.role === "admin") {
                role = "admin";
            }

            if (!role) {
                throw new ApiError(403, "You do not have access to this workspace");
            }

            req.workspace = { _id: String(workspace._id), role };
        }
        next();
    }
);

// ─── Verify Admin ─────────────────────────────────────────────────────────────

export const verifyAdmin = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized request");
        }
        if (req.user.role !== "admin") {
            throw new ApiError(403, "Access denied. Admin privileges required.");
        }
        next();
    }
);
