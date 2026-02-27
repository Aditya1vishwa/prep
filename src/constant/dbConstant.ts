// ─── Plan Types ──────────────────────────────────────────────────────────────
export const PLAN_TYPES = [
    { key: "free", label: "Free" },
    { key: "basic", label: "Basic" },
    { key: "pro", label: "Pro" },
    { key: "enterprise", label: "Enterprise" },
] as const;

export type PlanType = (typeof PLAN_TYPES)[number]["key"];
export const PLAN_TYPE_VALUES = PLAN_TYPES.map((p) => p.key) as [PlanType, ...PlanType[]];

// ─── Credit Types ─────────────────────────────────────────────────────────────
export const CREDIT_TYPES = [
    { key: "assigned-by-admin", label: "Assigned by admin" },
    { key: "purchased", label: "Purchased" },
    { key: "used", label: "Used" },
] as const;

export type CreditType = (typeof CREDIT_TYPES)[number]["key"];
export const CREDIT_TYPE_VALUES = CREDIT_TYPES.map((c) => c.key) as [CreditType, ...CreditType[]];

// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = [
    { key: "user", label: "User" },
    { key: "admin", label: "Admin" },
] as const;

export type UserRole = (typeof USER_ROLES)[number]["key"];
export const USER_ROLE_VALUES = USER_ROLES.map((r) => r.key) as [UserRole, ...UserRole[]];

// ─── User Status ──────────────────────────────────────────────────────────────
export const USER_STATUS = [
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
    { key: "suspended", label: "Suspended" },
] as const;

export type UserStatus = (typeof USER_STATUS)[number]["key"];
export const USER_STATUS_VALUES = USER_STATUS.map((s) => s.key) as [UserStatus, ...UserStatus[]];

// ─── Workspace Types ──────────────────────────────────────────────────────────
export const WORKSPACE_TYPES = [
    { key: "personal", label: "Personal" },
    { key: "team", label: "Team" },
] as const;

export type WorkspaceType = (typeof WORKSPACE_TYPES)[number]["key"];
export const WORKSPACE_TYPE_VALUES = WORKSPACE_TYPES.map((t) => t.key) as [WorkspaceType, ...WorkspaceType[]];

// ─── Workspace Status ─────────────────────────────────────────────────────────
export const WORKSPACE_STATUS = [
    { key: "active", label: "Active" },
    { key: "archived", label: "Archived" },
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUS)[number]["key"];
export const WORKSPACE_STATUS_VALUES = WORKSPACE_STATUS.map((s) => s.key) as [WorkspaceStatus, ...WorkspaceStatus[]];

// ─── Workspace Member Roles ───────────────────────────────────────────────────
export const WORKSPACE_MEMBER_ROLES = [
    { key: "owner", label: "Owner" },
    { key: "admin", label: "Admin" },
    { key: "member", label: "Member" },
    { key: "read", label: "Read" },
    { key: "viewer", label: "Viewer" },
] as const;

export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number]["key"];
export const WORKSPACE_MEMBER_ROLE_VALUES = WORKSPACE_MEMBER_ROLES.map((r) => r.key) as [
    WorkspaceMemberRole,
    ...WorkspaceMemberRole[],
];

// ─── Storage Types ────────────────────────────────────────────────────────────
export const STORAGE_TYPES = [
    { key: "local", label: "Local Storage" },
    { key: "s3", label: "Amazon S3" },
] as const;

export type StorageType = (typeof STORAGE_TYPES)[number]["key"];
export const STORAGE_TYPE_VALUES = STORAGE_TYPES.map((s) => s.key) as [StorageType, ...StorageType[]];

// ─── Token Expiry Constants ───────────────────────────────────────────────────
export const TOKEN_EXPIRY = {
    ACCESS_TOKEN: "15m",
    REFRESH_TOKEN: "7d",
    FORGET_PASSWORD_TOKEN_HOURS: 1,
} as const;

// ─── Pagination Defaults ──────────────────────────────────────────────────────
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
} as const;
