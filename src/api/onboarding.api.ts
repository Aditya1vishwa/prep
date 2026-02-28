import axiosInstance from "./axiosInstance";
import type { OnboardingData } from "@/types/onboarding";

export const onboardingApi = {
    getMe: () => axiosInstance.get<{ data: OnboardingData }>("/onboarding/me"),
    saveStep: (step: string, data: unknown) =>
        axiosInstance.post<{ data: OnboardingData }>(`/onboarding/step/${step}`, { data }),
    updateMe: (payload: Partial<OnboardingData>) =>
        axiosInstance.put<{ data: OnboardingData }>("/onboarding/me", payload),
    complete: () => axiosInstance.post<{ data: OnboardingData }>("/onboarding/complete"),
    uploadAssets: (formData: FormData) =>
        axiosInstance.post<{ data: { uploaded: Record<string, string>; detail: OnboardingData } }>(
            "/onboarding/upload",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        ),
};
