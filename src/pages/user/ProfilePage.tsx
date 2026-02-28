import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { workspaceApi } from "@/api/workspace.api";
import type { AccessLevel } from "@/api/admin.api";
import { authApi } from "@/api/auth.api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    User, ShieldCheck, CreditCard, Briefcase, Lock, Star, UserPlus, Trash2, Plus,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import useUserStore from "@/store/userStore";
import usePageTitle from "@/hooks/use-page-title";
import { userApi } from "@/api/user.api";
import { onboardingApi } from "@/api/onboarding.api";
import type { EducationItem, ExperienceItem, OnboardingData, OnboardingRole, ProjectItem, RecruiterOpening } from "@/types/onboarding";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
const parseCSV = (value: string): string[] =>
    value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const planColors: Record<string, "default" | "secondary" | "outline"> = {
    free: "secondary",
    basic: "outline",
    pro: "default",
    enterprise: "default",
};

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
    const user = useUserStore((s) => s.user);
    const isAdmin = user?.role === "admin";
    const UStore = useUserStore((s) => s.UStore);
    const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
    const dirty = isAdmin
        ? form.name !== user?.name
        : form.name !== user?.name || form.phone !== (user?.phone ?? "");

    const { mutate, isPending } = useMutation({
        mutationFn: () => (authApi as any).updateMe(isAdmin ? { name: form.name } : form),
        onSuccess: (res: any) => {
            const updated = res?.data?.data;
            if (updated && user) {
                UStore("user", { ...user, ...updated });
            }
            toast.success("Profile updated");
        },
        onError: () => toast.error("Failed to update profile"),
    });

    if (!user) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar?.url} alt={user.name} />
                    <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    <div className="flex gap-2 mt-1.5">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" />{user.role}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-4">
                <div className={`grid gap-4 ${isAdmin ? "grid-cols-1" : "grid-cols-2"}`}>
                    <div className="space-y-1.5">
                        <Label htmlFor="p-name">Full Name</Label>
                        <Input
                            id="p-name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    {!isAdmin && (
                        <div className="space-y-1.5">
                            <Label htmlFor="p-phone">Phone</Label>
                            <Input
                                id="p-phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            />
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="bg-muted" />
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => mutate()} disabled={isPending || !dirty}>
                        {isPending ? "Saving…" : "Save Changes"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Change Password Tab ──────────────────────────────────────────────────────

function ChangePasswordTab() {
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

    const { mutate, isPending } = useMutation({
        mutationFn: () =>
            (authApi as any).changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            }),
        onSuccess: () => {
            toast.success("Password changed successfully");
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (err: any) =>
            toast.error(err?.response?.data?.message ?? "Failed to change password"),
    });

    const canSubmit =
        form.currentPassword &&
        form.newPassword.length >= 6 &&
        form.newPassword === form.confirmPassword;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Change Password
                </CardTitle>
                <CardDescription>Keep your account secure with a strong password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <Input
                        type="password"
                        value={form.currentPassword}
                        onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input
                        type="password"
                        placeholder="Min 6 characters"
                        value={form.newPassword}
                        onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    />
                    {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                        <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                    )}
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => mutate()} disabled={isPending || !canSubmit}>
                        {isPending ? "Updating…" : "Update Password"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Plan & Access Tab ────────────────────────────────────────────────────────

function PlanAccessTab() {
    const user = useUserStore((s) => s.user);
    const { data, isLoading } = useQuery({
        queryKey: ["my-access-level"],
        queryFn: () => userApi.getAccessLevel(),
        enabled: !!user,
    } as any);

    const al: AccessLevel | null = (data as any)?.data?.data ?? null;

    const accessFlags = al
        ? [
            { label: "Create Workspace", value: al.canCreateWorkspace },
            { label: "Invite Members", value: al.canInviteMembers },
            { label: "Export Data", value: al.canExportData },
            { label: "Analytics", value: al.canAccessAnalytics },
        ]
        : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="h-4 w-4" /> Plan & Access</CardTitle>
                <CardDescription>Your current subscription plan and feature access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : al ? (
                    <>
                        {/* Plan & Credits */}
                        <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                            <div className="text-center flex-1 border-r">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Plan</p>
                                <Badge variant={planColors[al.plan] ?? "outline"} className="text-sm capitalize px-3 py-1">{al.plan}</Badge>
                            </div>
                            <div className="text-center flex-1 border-r">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Credits</p>
                                <p className="text-2xl font-bold">{al.currentCredits}</p>
                            </div>
                            <div className="text-center flex-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Max Workspaces</p>
                                <p className="text-2xl font-bold">{al.maxWorkspaces}</p>
                            </div>
                        </div>

                        {/* Feature flags */}
                        <div>
                            <p className="text-sm font-medium mb-3">Feature Access</p>
                            <div className="grid grid-cols-2 gap-3">
                                {accessFlags.map((f) => (
                                    <div key={f.label} className="flex items-center justify-between rounded-lg border p-3">
                                        <span className="text-sm">{f.label}</span>
                                        <Badge variant={f.value ? "default" : "secondary"} className="text-xs">
                                            {f.value ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No access level data found.</p>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Onboarding Details Tab ──────────────────────────────────────────────────

function OnboardingDetailsTab() {
    const emptyEducation = (): EducationItem => ({
        level: "undergraduate",
        degree: "",
        fieldOfStudy: "",
        institution: "",
        grade: "",
        currentlyStudying: false,
    });
    const emptyExperience = (): ExperienceItem => ({
        jobTitle: "",
        company: "",
        employmentType: "full_time",
        location: "",
        currentlyWorking: false,
        description: "",
        skillsUsed: [],
    });
    const emptyProject = (): ProjectItem => ({
        title: "",
        description: "",
        technologies: [],
        projectUrl: "",
        githubUrl: "",
    });
    const emptyOpening = (): RecruiterOpening => ({
        title: "",
        department: "",
        employmentType: "full_time",
        locationType: "onsite",
        locations: [],
        skillsRequired: [],
        minExperienceYears: 0,
        maxExperienceYears: 0,
        salaryRange: { currency: "INR", min: 0, max: 0 },
        isHiring: true,
    });

    const [form, setForm] = useState<Partial<OnboardingData>>({
        role: "student",
        basicInfo: {},
        professionalInfo: {},
        education: [emptyEducation()],
        experience: [emptyExperience()],
        projects: [emptyProject()],
        achievements: [{ title: "", description: "" }],
        recruiterInfo: { openings: [emptyOpening()] },
        preferences: {},
        socialLinks: {},
        documents: {},
        privacySettings: { profileVisibility: "public", showPhone: false, showEmail: false },
    });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["onboarding-profile"],
        queryFn: () => onboardingApi.getMe(),
    });

    useEffect(() => {
        const details = data?.data?.data;
        if (details) {
            setForm({
                role: details.role ?? "student",
                basicInfo: details.basicInfo ?? {},
                professionalInfo: details.professionalInfo ?? {},
                education: details.education?.length ? details.education : [emptyEducation()],
                experience: details.experience?.length ? details.experience : [emptyExperience()],
                projects: details.projects?.length ? details.projects : [emptyProject()],
                achievements: details.achievements?.length ? details.achievements : [{ title: "", description: "" }],
                recruiterInfo: {
                    ...details.recruiterInfo,
                    openings: details.recruiterInfo?.openings?.length ? details.recruiterInfo.openings : [emptyOpening()],
                },
                preferences: details.preferences ?? {},
                socialLinks: details.socialLinks ?? {},
                documents: details.documents ?? {},
                privacySettings: details.privacySettings ?? {
                    profileVisibility: "public",
                    showPhone: false,
                    showEmail: false,
                },
            });
        }
    }, [data]);

    const completion = data?.data?.data?.meta?.profileCompletion ?? 0;
    const isCompleted = Boolean(data?.data?.data?.meta?.onboardingCompleted);

    const { mutate, isPending } = useMutation({
        mutationFn: () =>
            onboardingApi.updateMe({
                role: form.role,
                basicInfo: form.basicInfo,
                professionalInfo: form.professionalInfo,
                education: form.education,
                experience: form.experience,
                projects: form.projects,
                achievements: form.achievements,
                recruiterInfo: form.recruiterInfo,
                preferences: form.preferences,
                socialLinks: form.socialLinks,
                documents: form.documents,
                privacySettings: form.privacySettings,
            }),
        onSuccess: async () => {
            await refetch();
            toast.success("Onboarding details updated");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? "Failed to update onboarding details");
        },
    });

    const updateEducation = (index: number, key: keyof EducationItem, value: string | boolean) => {
        setForm((prev) => ({
            ...prev,
            education: (prev.education ?? []).map((item, idx) =>
                idx === index ? { ...item, [key]: value } : item
            ),
        }));
    };
    const updateExperience = (index: number, key: keyof ExperienceItem, value: string | boolean | string[]) => {
        setForm((prev) => ({
            ...prev,
            experience: (prev.experience ?? []).map((item, idx) =>
                idx === index ? { ...item, [key]: value } : item
            ),
        }));
    };
    const updateProject = (index: number, key: keyof ProjectItem, value: string | string[]) => {
        setForm((prev) => ({
            ...prev,
            projects: (prev.projects ?? []).map((item, idx) =>
                idx === index ? { ...item, [key]: value } : item
            ),
        }));
    };
    const updateOpening = (index: number, patch: Partial<RecruiterOpening>) => {
        setForm((prev) => ({
            ...prev,
            recruiterInfo: {
                ...prev.recruiterInfo,
                openings: (prev.recruiterInfo?.openings ?? []).map((item, idx) =>
                    idx === index ? { ...item, ...patch } : item
                ),
            },
        }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Career Profile
                </CardTitle>
                <CardDescription>
                    Complete and manage your onboarding details shown in your public profile.
                </CardDescription>
                <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline">Completion: {completion}%</Badge>
                    <Badge variant={isCompleted ? "default" : "secondary"}>
                        {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Profile Role</Label>
                                <Select
                                    value={form.role ?? "student"}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            role: value as OnboardingRole,
                                            professionalInfo: prev.professionalInfo ?? {},
                                            education: prev.education?.length ? prev.education : [emptyEducation()],
                                            experience: prev.experience?.length ? prev.experience : [emptyExperience()],
                                            projects: prev.projects?.length ? prev.projects : [emptyProject()],
                                            recruiterInfo: {
                                                ...prev.recruiterInfo,
                                                openings: prev.recruiterInfo?.openings?.length ? prev.recruiterInfo.openings : [emptyOpening()],
                                            },
                                        }))
                                    }
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                                        <SelectItem value="recruiter">Recruiter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Phone</Label>
                                <Input
                                    value={form.basicInfo?.phone ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            basicInfo: { ...prev.basicInfo, phone: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Country</Label>
                                <Input
                                    value={form.basicInfo?.location?.country ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            basicInfo: {
                                                ...prev.basicInfo,
                                                location: { ...prev.basicInfo?.location, country: e.target.value },
                                            },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>City</Label>
                                <Input
                                    value={form.basicInfo?.location?.city ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            basicInfo: {
                                                ...prev.basicInfo,
                                                location: { ...prev.basicInfo?.location, city: e.target.value },
                                            },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nationality</Label>
                                <Input
                                    value={form.basicInfo?.nationality ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            basicInfo: { ...prev.basicInfo, nationality: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Preferred Locations</Label>
                                <Input
                                    value={(form.preferences?.preferredLocations ?? []).join(", ")}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            preferences: { ...prev.preferences, preferredLocations: parseCSV(e.target.value) },
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        {form.role !== "recruiter" && (
                            <>
                                <div className="space-y-1.5">
                                    <Label>Headline</Label>
                                    <Input
                                        value={form.professionalInfo?.headline ?? ""}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                professionalInfo: { ...prev.professionalInfo, headline: e.target.value },
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Bio</Label>
                                    <Textarea
                                        value={form.professionalInfo?.bio ?? ""}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                professionalInfo: { ...prev.professionalInfo, bio: e.target.value },
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Total Experience Years</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.professionalInfo?.totalExperienceYears ?? 0}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    professionalInfo: {
                                                        ...prev.professionalInfo,
                                                        totalExperienceYears: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Notice Period (Days)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.professionalInfo?.noticePeriodDays ?? 0}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    professionalInfo: {
                                                        ...prev.professionalInfo,
                                                        noticePeriodDays: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>CTC Currency</Label>
                                        <Input
                                            value={form.professionalInfo?.currentCTC?.currency ?? "INR"}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    professionalInfo: {
                                                        ...prev.professionalInfo,
                                                        currentCTC: {
                                                            ...prev.professionalInfo?.currentCTC,
                                                            currency: e.target.value,
                                                        },
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>CTC Amount</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.professionalInfo?.currentCTC?.amount ?? 0}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    professionalInfo: {
                                                        ...prev.professionalInfo,
                                                        currentCTC: {
                                                            ...prev.professionalInfo?.currentCTC,
                                                            amount: Number(e.target.value),
                                                        },
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Job Type Preferences</Label>
                                        <Input
                                            value={(form.preferences?.jobType ?? []).join(", ")}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    preferences: { ...prev.preferences, jobType: parseCSV(e.target.value) },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Employment Type Preferences</Label>
                                        <Input
                                            value={(form.preferences?.employmentType ?? []).join(", ")}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    preferences: { ...prev.preferences, employmentType: parseCSV(e.target.value) },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Target Roles</Label>
                                        <Input
                                            value={(form.preferences?.targetRoles ?? []).join(", ")}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    preferences: { ...prev.preferences, targetRoles: parseCSV(e.target.value) },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Shift Preference</Label>
                                        <Select
                                            value={form.preferences?.shiftPreference ?? "flexible"}
                                            onValueChange={(value) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    preferences: {
                                                        ...prev.preferences,
                                                        shiftPreference: value as "day" | "night" | "flexible",
                                                    },
                                                }))
                                            }
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="day">Day</SelectItem>
                                                <SelectItem value="night">Night</SelectItem>
                                                <SelectItem value="flexible">Flexible</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Expected Salary Currency</Label>
                                        <Input
                                            value={form.preferences?.expectedSalary?.currency ?? "INR"}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    preferences: {
                                                        ...prev.preferences,
                                                        expectedSalary: {
                                                            ...prev.preferences?.expectedSalary,
                                                            currency: e.target.value,
                                                        },
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Expected Salary Min</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.preferences?.expectedSalary?.min ?? 0}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    preferences: {
                                                        ...prev.preferences,
                                                        expectedSalary: {
                                                            ...prev.preferences?.expectedSalary,
                                                            min: Number(e.target.value),
                                                        },
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Expected Salary Max</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.preferences?.expectedSalary?.max ?? 0}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    preferences: {
                                                        ...prev.preferences,
                                                        expectedSalary: {
                                                            ...prev.preferences?.expectedSalary,
                                                            max: Number(e.target.value),
                                                        },
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between rounded border px-3 py-2">
                                        <Label>Open to Work</Label>
                                        <Select
                                            value={form.professionalInfo?.openToWork ? "yes" : "no"}
                                            onValueChange={(value) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    professionalInfo: { ...prev.professionalInfo, openToWork: value === "yes" },
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between rounded border px-3 py-2">
                                        <Label>Open to Relocation</Label>
                                        <Select
                                            value={form.professionalInfo?.openToRelocation ? "yes" : "no"}
                                            onValueChange={(value) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    professionalInfo: { ...prev.professionalInfo, openToRelocation: value === "yes" },
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}
                        {form.role === "recruiter" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Company Name</Label>
                                    <Input
                                        value={form.recruiterInfo?.companyName ?? ""}
                                        onChange={(e) => setForm((prev) => ({ ...prev, recruiterInfo: { ...prev.recruiterInfo, companyName: e.target.value } }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Industry</Label>
                                    <Input
                                        value={form.recruiterInfo?.industry ?? ""}
                                        onChange={(e) => setForm((prev) => ({ ...prev, recruiterInfo: { ...prev.recruiterInfo, industry: e.target.value } }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Company Website</Label>
                                    <Input
                                        value={form.recruiterInfo?.companyWebsite ?? ""}
                                        onChange={(e) => setForm((prev) => ({ ...prev, recruiterInfo: { ...prev.recruiterInfo, companyWebsite: e.target.value } }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Designation</Label>
                                    <Input
                                        value={form.recruiterInfo?.designation ?? ""}
                                        onChange={(e) => setForm((prev) => ({ ...prev, recruiterInfo: { ...prev.recruiterInfo, designation: e.target.value } }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Company Location</Label>
                                    <Input
                                        value={form.recruiterInfo?.companyLocation ?? ""}
                                        onChange={(e) => setForm((prev) => ({ ...prev, recruiterInfo: { ...prev.recruiterInfo, companyLocation: e.target.value } }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Company Size</Label>
                                    <Select
                                        value={form.recruiterInfo?.companySize ?? "1-10"}
                                        onValueChange={(value) =>
                                            setForm((prev) => ({ ...prev, recruiterInfo: { ...prev.recruiterInfo, companySize: value as any } }))
                                        }
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-10">1-10</SelectItem>
                                            <SelectItem value="11-50">11-50</SelectItem>
                                            <SelectItem value="51-200">51-200</SelectItem>
                                            <SelectItem value="201-500">201-500</SelectItem>
                                            <SelectItem value="500+">500+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Education (Multiple)</Label>
                            {(form.education ?? []).map((edu, idx) => (
                                <div key={idx} className="grid grid-cols-2 gap-3 rounded-md border p-3">
                                    <Select value={edu.level ?? "undergraduate"} onValueChange={(value) => updateEducation(idx, "level", value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="school">School</SelectItem>
                                            <SelectItem value="high_school">High School</SelectItem>
                                            <SelectItem value="undergraduate">Undergraduate</SelectItem>
                                            <SelectItem value="postgraduate">Postgraduate</SelectItem>
                                            <SelectItem value="diploma">Diploma</SelectItem>
                                            <SelectItem value="certification">Certification</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input placeholder="Class Level (9th, 10th, 12th)" value={edu.classLevel ?? ""} onChange={(e) => updateEducation(idx, "classLevel", e.target.value)} />
                                    <Input placeholder="Board" value={edu.board ?? ""} onChange={(e) => updateEducation(idx, "board", e.target.value)} />
                                    <Input placeholder="Degree/Class" value={edu.degree ?? ""} onChange={(e) => updateEducation(idx, "degree", e.target.value)} />
                                    <Input placeholder="Field of Study" value={edu.fieldOfStudy ?? ""} onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)} />
                                    <Input placeholder="Institution" value={edu.institution ?? ""} onChange={(e) => updateEducation(idx, "institution", e.target.value)} />
                                    <Input placeholder="Grade/CGPA/%" value={edu.grade ?? ""} onChange={(e) => updateEducation(idx, "grade", e.target.value)} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="date" value={edu.startDate ? String(edu.startDate).slice(0, 10) : ""} onChange={(e) => updateEducation(idx, "startDate", e.target.value)} />
                                        <Input type="date" value={edu.endDate ? String(edu.endDate).slice(0, 10) : ""} onChange={(e) => updateEducation(idx, "endDate", e.target.value)} />
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between rounded border px-3 py-2">
                                        <Label>Currently Studying</Label>
                                        <Select
                                            value={edu.currentlyStudying ? "yes" : "no"}
                                            onValueChange={(value) => updateEducation(idx, "currentlyStudying", value === "yes")}
                                        >
                                            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Textarea
                                        className="col-span-2"
                                        placeholder="Education description"
                                        value={edu.description ?? ""}
                                        onChange={(e) => updateEducation(idx, "description", e.target.value)}
                                    />
                                    <div className="col-span-2 flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setForm((prev) => ({ ...prev, education: (prev.education ?? []).filter((_, i) => i !== idx) }))}
                                            disabled={(form.education ?? []).length === 1}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, education: [...(prev.education ?? []), emptyEducation()] }))}>
                                Add Education
                            </Button>
                        </div>

                        {form.role !== "student" && form.role !== "recruiter" && (
                            <div className="space-y-2">
                                <Label>Experience (Multiple)</Label>
                                {(form.experience ?? []).map((exp, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-3 rounded-md border p-3">
                                        <Input placeholder="Job Title" value={exp.jobTitle ?? ""} onChange={(e) => updateExperience(idx, "jobTitle", e.target.value)} />
                                        <Input placeholder="Company" value={exp.company ?? ""} onChange={(e) => updateExperience(idx, "company", e.target.value)} />
                                        <Input
                                            className="col-span-2"
                                            placeholder="Skills Used (comma separated)"
                                            value={(exp.skillsUsed ?? []).join(", ")}
                                            onChange={(e) => updateExperience(idx, "skillsUsed", parseCSV(e.target.value))}
                                        />
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, experience: [...(prev.experience ?? []), emptyExperience()] }))}>
                                    Add Experience
                                </Button>
                            </div>
                        )}

                        {form.role !== "recruiter" && (
                            <div className="space-y-2">
                                <Label>Projects (Multiple)</Label>
                                {(form.projects ?? []).map((project, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-3 rounded-md border p-3">
                                        <Input placeholder="Project title" value={project.title ?? ""} onChange={(e) => updateProject(idx, "title", e.target.value)} />
                                        <Input
                                            placeholder="Tech stack (comma separated)"
                                            value={(project.technologies ?? []).join(", ")}
                                            onChange={(e) => updateProject(idx, "technologies", parseCSV(e.target.value))}
                                        />
                                        <Textarea className="col-span-2" placeholder="Description" value={project.description ?? ""} onChange={(e) => updateProject(idx, "description", e.target.value)} />
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, projects: [...(prev.projects ?? []), emptyProject()] }))}>
                                    Add Project
                                </Button>
                            </div>
                        )}

                        {form.role !== "recruiter" && (
                            <div className="space-y-2">
                                <Label>Achievements (Multiple)</Label>
                                {(form.achievements ?? []).map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-3 rounded-md border p-3">
                                        <Input
                                            placeholder="Achievement title"
                                            value={item.title ?? ""}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    achievements: (prev.achievements ?? []).map((a, i) =>
                                                        i === idx ? { ...a, title: e.target.value } : a
                                                    ),
                                                }))
                                            }
                                        />
                                        <Input
                                            placeholder="Date"
                                            type="date"
                                            value={item.date ? String(item.date).slice(0, 10) : ""}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    achievements: (prev.achievements ?? []).map((a, i) =>
                                                        i === idx ? { ...a, date: e.target.value } : a
                                                    ),
                                                }))
                                            }
                                        />
                                        <Textarea
                                            className="col-span-2"
                                            placeholder="Achievement description"
                                            value={item.description ?? ""}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    achievements: (prev.achievements ?? []).map((a, i) =>
                                                        i === idx ? { ...a, description: e.target.value } : a
                                                    ),
                                                }))
                                            }
                                        />
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setForm((prev) => ({
                                            ...prev,
                                            achievements: [...(prev.achievements ?? []), { title: "", description: "" }],
                                        }))
                                    }
                                >
                                    Add Achievement
                                </Button>
                            </div>
                        )}

                        {form.role === "recruiter" && (
                            <div className="space-y-2">
                                <Label>Openings (Multiple)</Label>
                                {(form.recruiterInfo?.openings ?? []).map((opening, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-3 rounded-md border p-3">
                                        <Input placeholder="Opening Title" value={opening.title ?? ""} onChange={(e) => updateOpening(idx, { title: e.target.value })} />
                                        <Input placeholder="Department" value={opening.department ?? ""} onChange={(e) => updateOpening(idx, { department: e.target.value })} />
                                        <Select
                                            value={opening.employmentType ?? "full_time"}
                                            onValueChange={(value) => updateOpening(idx, { employmentType: value as RecruiterOpening["employmentType"] })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full_time">Full Time</SelectItem>
                                                <SelectItem value="part_time">Part Time</SelectItem>
                                                <SelectItem value="internship">Internship</SelectItem>
                                                <SelectItem value="freelance">Freelance</SelectItem>
                                                <SelectItem value="contract">Contract</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={opening.locationType ?? "onsite"}
                                            onValueChange={(value) => updateOpening(idx, { locationType: value as RecruiterOpening["locationType"] })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="onsite">Onsite</SelectItem>
                                                <SelectItem value="remote">Remote</SelectItem>
                                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="Locations (comma separated)"
                                            value={(opening.locations ?? []).join(", ")}
                                            onChange={(e) => updateOpening(idx, { locations: parseCSV(e.target.value) })}
                                        />
                                        <Input
                                            placeholder="Min Experience (years)"
                                            type="number"
                                            min={0}
                                            value={opening.minExperienceYears ?? 0}
                                            onChange={(e) => updateOpening(idx, { minExperienceYears: Number(e.target.value) })}
                                        />
                                        <Input
                                            placeholder="Max Experience (years)"
                                            type="number"
                                            min={0}
                                            value={opening.maxExperienceYears ?? 0}
                                            onChange={(e) => updateOpening(idx, { maxExperienceYears: Number(e.target.value) })}
                                        />
                                        <Input
                                            className="col-span-2"
                                            placeholder="Skills required (comma separated)"
                                            value={(opening.skillsRequired ?? []).join(", ")}
                                            onChange={(e) => updateOpening(idx, { skillsRequired: parseCSV(e.target.value) })}
                                        />
                                        <Input
                                            placeholder="Salary Currency"
                                            value={opening.salaryRange?.currency ?? "INR"}
                                            onChange={(e) =>
                                                updateOpening(idx, {
                                                    salaryRange: { ...opening.salaryRange, currency: e.target.value },
                                                })
                                            }
                                        />
                                        <Input
                                            placeholder="Salary Min"
                                            type="number"
                                            min={0}
                                            value={opening.salaryRange?.min ?? 0}
                                            onChange={(e) =>
                                                updateOpening(idx, {
                                                    salaryRange: { ...opening.salaryRange, min: Number(e.target.value) },
                                                })
                                            }
                                        />
                                        <Input
                                            placeholder="Salary Max"
                                            type="number"
                                            min={0}
                                            value={opening.salaryRange?.max ?? 0}
                                            onChange={(e) =>
                                                updateOpening(idx, {
                                                    salaryRange: { ...opening.salaryRange, max: Number(e.target.value) },
                                                })
                                            }
                                        />
                                        <Input
                                            placeholder="Application Deadline"
                                            type="date"
                                            value={opening.applicationDeadline ? String(opening.applicationDeadline).slice(0, 10) : ""}
                                            onChange={(e) => updateOpening(idx, { applicationDeadline: e.target.value })}
                                        />
                                        <Textarea
                                            className="col-span-2"
                                            placeholder="Opening description"
                                            value={opening.description ?? ""}
                                            onChange={(e) => updateOpening(idx, { description: e.target.value })}
                                        />
                                        <div className="col-span-2 flex items-center justify-between rounded border p-2">
                                            <Label>Is Hiring</Label>
                                            <Select
                                                value={opening.isHiring === false ? "no" : "yes"}
                                                onValueChange={(value) => updateOpening(idx, { isHiring: value === "yes" })}
                                            >
                                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yes">Yes</SelectItem>
                                                    <SelectItem value="no">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setForm((prev) => ({
                                            ...prev,
                                            recruiterInfo: {
                                                ...prev.recruiterInfo,
                                                openings: [...(prev.recruiterInfo?.openings ?? []), emptyOpening()],
                                            },
                                        }))
                                    }
                                >
                                    Add Opening
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>LinkedIn</Label>
                                <Input
                                    value={form.socialLinks?.linkedin ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, linkedin: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>GitHub</Label>
                                <Input
                                    value={form.socialLinks?.github ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, github: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>LeetCode</Label>
                                <Input
                                    value={form.socialLinks?.leetcode ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, leetcode: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Twitter</Label>
                                <Input
                                    value={form.socialLinks?.twitter ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Portfolio URL</Label>
                                <Input
                                    value={form.documents?.portfolioUrl ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            documents: { ...prev.documents, portfolioUrl: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Resume URL</Label>
                                <Input
                                    value={form.documents?.resumeUrl ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            documents: { ...prev.documents, resumeUrl: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Video Resume URL</Label>
                                <Input
                                    value={form.documents?.videoResumeUrl ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            documents: { ...prev.documents, videoResumeUrl: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Profile Visibility</Label>
                                <Select
                                    value={form.privacySettings?.profileVisibility ?? "public"}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            privacySettings: {
                                                ...prev.privacySettings,
                                                profileVisibility: value as "public" | "private" | "connections_only",
                                            },
                                        }))
                                    }
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="connections_only">Connections only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => mutate()} disabled={isPending}>
                                {isPending ? "Saving…" : "Save Career Details"}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Workspaces Tab ───────────────────────────────────────────────────────────

function WorkspacesTab() {
    const user = useUserStore((s) => s.user);
    const workspaces = useUserStore((s) => s.workspaces);
    const UStore = useUserStore((s) => s.UStore);
    const [addMemberWs, setAddMemberWs] = useState<string | null>(null);
    const [addMemberEmail, setAddMemberEmail] = useState("");
    const [addMemberRole, setAddMemberRole] = useState("member");
    const [createWsOpen, setCreateWsOpen] = useState(false);
    const [newWsForm, setNewWsForm] = useState({ name: "", type: "personal" as any, description: "" });
    const refreshMe = async () => {
        const me = await authApi.me();
        const payload = me.data.data;
        await Promise.all([
            UStore("user", payload.user),
            UStore("workspaces", payload.workspaces ?? []),
        ]);
    };

    const { mutate: addMut, isPending: addPend } = useMutation({
        mutationFn: () => workspaceApi.addMember(addMemberWs!, addMemberEmail, addMemberRole),
        onSuccess: async () => {
            await refreshMe();
            toast.success("Member added");
            setAddMemberWs(null);
            setAddMemberEmail("");
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to add member"),
    });

    const { mutate: createWsMut, isPending: creatingWs } = useMutation({
        mutationFn: () => workspaceApi.createWorkspace(newWsForm),
        onSuccess: async () => {
            await refreshMe();
            toast.success("Workspace created");
            setCreateWsOpen(false);
            setNewWsForm({ name: "", type: "personal", description: "" });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create workspace"),
    });

    const { mutate: removeMut } = useMutation({
        mutationFn: ({ wsId, memberId }: { wsId: string; memberId: string }) =>
            workspaceApi.removeMember(wsId, memberId),
        onSuccess: async () => {
            await refreshMe();
            toast.success("Member removed");
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to remove member"),
    });

    const { mutate: updateStatusMut } = useMutation({
        mutationFn: ({ wsId, memberId, status }: { wsId: string; memberId: string; status: "active" | "inactive" }) =>
            workspaceApi.updateMemberStatus(wsId, memberId, status),
        onSuccess: async (_, variables) => {
            await refreshMe();
            toast.success(`Member marked as ${variables.status}`);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update status"),
    });

    const getMemberUserId = (memberUser: any) => {
        if (!memberUser) return "";
        return typeof memberUser === "string" ? memberUser : memberUser?._id ?? "";
    };

    const getMyWorkspaceRole = (ws: any): string => {
        const myId = user?._id;
        if (!myId) return "";
        if (String(ws.userId) === String(myId)) return "owner";
        const member = (ws.members ?? []).find((m: any) => String(getMemberUserId(m.user)) === String(myId));
        return member?.role ?? "";
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> My Workspaces</CardTitle>
                    <CardDescription>Manage your workspaces and their members.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setCreateWsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Workspace
                </Button>
            </CardHeader>
            <CardContent>
                {workspaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No workspaces found.</p>
                ) : (
                    <div className="space-y-5">
                        {workspaces.map((ws: any) => {
                            const myRole = getMyWorkspaceRole(ws);
                            const canManageWorkspace = ["owner", "admin"].includes(myRole);

                            return (
                                <div key={ws._id} className="rounded-lg border overflow-hidden">
                                    <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-muted/30">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{ws.name}</p>
                                            <p className="text-xs text-muted-foreground">{ws.slug}</p>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] capitalize">{myRole || "member"}</Badge>
                                        <Badge variant="outline" className="text-[10px] capitalize">{ws.type}</Badge>
                                        <Badge variant={ws.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{ws.status}</Badge>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-1.5"
                                            disabled={!canManageWorkspace}
                                            onClick={() => setAddMemberWs(ws._id)}
                                        >
                                            <UserPlus className="h-3.5 w-3.5" /> Add Member
                                        </Button>
                                    </div>
                                    {!canManageWorkspace && (
                                        <p className="px-4 py-2 text-xs text-muted-foreground border-b">
                                            You have read/member access in this workspace, so editing is disabled.
                                        </p>
                                    )}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Joined</TableHead>
                                                <TableHead className="w-16" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ws.members.map((m: any) => (
                                                <TableRow key={m.user?._id || m.user}>
                                                    <TableCell className="text-xs truncate max-w-[180px]">
                                                        <p className="font-medium">{m.user?.name || "Member"}</p>
                                                        <p className="text-muted-foreground text-[10px]">{m.user?.email || m.user}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] capitalize">{m.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{m.status || "active"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(m.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            {m.role !== "owner" && (
                                                                <>
                                                                    <Select
                                                                        value={m.status || "active"}
                                                                        disabled={!canManageWorkspace}
                                                                        onValueChange={(v) => updateStatusMut({ wsId: ws._id, memberId: m.user?._id || m.user, status: v as any })}
                                                                    >
                                                                        <SelectTrigger className="h-7 w-[80px] text-[10px]">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="active" className="text-[10px]">Active</SelectItem>
                                                                            <SelectItem value="inactive" className="text-[10px]">Inactive</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button
                                                                        size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                                                        disabled={!canManageWorkspace}
                                                                        onClick={() => removeMut({ wsId: ws._id, memberId: m.user?._id || m.user })}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* Add member dialog */}
            <Dialog open={!!addMemberWs} onOpenChange={(o) => !o && setAddMemberWs(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add Member</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input
                                placeholder="Enter member email"
                                type="email"
                                value={addMemberEmail}
                                onChange={(e) => setAddMemberEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Role</Label>
                            <Select value={addMemberRole} onValueChange={setAddMemberRole}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddMemberWs(null)}>Cancel</Button>
                        <Button onClick={() => addMut()} disabled={addPend || !addMemberEmail.trim()}>
                            {addPend ? "Adding…" : "Add Member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Create workspace dialog */}
            <Dialog open={createWsOpen} onOpenChange={setCreateWsOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Create Workspace</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Name</Label>
                            <Input
                                placeholder="Workspace Name"
                                value={newWsForm.name}
                                onChange={(e) => setNewWsForm({ ...newWsForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={newWsForm.type} onValueChange={(v) => setNewWsForm({ ...newWsForm, type: v as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="personal">Personal</SelectItem>
                                    <SelectItem value="team">Team</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Input
                                placeholder="Optional description"
                                value={newWsForm.description}
                                onChange={(e) => setNewWsForm({ ...newWsForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateWsOpen(false)}>Cancel</Button>
                        <Button onClick={() => createWsMut()} disabled={creatingWs || !newWsForm.name.trim()}>
                            {creatingWs ? "Creating…" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const user = useUserStore((s) => s.user);
    const isAdmin = user?.role === "admin";
    usePageTitle("Profile");
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get("tab");

    // Map URL params to tab values
    const urlToTab: Record<string, string> = isAdmin
        ? {
            personal: "profile",
            password: "password",
        }
        : {
            personal: "profile",
            onboarding: "onboarding",
            plans: "plan",
            workspaces: "workspaces",
            password: "password",
        };

    const tabToUrl: Record<string, string> = isAdmin
        ? {
            profile: "personal",
            password: "password",
        }
        : {
            profile: "personal",
            onboarding: "onboarding",
            plan: "plans",
            workspaces: "workspaces",
            password: "password",
        };

    const initialTab = tabParam && urlToTab[tabParam] ? urlToTab[tabParam] : "profile";
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync state from URL
    useEffect(() => {
        if (tabParam && urlToTab[tabParam]) {
            setActiveTab(urlToTab[tabParam]);
        }
    }, [tabParam]);

    // Update URL when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const newParam = tabToUrl[value];
        if (newParam) {
            navigate(`/profile?tab=${newParam}`, { replace: true });
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {isAdmin
                        ? "Manage your account details and security settings."
                        : "Manage your account, security, plan and workspaces."}
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className={`grid w-full ${isAdmin ? "max-w-lg grid-cols-2" : "max-w-3xl grid-cols-5"}`}>
                    <TabsTrigger value="profile">
                        <User className="h-3.5 w-3.5 mr-1.5" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="password">
                        <Lock className="h-3.5 w-3.5 mr-1.5" /> Password
                    </TabsTrigger>
                    {!isAdmin && (
                        <TabsTrigger value="onboarding">
                            <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Career
                        </TabsTrigger>
                    )}
                    {!isAdmin && (
                        <TabsTrigger value="plan">
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Plan
                        </TabsTrigger>
                    )}
                    {!isAdmin && (
                        <TabsTrigger value="workspaces">
                            <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Workspaces
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" >
                    <ProfileTab />
                </TabsContent>
                <TabsContent value="password" >
                    <ChangePasswordTab />
                </TabsContent>
                {!isAdmin && (
                    <TabsContent value="onboarding" >
                        <OnboardingDetailsTab />
                    </TabsContent>
                )}
                {!isAdmin && (
                    <TabsContent value="plan" >
                        <PlanAccessTab />
                    </TabsContent>
                )}
                {!isAdmin && (
                    <TabsContent value="workspaces" >
                        <WorkspacesTab />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
