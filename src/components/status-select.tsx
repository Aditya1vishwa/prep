import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { adminApi } from "@/api/admin.api";
import type { User } from "@/api/admin.api";

interface StatusSelectProps {
    row: User;
}

export function StatusSelect({ row }: StatusSelectProps) {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: (newStatus: string) =>
            adminApi.updateUser(row._id, { status: newStatus }),
        onSuccess: (_r, newStatus) => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast.success("Status updated", {
                description: `${row.name}'s status has been changed to "${newStatus}".`,
            });
        },
        onError: () => {
            toast.error("Error", {
                description: "Failed to update status. Please try again.",
            });
        },
    });

    return (
        <Select
            defaultValue={row.status}
            onValueChange={(value) => mutate(value)}
            disabled={isPending}
        >
            <SelectTrigger
                className={`w-[120px] h-8 text-xs font-medium border-0 shadow-none bg-transparent focus:ring-0 ${row.status === "active"
                        ? "text-green-600"
                        : row.status === "suspended"
                            ? "text-destructive"
                            : "text-muted-foreground"
                    }`}
            >
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="active" className="text-green-600">Active</SelectItem>
                <SelectItem value="inactive" className="text-muted-foreground">Inactive</SelectItem>
                <SelectItem value="suspended" className="text-destructive">Suspended</SelectItem>
            </SelectContent>
        </Select>
    );
}
