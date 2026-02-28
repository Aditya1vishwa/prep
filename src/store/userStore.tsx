import { create } from "zustand";
import { set as setLodash } from "lodash";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: "user" | "admin";
    status: string;
    avatar?: { url?: string; path?: string };
    onboardingCompleted?: boolean;
    defaultWorkspace?: {
        _id: string;
        name: string;
        slug: string;
        type: string;
        status: string;
    };
    isEmailVerified: boolean;
    lastLogin?: string;
    createdAt: string;
}

export interface WorkspaceItem {
    _id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    members: { user: string; role: string; joinedAt: string }[];
    owner: string;
    createdAt: string;
}

interface UserStoreState {
    user: AuthUser | null;
    workspaces: WorkspaceItem[];
    UStore: (key: string, value: any) => Promise<boolean>;
}

const useUserStore = create<UserStoreState>()((set) => ({
    user: null,
    workspaces: [],
    UStore: (key: string, value: any) => {
        return new Promise((resolve) => {
            set((state: any) => {
                const newState = { ...state };
                setLodash(newState, key, value);
                return newState;
            });
            resolve(true);
        });
    }
}));

export default useUserStore;
