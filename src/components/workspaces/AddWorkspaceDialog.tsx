import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { workspaceApi } from "@/api/workspace.api";
import type { CreateWorkspacePayload } from "@/api/workspace.api";
import { authApi } from "@/api/auth.api";
import useUserStore from "@/store/userStore";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";


interface Props {
    open: boolean;
    onClose: () => void;
}

const emptyForm: CreateWorkspacePayload = {
    name: "",
    description: "",
    type: "team",
    members: [],
};

export function AddWorkspaceDialog({ open, onClose }: Props) {
    const UStore = useUserStore((s) => s.UStore);
    const [form, setForm] = useState<CreateWorkspacePayload>(emptyForm);
    const [newMemberId, setNewMemberId] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("member");

    const { mutate, isPending } = useMutation({
        mutationFn: () => workspaceApi.createWorkspace(form),
        onSuccess: async () => {
            const me = await authApi.me();
            const payload = me.data.data;
            await Promise.all([
                UStore("user", payload.user),
                UStore("workspaces", payload.workspaces ?? []),
            ]);
            toast.success(`Workspace "${form.name}" created`);
            onClose();
            setForm(emptyForm);
        },
        onError: (err: any) =>
            toast.error(err?.response?.data?.message ?? "Failed to create workspace"),
    });

    const addMember = () => {
        if (!newMemberId.trim()) return;
        setForm((f) => ({
            ...f,
            members: [...(f.members ?? []), { email: newMemberId.trim(), role: newMemberRole } as any],
        }));
        setNewMemberId("");
        setNewMemberRole("member");
    };

    const removeMember = (idx: number) =>
        setForm((f) => ({
            ...f,
            members: (f.members ?? []).filter((_, i) => i !== idx),
        }));

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                    <DialogDescription>
                        Set up a new workspace. You can add members by their user ID.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="ws-name">Workspace Name *</Label>
                        <Input
                            id="ws-name"
                            placeholder="My Team"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ws-desc">Description</Label>
                        <Input
                            id="ws-desc"
                            placeholder="What is this workspace for?"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Members */}
                    <div className="space-y-2">
                        <Label>Members</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Member Email"
                                type="email"
                                value={newMemberId}
                                onChange={(e) => setNewMemberId(e.target.value)}
                                className="flex-1"
                            />
                            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="button" size="icon" variant="outline" onClick={addMember}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {(form.members ?? []).length > 0 && (
                            <div className="space-y-1.5 mt-2">
                                {(form.members ?? []).map((m: any, i) => (
                                    <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                                        <span className="flex-1 text-muted-foreground text-xs truncate">{m.email}</span>
                                        <span className="text-xs capitalize bg-secondary px-2 py-0.5 rounded">{m.role}</span>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeMember(i)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => mutate()} disabled={isPending || !form.name.trim()}>
                        {isPending ? "Creating…" : "Create Workspace"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
