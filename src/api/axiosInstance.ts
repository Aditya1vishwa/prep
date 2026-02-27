import axios from "axios";
import useUserStore from "@/store/userStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8002/api/v1";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
    const { user, workspaces } = useUserStore.getState() as any;
    const selectedWorkspaceId =
        user?.selectedWorkspaceId ||
        user?.defaultWorkspace?._id ||
        workspaces?.[0]?._id;

    if (selectedWorkspaceId) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>)["x-workspace-id"] = selectedWorkspaceId;
    }

    return config;
});

// Response interceptor
axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error.response?.status;
        const requestUrl = String(error?.config?.url ?? "");
        const isAuthAttempt = [
            "/auth/login",
            "/auth/signup",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/auth/seed-user",
            "/auth/refresh-token",
            "/auth/me",
        ].some((path) => requestUrl.includes(path));

        if (status === 401 && !isAuthAttempt) {
            const { UStore } = useUserStore.getState();
            await Promise.all([
                UStore("user", null),
                UStore("workspaces", []),
            ]);

            const publicPaths = ["/", "/login", "/signup", "/overview"];
            if (!publicPaths.includes(window.location.pathname)) {
                window.history.replaceState(null, "", "/login");
                window.dispatchEvent(new PopStateEvent("popstate"));
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
