import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User as UserIcon, ShieldCheck, CreditCard, Briefcase,
    Plus, RefreshCcw, Pencil,
    Save,
} from "lucide-react";
import { adminApi } from "@/api/admin.api";
import type { User, UpdateUserPayload, Credit, AccessLevel, AdminWorkspace } from "@/api/admin.api";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";

interface EditUserDialogProps {
    user: User | null;
    onClose: () => void;
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState("general");

    // ─── Queries ──────────────────────────────────────────────────────────────

    const { data: alData, isLoading: isLoadingAL, refetch: refetchAL } = useQuery({
        queryKey: ["admin-user-access", user?._id],
        queryFn: () => adminApi.getAccessLevel(user!._id).then(r => r.data),
        enabled: !!user,
    });

    const { data: creditsData, refetch: refetchCredits } = useQuery({
        queryKey: ["admin-user-credits", user?._id],
        queryFn: () => adminApi.listCredits(user!._id).then(r => r.data),
        enabled: !!user,
    });

    const { data: workspacesData, isLoading: isLoadingWs, refetch: refetchWs } = useQuery({
        queryKey: ["admin-user-workspaces", user?._id],
        queryFn: () => adminApi.getUserWorkspaces(user!._id).then(r => r.data),
        enabled: !!user,
    });

    // ─── Local Form States ─────────────────────────────────────────────────────

    const [generalForm, setGeneralForm] = useState<UpdateUserPayload>({
        name: "",
        email: "",
        phone: "",
        role: "user",
        status: "active",
    });

    const [alForm, setAlForm] = useState<Partial<AccessLevel>>({});

    // Sync forms when data arrives
    useEffect(() => {
        if (user) {
            setGeneralForm({
                name: user.name,
                email: user.email,
                phone: user.phone ?? "",
                role: user.role,
                status: user.status,
            });
        }
    }, [user]);

    useEffect(() => {
        if (alData?.data) {
            setAlForm(alData.data);
        }
    }, [alData]);

    // ─── Mutations ─────────────────────────────────────────────────────────────

    // 1. Update General Info
    const { mutate: updateGeneral, isPending: isUpdatingGeneral } = useMutation({
        mutationFn: () => adminApi.updateUser(user!._id, generalForm),
        onSuccess: () => {
            toast.success("General info updated");
            qc.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Update failed"),
    });

    // 2. Update Access Level
    const { mutate: updateAL, isPending: isUpdatingAL } = useMutation({
        mutationFn: () => adminApi.updateAccessLevel(user!._id, alForm as any),
        onSuccess: () => {
            toast.success("Access level updated");
            refetchAL();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Update failed"),
    });

    // 2.5 Admin Create Workspace
    const [createWsOpen, setCreateWsOpen] = useState(false);
    const [newWsForm, setNewWsForm] = useState({ name: "", type: "team" as any, description: "" });
    const { mutate: adminCreateWs, isPending: isCreatingWs } = useMutation({
        mutationFn: () => adminApi.createWorkspace(user!._id, newWsForm),
        onSuccess: () => {
            toast.success("Workspace created");
            setCreateWsOpen(false);
            setNewWsForm({ name: "", type: "team", description: "" });
            refetchWs();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create workspace"),
    });

    // 3. Add Credit
    const [creditForm, setCreditForm] = useState({ amount: 0, type: "assigned" as any, description: "", expiryDate: new Date().toISOString().split("T")[0], creditUsed: 0 });
    const { mutate: addCreditMut, isPending: isAddingCredit } = useMutation({
        mutationFn: () => adminApi.addCredit(user!._id, creditForm),
        onSuccess: () => {
            toast.success("Credits added");
            setCreditForm({ amount: 0, type: "assigned", description: "", expiryDate: new Date().toISOString().split("T")[0], creditUsed: 0 });
            refetchCredits();
            refetchAL(); // Balance might change
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to add credits"),
    });

    const credits = creditsData?.data?.data ?? [];

    if (!user) return null;

    return (
        <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Edit User: {user.name}
                    </DialogTitle>
                    <DialogDescription>
                        Manage profile, access levels, credits, and memberships.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6">
                        <TabsList className="bg-transparent border-none p-1 h-11 flex-wrap">
                            <TabsTrigger value="general" >
                                <UserIcon className="h-4 w-4 mr-2" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="access" >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Access Level
                            </TabsTrigger>
                            <TabsTrigger value="credits" >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Credits
                            </TabsTrigger>
                            <TabsTrigger value="workspaces" >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Workspaces
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 mt-2">
                        {/* ─── General Tab ────────────────────────────────────── */}
                        <TabsContent value="general" className="mt-0 space-y-6">
                            <FieldGroup>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Full Name</FieldLabel>
                                        <Input
                                            value={generalForm.name}
                                            onChange={(e) => setGeneralForm(f => ({ ...f, name: e.target.value }))}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>Phone</FieldLabel>
                                        <Input
                                            value={generalForm.phone}
                                            onChange={(e) => setGeneralForm(f => ({ ...f, phone: e.target.value }))}
                                        />
                                    </Field>
                                </div>
                                <Field>
                                    <FieldLabel>Email</FieldLabel>
                                    <Input
                                        value={generalForm.email}
                                        onChange={(e) => setGeneralForm(f => ({ ...f, email: e.target.value }))}
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel>Role</FieldLabel>
                                        <Select value={generalForm.role} onValueChange={v => setGeneralForm(f => ({ ...f, role: v as any }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field>
                                        <FieldLabel>Status</FieldLabel>
                                        <Select value={generalForm.status} onValueChange={v => setGeneralForm(f => ({ ...f, status: v as any }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                            </FieldGroup>
                            <div className="flex justify-end">
                                <Button onClick={() => updateGeneral()} disabled={isUpdatingGeneral}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isUpdatingGeneral ? "Saving..." : "Update Profile"}
                                </Button>
                            </div>
                        </TabsContent>

                        {/* ─── Access Level Tab ────────────────────────────────── */}
                        <TabsContent value="access" className="mt-0 space-y-6">
                            {isLoadingAL ? (
                                <div className="flex items-center justify-center py-10"><RefreshCcw className="animate-spin h-6 w-6" /></div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-6">
                                        <Field>
                                            <FieldLabel>Pricing Plan</FieldLabel>
                                            <Select value={alForm.plan} onValueChange={v => setAlForm(f => ({ ...f, plan: v as any }))}>
                                                <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="free">Free</SelectItem>
                                                    <SelectItem value="basic">Basic</SelectItem>
                                                    <SelectItem value="pro">Pro</SelectItem>
                                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                        <Field>
                                            <FieldLabel>Current Credits Balance</FieldLabel>
                                            <div className="h-10 border rounded-md flex items-center px-3 bg-muted/50 font-mono text-sm">
                                                {alForm.currentCredits ?? 0}
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">Create Workspaces</Label>
                                                <Switch
                                                    checked={alForm.canCreateWorkspace}
                                                    onCheckedChange={v => setAlForm(f => ({ ...f, canCreateWorkspace: v }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">Invite Team Members</Label>
                                                <Switch
                                                    checked={alForm.canInviteMembers}
                                                    onCheckedChange={v => setAlForm(f => ({ ...f, canInviteMembers: v }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">Export Data</Label>
                                                <Switch
                                                    checked={alForm.canExportData}
                                                    onCheckedChange={v => setAlForm(f => ({ ...f, canExportData: v }))}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">Access Analytics</Label>
                                                <Switch
                                                    checked={alForm.canAccessAnalytics}
                                                    onCheckedChange={v => setAlForm(f => ({ ...f, canAccessAnalytics: v }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Max Workspaces</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8"
                                                    value={alForm.maxWorkspaces}
                                                    onChange={e => setAlForm(f => ({ ...f, maxWorkspaces: parseInt(e.target.value) }))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Max Team Members</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8"
                                                    value={alForm.maxTeamMembers}
                                                    onChange={e => setAlForm(f => ({ ...f, maxTeamMembers: parseInt(e.target.value) }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button onClick={() => updateAL()} disabled={isUpdatingAL}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {isUpdatingAL ? "Saving..." : "Save Access Settings"}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* ─── Credits Tab ───────────────────────────────────── */}
                        <TabsContent value="credits" className="mt-0 space-y-6">
                            <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add / Deduct Credits
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-1">
                                        <Label className="mb-1 block text-xs font-medium text-foreground">Type</Label>
                                        <Select value={creditForm.type} onValueChange={v => setCreditForm(f => ({ ...f, type: v as any }))}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="assigned">Assign</SelectItem>
                                                <SelectItem value="used">Deduct</SelectItem>
                                                <SelectItem value="purchased">Purchase</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="mb-1 block text-xs font-medium text-foreground">Amount</Label>
                                        <Input
                                            type="number"
                                            className="h-9"
                                            value={creditForm.amount}
                                            onChange={e => setCreditForm(f => ({ ...f, amount: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-end gap-2">
                                        <div className="flex-1">
                                            <Label className="mb-1 block text-xs font-medium text-foreground">Description</Label>
                                            <Input
                                                placeholder="Reason..."
                                                className="h-9"
                                                value={creditForm.description}
                                                onChange={e => setCreditForm(f => ({ ...f, description: e.target.value }))}
                                            />
                                        </div>
                                        <Button size="sm" className="h-9" onClick={() => addCreditMut()} disabled={isAddingCredit || !creditForm.amount}>
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold">Credit History</h4>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchCredits()}>
                                        <RefreshCcw className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="h-8 text-[11px] font-bold">DATE</TableHead>
                                                <TableHead className="h-8 text-[11px] font-bold">TYPE</TableHead>
                                                <TableHead className="h-8 text-[11px] font-bold">AMOUNT</TableHead>
                                                <TableHead className="h-8 text-[11px] font-bold">DESCRIPTION</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {credits.length === 0 ? (
                                                <TableRow><TableCell colSpan={4} className="text-center text-xs py-10 text-muted-foreground">No credit history</TableCell></TableRow>
                                            ) : (
                                                credits.map((c: Credit) => (
                                                    <TableRow key={c._id} className="text-xs">
                                                        <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell className="capitalize">{c.type}</TableCell>
                                                        <TableCell className={c.type === "used" ? "text-destructive" : "text-emerald-500 font-medium"}>
                                                            {c.type === "used" ? "-" : "+"}{c.amount}
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate" title={c.description}>{c.description || "—"}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ─── Workspaces Tab ─────────────────────────────────── */}
                        <TabsContent value="workspaces" className="mt-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">User Workspaces</h4>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCreateWsOpen(true)}>
                                        <Plus className="h-3.5 w-3.5 mr-1" /> New
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchWs()}>
                                        <RefreshCcw className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                {isLoadingWs ? (
                                    <div className="flex items-center justify-center py-10"><RefreshCcw className="animate-spin h-6 w-6" /></div>
                                ) : (workspacesData?.data ?? []).length === 0 ? (
                                    <div className="py-20 text-center text-sm text-muted-foreground bg-muted/20 border-2 border-dashed rounded-lg">
                                        No workspaces found for this user.
                                    </div>
                                ) : (
                                    (workspacesData?.data ?? []).map((ws: AdminWorkspace) => {
                                        const myMembership = ws.members.find(m => m.user === user?._id);
                                        return (
                                            <div key={ws._id} className="group flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                                        <Briefcase className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{ws.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-[10px] capitalize px-1.5 h-4">
                                                                {ws.type}
                                                            </Badge>
                                                            <span className="text-[11px] text-muted-foreground">
                                                                Role: <span className="capitalize text-foreground font-medium">{myMembership?.role || "Member"}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                                        View
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive">
                                                        Remove User
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Admin Create Workspace Dialog */}
                <Dialog open={createWsOpen} onOpenChange={setCreateWsOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Create Workspace for User</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    placeholder="Workspace Name"
                                    value={newWsForm.name}
                                    onChange={(e) => setNewWsForm({ ...newWsForm, name: e.target.value })}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Type</FieldLabel>
                                <Select value={newWsForm.type} onValueChange={(v) => setNewWsForm({ ...newWsForm, type: v as any })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="personal">Personal</SelectItem>
                                        <SelectItem value="team">Team</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field>
                                <FieldLabel>Description</FieldLabel>
                                <Input
                                    placeholder="Optional description"
                                    value={newWsForm.description}
                                    onChange={(e) => setNewWsForm({ ...newWsForm, description: e.target.value })}
                                />
                            </Field>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateWsOpen(false)}>Cancel</Button>
                            <Button onClick={() => adminCreateWs()} disabled={isCreatingWs || !newWsForm.name.trim()}>
                                {isCreatingWs ? <RefreshCcw className="animate-spin h-4 w-4" /> : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                    <Button variant="outline" onClick={onClose} className="h-9">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
