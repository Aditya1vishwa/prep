import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { workspaceApi } from "@/api/workspace.api";
import { adminApi } from "@/api/admin.api";
import type { AccessLevel } from "@/api/admin.api";
import { authApi } from "@/api/auth.api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

const planColors: Record<string, "default" | "secondary" | "outline"> = {
    free: "secondary",
    basic: "outline",
    pro: "default",
    enterprise: "default",
};

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
    const user = useUserStore((s) => s.user);
    const UStore = useUserStore((s) => s.UStore);
    const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
    const dirty = form.name !== user?.name || form.phone !== (user?.phone ?? "");

    const { mutate, isPending } = useMutation({
        mutationFn: () => (authApi as any).updateMe(form),
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
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="p-name">Full Name</Label>
                        <Input
                            id="p-name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="p-phone">Phone</Label>
                        <Input
                            id="p-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        />
                    </div>
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
        queryFn: () => adminApi.getAccessLevel(user!._id),
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
                <TabsList className={`grid w-full max-w-lg ${isAdmin ? "grid-cols-2" : "grid-cols-4"}`}>
                    <TabsTrigger value="profile">
                        <User className="h-3.5 w-3.5 mr-1.5" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="password">
                        <Lock className="h-3.5 w-3.5 mr-1.5" /> Password
                    </TabsTrigger>
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
