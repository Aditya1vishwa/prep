import { Schema, model, Document, Types } from "mongoose";
import { PlanType, PLAN_TYPE_VALUES } from "../../../constant/dbConstant.js";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAccessLevel extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    plan: PlanType;
    // Workspace access
    canCreateWorkspace: boolean;
    maxWorkspaces: number;
    // Team / member access
    canInviteMembers: boolean;
    maxTeamMembers: number;
    // Feature flags
    canExportData: boolean;
    canAccessAnalytics: boolean;
    // Credits
    currentCredits: number;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const accessLevelSchema = new Schema<IAccessLevel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        plan: {
            type: String,
            enum: PLAN_TYPE_VALUES,
            default: "free",
        },
        // Workspace
        canCreateWorkspace: {
            type: Boolean,
            default: false,
        },
        maxWorkspaces: {
            type: Number,
            default: 1,
            min: 1,
        },
        // Team
        canInviteMembers: {
            type: Boolean,
            default: false,
        },
        maxTeamMembers: {
            type: Number,
            default: 1,
            min: 1,
        },
        // Features
        canExportData: {
            type: Boolean,
            default: false,
        },
        canAccessAnalytics: {
            type: Boolean,
            default: false,
        },
        // Credits
        currentCredits: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

// ─── Model ────────────────────────────────────────────────────────────────────

const AccessLevel = model<IAccessLevel>("AccessLevel", accessLevelSchema);
export default AccessLevel;
