import ServiceData from "../db/mongodb/models/ServiceData.js";

export interface DefaultAccessConfig {
    plan: "free" | "basic" | "pro" | "enterprise";
    canCreateWorkspace: boolean;
    maxWorkspaces: number;
    canInviteMembers: boolean;
    maxTeamMembers: number;
    canExportData: boolean;
    canAccessAnalytics: boolean;
    currentCredits: number;
}

export interface DefaultAssetConfig {
    appLogoUrl: string;
    smallLogoUrl: string;
    faviconUrl: string;
    appName: string;
    primaryColor: string;
}

const FALLBACK_DEFAULT_ACCESS: DefaultAccessConfig = {
    plan: "free",
    canCreateWorkspace: false,
    maxWorkspaces: 1,
    canInviteMembers: false,
    maxTeamMembers: 1,
    canExportData: false,
    canAccessAnalytics: false,
    currentCredits: 0,
};

const FALLBACK_DEFAULT_ASSET: DefaultAssetConfig = {
    appLogoUrl: "",
    smallLogoUrl: "",
    faviconUrl: "",
    appName: "PrepBuddy",
    primaryColor: "#6366f1",
};

export async function getDefaultAccessConfig(): Promise<DefaultAccessConfig> {
    const doc = await ServiceData.findOneAndUpdate(
        { key: "default-access" },
        {
            $setOnInsert: {
                key: "default-access",
                accessTo: "default",
                value: FALLBACK_DEFAULT_ACCESS,
            },
        },
        { upsert: true, new: true }
    );

    return { ...FALLBACK_DEFAULT_ACCESS, ...(doc?.value ?? {}) };
}

export async function getDefaultAssetConfig(): Promise<DefaultAssetConfig> {
    const doc = await ServiceData.findOneAndUpdate(
        { key: "default-assets" },
        {
            $setOnInsert: {
                key: "default-assets",
                accessTo: "default",
                value: FALLBACK_DEFAULT_ASSET,
            },
        },
        { upsert: true, new: true }
    );

    return { ...FALLBACK_DEFAULT_ASSET, ...(doc?.value ?? {}) };
}
