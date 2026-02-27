import { Schema, model, Document, Types } from "mongoose";
import {
    WorkspaceType,
    WORKSPACE_TYPE_VALUES,
    WorkspaceStatus,
    WORKSPACE_STATUS_VALUES,
    WorkspaceMemberRole,
    WORKSPACE_MEMBER_ROLE_VALUES,
} from "../../../constant/dbConstant.js";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IWorkspaceMember {
    user: Types.ObjectId;
    role: WorkspaceMemberRole;
    status: "active" | "inactive";
    joinedAt: Date;
}

export interface IWorkspace extends Document {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    userId: Types.ObjectId;
    members: IWorkspaceMember[];
    membersUser: Types.ObjectId[];

    type: WorkspaceType;
    status: WorkspaceStatus;
    settings: {
        isPublic: boolean;
        maxMembers: number;
        allowInvites: boolean;
    };
    meta: {
        logo?: { url?: string; path?: string; name?: string };
        color?: string;
        icon?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const memberSchema = new Schema<IWorkspaceMember>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: WORKSPACE_MEMBER_ROLE_VALUES,
            default: "member",
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const workspaceSchema = new Schema<IWorkspace>(
    {
        name: {
            type: String,
            required: [true, "Workspace name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                "Slug must be lowercase alphanumeric with hyphens",
            ],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        members: {
            type: [memberSchema],
            default: [],
        },
        membersUser: {
            type: [{ type: Schema.Types.ObjectId, ref: "User" }],
            default: [],
            index: true,
        },
        type: {
            type: String,
            enum: WORKSPACE_TYPE_VALUES,
            default: "personal",
        },
        status: {
            type: String,
            enum: WORKSPACE_STATUS_VALUES,
            default: "active",
            index: true,
        },
        settings: {
            isPublic: { type: Boolean, default: false },
            maxMembers: { type: Number, default: 10, min: 1, max: 500 },
            allowInvites: { type: Boolean, default: true },
        },
        meta: {
            logo: {
                url: { type: String },
                path: { type: String },
                name: { type: String },
            },
            color: { type: String, default: "#6366f1" },
            icon: { type: String, default: "briefcase" },
        },
    },
    {
        timestamps: true,
    }
);

export function getActiveMembersUserIds(
    members: IWorkspaceMember[] = [],
    ownerId?: Types.ObjectId
): Types.ObjectId[] {
    const ids = new Set<string>();

    for (const member of members) {
        if (member?.user && member.status === "active") {
            ids.add(String(member.user));
        }
    }

    if (ownerId) {
        ids.add(String(ownerId));
    }

    return Array.from(ids).map((id) => new Types.ObjectId(id));
}

workspaceSchema.pre("save", function () {
    this.membersUser = getActiveMembersUserIds(this.members, this.userId);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

workspaceSchema.index({ userId: 1, status: 1 });
workspaceSchema.index({ "members.user": 1 });
workspaceSchema.index({ membersUser: 1, status: 1 });

// ─── Statics / Helpers ────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from a name.
 * Call this before creating a workspace.
 */
export function generateWorkspaceSlug(name: string, userId: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40);
    const suffix = userId.slice(-6);
    return `${base}-${suffix}`;
}

// ─── Model ────────────────────────────────────────────────────────────────────

const Workspace = model<IWorkspace>("Workspace", workspaceSchema);
export default Workspace;
