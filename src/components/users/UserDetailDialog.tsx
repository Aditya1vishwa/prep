import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// import type { ColumnDef } from "@tanstack/react-table";
import { adminApi } from "@/api/admin.api";
import type { User, Credit, AccessLevel, AdminWorkspace } from "@/api/admin.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Plus, Check, X, CreditCard, Briefcase, ShieldCheck, Users } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

const creditTypeColor: Record<string, string> = {
    assigned: "text-blue-500",
    purchased: "text-green-500",
    used: "text-red-500",
};

// ─── Credits Tab ──────────────────────────────────────────────────────────────

function CreditsTab({ userId }: { userId: string }) {
    const qc = useQueryClient();
    const [addForm, setAddForm] = useState<any>({ amount: 0, type: "assigned", description: "" });
    const [editId, setEditId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ amount: number; description: string }>({ amount: 0, description: "" });
    const [showAdd, setShowAdd] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-credits", userId],
        queryFn: () => adminApi.listCredits(userId),
        enabled: !!userId,
    });

    const credits: Credit[] = (data as any)?.data?.data?.data ?? [];

    const { mutate: addMut, isPending: addPend } = useMutation({
        mutationFn: () => adminApi.addCredit(userId, addForm),
        onSuccess: () => {
            toast.success("Credit added");
            qc.invalidateQueries({ queryKey: ["admin-credits", userId] });
            setAddForm({ amount: 0, type: "assigned", description: "" });
            setShowAdd(false);
        },
        onError: () => toast.error("Failed to add credit"),
    });

    const { mutate: updateMut, isPending: updatePend } = useMutation({
        mutationFn: () => adminApi.updateCredit(editId!, { amount: editForm.amount, description: editForm.description }),
        onSuccess: () => {
            toast.success("Credit updated");
            qc.invalidateQueries({ queryKey: ["admin-credits", userId] });
            setEditId(null);
        },
        onError: () => toast.error("Failed to update credit"),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{credits.length} records</p>
                <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Credit
                </Button>
            </div>

            {/* Add credit inline form */}
            {showAdd && (
                <div className="border rounded-lg p-4 bg-muted/30 grid grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                        <Label className="text-xs">Amount</Label>
                        <Input
                            type="number"
                            value={addForm.amount}
                            onChange={(e) => setAddForm((f: any) => ({ ...f, amount: Number(e.target.value) }))}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={addForm.type} onValueChange={(v) => setAddForm((f: any) => ({ ...f, type: v as any }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="purchased">Purchased</SelectItem>
                                <SelectItem value="used">Used</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                            placeholder="Optional note"
                            value={addForm.description}
                            onChange={(e) => setAddForm((f: any) => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <div className="col-span-3 flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => addMut()} disabled={addPend || !addForm.amount}>
                            {addPend ? "Adding…" : "Add"}
                        </Button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Assigned By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credits.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No credit records</TableCell>
                                </TableRow>
                            )}
                            {credits.map((c) => (
                                <TableRow key={c._id}>
                                    {editId === c._id ? (
                                        <>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    className="h-7 w-24"
                                                    value={editForm.amount}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs font-medium capitalize ${creditTypeColor[c.type]}`}>{c.type}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    className="h-7"
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                                />
                                            </TableCell>
                                            {/* <TableCell className="text-xs text-muted-foreground">{c.assignedBy?.name ?? "—"}</TableCell> */}
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                            </TableCell>
                                            <TableCell className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={() => updateMut()} disabled={updatePend}><Check className="h-3.5 w-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}><X className="h-3.5 w-3.5" /></Button>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell className="font-medium">{c.amount}</TableCell>
                                            <TableCell>
                                                <span className={`text-xs font-medium capitalize ${creditTypeColor[c.type]}`}>{c.type}</span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{c.description || "—"}</TableCell>
                                            {/* <TableCell className="text-xs text-muted-foreground">{c?.assignedBy?.name ?? "—"}</TableCell> */}
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="icon" variant="ghost" className="h-7 w-7"
                                                    onClick={() => { setEditId(c._id); setEditForm({ amount: c.amount, description: c.description ?? "" }); }}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

// ─── Workspaces Tab ───────────────────────────────────────────────────────────

function WorkspacesTab({ userId }: { userId: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-user-workspaces", userId],
        queryFn: () => adminApi.getUserWorkspaces(userId),
        enabled: !!userId,
    });
    const workspaces: AdminWorkspace[] = (data as any)?.data?.data ?? [];

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{workspaces.length} workspace(s)</p>
            {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workspaces.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">No workspaces</TableCell></TableRow>
                            )}
                            {workspaces.map((ws) => (
                                <TableRow key={ws._id}>
                                    <TableCell className="font-medium text-sm">{ws.name}</TableCell>
                                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{ws.type}</Badge></TableCell>
                                    <TableCell><Badge variant={ws.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{ws.status}</Badge></TableCell>
                                    <TableCell className="text-sm"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" />{ws.members.length}</span></TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{new Date(ws.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

// ─── Access Level Tab ─────────────────────────────────────────────────────────

function AccessLevelTab({ userId }: { userId: string }) {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["admin-access-level", userId],
        queryFn: () => adminApi.getAccessLevel(userId),
        enabled: !!userId,
    });

    const al: AccessLevel | null = (data as any)?.data?.data ?? null;
    const [form, setForm] = useState<Partial<AccessLevel>>({});
    const dirty = Object.keys(form).length > 0;

    const { mutate: saveMut, isPending } = useMutation({
        mutationFn: () => adminApi.updateAccessLevel(userId, form),
        onSuccess: () => {
            toast.success("Access level updated");
            qc.invalidateQueries({ queryKey: ["admin-access-level", userId] });
            setForm({});
        },
        onError: () => toast.error("Failed to update access level"),
    });

    const val = <K extends keyof AccessLevel>(key: K): AccessLevel[K] | undefined =>
        (form as any)[key] !== undefined ? (form as any)[key] : al?.[key];

    const set = <K extends keyof AccessLevel>(key: K, value: AccessLevel[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    return (
        <div className="space-y-6">
            {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>}
            {al && (
                <>
                    {/* Plan */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Plan</Label>
                        <Select value={String(val("plan") ?? "free")} onValueChange={(v) => set("plan", v as any)}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Credit Balance */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Credit Balance</Label>
                        <Input
                            type="number"
                            className="w-48"
                            value={val("currentCredits") ?? 0}
                            onChange={(e) => set("currentCredits", Number(e.target.value))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Boolean toggles */}
                        {([
                            ["canCreateWorkspace", "Can Create Workspace"],
                            ["canInviteMembers", "Can Invite Members"],
                            ["canExportData", "Can Export Data"],
                            ["canAccessAnalytics", "Can Access Analytics"],
                        ] as const).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                <Label className="text-sm">{label}</Label>
                                <Switch
                                    checked={Boolean(val(key as keyof AccessLevel))}
                                    onCheckedChange={(v) => set(key as keyof AccessLevel, v as any)}
                                />
                            </div>
                        ))}

                        {/* Number inputs */}
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label className="text-sm">Max Workspaces</Label>
                            <Input
                                type="number"
                                className="w-20 h-8 text-center"
                                min={1}
                                value={val("maxWorkspaces") ?? 1}
                                onChange={(e) => set("maxWorkspaces", Number(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label className="text-sm">Max Team Members</Label>
                            <Input
                                type="number"
                                className="w-20 h-8 text-center"
                                min={1}
                                value={val("maxTeamMembers") ?? 1}
                                onChange={(e) => set("maxTeamMembers", Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={() => saveMut()} disabled={isPending || !dirty}>
                            {isPending ? "Saving…" : "Save Changes"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

interface Props {
    user: User | null;
    onClose: () => void;
}

export function UserDetailDialog({ user, onClose }: Props) {
    if (!user) return null;

    return (
        <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar?.url} alt={user.name} />
                            <AvatarFallback>{initials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-lg">{user.name}</DialogTitle>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                                <Badge variant={user.role === "admin" ? "default" : "outline"} className="text-[10px] capitalize">{user.role}</Badge>
                                <Badge variant={user.status === "active" ? "default" : "destructive"} className="text-[10px] capitalize">{user.status}</Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="credits" className="mt-2">
                    <TabsList className="w-full">
                        <TabsTrigger value="credits" className="flex-1">
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Credits
                        </TabsTrigger>
                        <TabsTrigger value="workspaces" className="flex-1">
                            <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Workspaces
                        </TabsTrigger>
                        <TabsTrigger value="access" className="flex-1">
                            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Access Level
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="credits" className="mt-4">
                        <CreditsTab userId={user._id} />
                    </TabsContent>
                    <TabsContent value="workspaces" className="mt-4">
                        <WorkspacesTab userId={user._id} />
                    </TabsContent>
                    <TabsContent value="access" className="mt-4">
                        <AccessLevelTab userId={user._id} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
