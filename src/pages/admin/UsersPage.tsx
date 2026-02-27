import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { adminApi } from "@/api/admin.api";
import type { User, AddUserPayload } from "@/api/admin.api";
import { ServerDataTable } from "@/components/data-table/server-data-table";
import type { ServerTableState } from "@/components/data-table/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { StatusSelect } from "@/components/status-select";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { ChangeStatusDialog } from "@/components/users/ChangeStatusDialog";
import { UserDetailDialog } from "@/components/users/UserDetailDialog";
import { UserPlus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import usePageTitle from "@/hooks/use-page-title";

// ─── helpers ──────────────────────────────────────────────────────────────────

const roleBadge = (role: string) => (
    <Badge variant={role === "admin" ? "default" : "outline"} className="capitalize text-xs">
        {role}
    </Badge>
);

const avatarInitials = (name: string) =>
    name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

const emptyAdd: AddUserPayload = { name: "", email: "", password: "", phone: "", role: "user" };

// ─── initial table state ───────────────────────────────────────────────────────

const initState: ServerTableState = {
    page: 1,
    limit: 10,
    search: "",
    sort_by: null,
    sort_order: "asc",
    filters: { role: "all", status: "all" },
};

// ─── main page ───────────────────────────────────────────────────────────────

export default function UsersPage() {
    usePageTitle("Users");
    const qc = useQueryClient();

    // ── table state
    const [tableState, setTableState] = useState<ServerTableState>(initState);
    const onTableStateChange = (updates: Partial<ServerTableState>) =>
        setTableState((prev) => ({ ...prev, ...updates }));

    // ── dialog state
    const [addOpen, setAddOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [statusUser, setStatusUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [detailUser, setDetailUser] = useState<User | null>(null);

    // ── add form state
    const [addForm, setAddForm] = useState<AddUserPayload>(emptyAdd);

    // ── fetch
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["admin-users", tableState],
        queryFn: () =>
            adminApi.listUsers({
                page: tableState.page,
                limit: tableState.limit,
                search: tableState.search || undefined,
                role: tableState.filters.role !== "all" ? String(tableState.filters.role) : undefined,
                status: tableState.filters.status !== "all" ? String(tableState.filters.status) : undefined,
                sort: tableState.sort_by ?? undefined,
                order: tableState.sort_order,
            }),
        placeholderData: (prev) => prev,
    });

    const users: User[] = data?.data?.data?.data ?? [];
    const total: number = data?.data?.data?.totalCounts ?? 0;

    // ── add mutation
    const { mutate: addMutate, isPending: addPending } = useMutation({
        mutationFn: () => adminApi.addUser(addForm),
        onSuccess: () => {
            toast.success(`User "${addForm.name}" created`);
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setAddOpen(false);
            setAddForm(emptyAdd);
        },
        onError: (err: { response?: { data?: { message?: string } } }) =>
            toast.error(err?.response?.data?.message ?? "Failed to create user"),
    });

    // ── delete mutation
    const { mutate: deleteMutate, isPending: deletePending } = useMutation({
        mutationFn: (hard: boolean) => adminApi.deleteUser(deleteUser!._id, hard),
        onSuccess: (_r, hard) => {
            toast.success(hard ? "User permanently deleted" : "User deactivated");
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setDeleteUser(null);
        },
        onError: (err: { response?: { data?: { message?: string } } }) =>
            toast.error(err?.response?.data?.message ?? "Failed to delete user"),
    });

    // ─── columns ──────────────────────────────────────────────────────────────

    const columns = useMemo<ColumnDef<User, unknown>[]>(
        () => [
            {
                id: "user",
                header: "User",
                enableSorting: false,
                cell: ({ row }) => {
                    const u = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            {u.avatar?.url ? (
                                <img
                                    src={u.avatar.url}
                                    alt={u.name}
                                    className="h-8 w-8 rounded-full object-cover shrink-0"
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                                    {avatarInitials(u.name)}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{u.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                        </div>
                    );
                },
                size: 260,
            },
            {
                accessorKey: "role",
                header: "Role",
                enableSorting: false,
                cell: ({ getValue }) => roleBadge(getValue<string>()),
                size: 90,
            },
            {
                id: "status",
                header: "Status",
                enableSorting: false,
                cell: ({ row }) => <StatusSelect row={row.original} />,
                size: 130,
            },
            {
                id: "workspace",
                header: "Workspace",
                enableSorting: false,
                cell: ({ row }) => {
                    const ws = row.original.defaultWorkspace;
                    if (!ws) return <span className="text-muted-foreground text-sm">—</span>;
                    return (
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm truncate max-w-[140px]">{ws.name}</span>
                            <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                                {ws.type}
                            </Badge>
                        </div>
                    );
                },
                size: 180,
            },
            {
                accessorKey: "createdAt",
                header: "Joined",
                enableSorting: true,
                cell: ({ getValue }) => (
                    <span className="text-sm text-muted-foreground">
                        {new Date(getValue<string>()).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </span>
                ),
                size: 110,
            },
            {
                id: "actions",
                header: () => <span className="sr-only">Actions</span>,
                enableSorting: false,
                cell: ({ row }) => {
                    const u = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            {/* Edit */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Edit user"
                                onClick={(e) => { e.stopPropagation(); setEditUser(u); }}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {/* Change Status */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-amber-500 hover:text-amber-600"
                                title="Change status"
                                onClick={(e) => { e.stopPropagation(); setStatusUser(u); }}
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                            </Button>
                            {/* Delete */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete user"
                                onClick={(e) => { e.stopPropagation(); setDeleteUser(u); }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    );
                },
                size: 100,
            },
        ],
        []
    );

    // ─── filter slot ──────────────────────────────────────────────────────────

    const filterSlot = (
        <>
            <Select
                value={String(tableState.filters.role ?? "all")}
                onValueChange={(v) =>
                    onTableStateChange({ filters: { ...tableState.filters, role: v }, page: 1 })
                }
            >
                <SelectTrigger className="h-9 w-28 text-sm">
                    <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>
            <Select
                value={String(tableState.filters.status ?? "all")}
                onValueChange={(v) =>
                    onTableStateChange({ filters: { ...tableState.filters, status: v }, page: 1 })
                }
            >
                <SelectTrigger className="h-9 w-32 text-sm">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
            </Select>
        </>
    );

    // ─── render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-muted-foreground text-sm">{total} total users</p>
                </div>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Data Table */}
            <ServerDataTable<User>
                tableState={tableState}
                onTableStateChange={onTableStateChange}
                columns={columns}
                data={users}
                total={total}
                isLoading={isLoading}
                isFetching={isFetching}
                onRefresh={() => refetch()}
                filterSlot={filterSlot}
                searchPlaceholder="Search by name or email…"
                enableColumnVisibility
                onRowClick={(row: any) => setDetailUser(row)}
                emptyState={
                    <div className="py-12 text-center text-muted-foreground text-sm">
                        No users found. Try adjusting your filters.
                    </div>
                }
            />

            {/* ── Add User Dialog ─────────────────────────────────────────── */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create a new account with a default workspace.</DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>Full Name *</FieldLabel>
                                <Input
                                    placeholder="John Doe"
                                    value={addForm.name}
                                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Phone</FieldLabel>
                                <Input
                                    type="tel"
                                    placeholder="+91 9999999999"
                                    value={addForm.phone ?? ""}
                                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                                />
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel>Email *</FieldLabel>
                            <Input
                                type="email"
                                placeholder="john@example.com"
                                value={addForm.email}
                                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Password *</FieldLabel>
                            <Input
                                type="password"
                                placeholder="Min 6 characters"
                                value={addForm.password}
                                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Role</FieldLabel>
                            <Select
                                value={addForm.role ?? "user"}
                                onValueChange={(v) => setAddForm((f) => ({ ...f, role: v }))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setAddOpen(false); setAddForm(emptyAdd); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => addMutate()}
                            disabled={addPending || !addForm.name || !addForm.email || !addForm.password}
                        >
                            {addPending ? "Creating…" : "Create User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit User Dialog ─────────────────────────────────────────── */}
            <EditUserDialog user={editUser} onClose={() => setEditUser(null)} />

            {/* ── Change Status Dialog ─────────────────────────────────────── */}
            <ChangeStatusDialog user={statusUser} onClose={() => setStatusUser(null)} />

            {/* ── User Detail Dialog (click row) ────────────────────────────── */}
            <UserDetailDialog user={detailUser} onClose={() => setDetailUser(null)} />

            {/* ── Delete Confirm ────────────────────────────────────────────── */}
            <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleteUser?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose <strong>Deactivate</strong> to soft-delete (reversible) or{" "}
                            <strong>Delete Permanently</strong> to remove all data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            variant="outline"
                            onClick={() => deleteMutate(false)}
                            disabled={deletePending}
                        >
                            Deactivate
                        </Button>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutate(true)}
                            disabled={deletePending}
                        >
                            {deletePending ? "Deleting…" : "Delete Permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
