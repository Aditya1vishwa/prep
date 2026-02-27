import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { adminApi } from "@/api/admin.api";
import type { User } from "@/api/admin.api";

type UserStatus = "active" | "inactive" | "suspended";

interface ChangeStatusDialogProps {
    user: User | null;
    onClose: () => void;
}

export function ChangeStatusDialog({ user, onClose }: ChangeStatusDialogProps) {
    const qc = useQueryClient();
    const [status, setStatus] = useState<UserStatus>((user?.status as UserStatus) ?? "active");

    const { mutate, isPending } = useMutation({
        mutationFn: () => adminApi.updateUser(user!._id, { status }),
        onSuccess: () => {
            toast.success(`Status updated to "${status}" for ${user?.name}`);
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            onClose();
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err?.response?.data?.message ?? "Failed to update status");
        },
    });

    return (
        <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-xs">
                <DialogHeader>
                    <DialogTitle>Change Status</DialogTitle>
                    <DialogDescription>
                        Update account status for <strong>{user?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => mutate()} disabled={isPending || status === user?.status}>
                        {isPending ? "Saving…" : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
