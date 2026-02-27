import { Bell } from "lucide-react";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { notificationApi } from "@/api/notification.api";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function NotificationMenu() {
    const qc = useQueryClient();

    const { data } = useQuery({
        queryKey: ["my-notifications"],
        queryFn: () => notificationApi.list(),
        staleTime: 30_000,
    });

    const payload = data?.data?.data;
    const notifications = payload?.notifications ?? [];
    const unreadCount = payload?.unreadCount ?? 0;

    const preview = useMemo(() => notifications.slice(0, 5), [notifications]);

    const { mutate: markOneRead } = useMutation({
        mutationFn: (id: string) => notificationApi.markRead(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications"] }),
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {preview.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                    preview.map((n) => (
                        <DropdownMenuItem key={n._id} className="items-start" onClick={() => !n.isRead && markOneRead(n._id)}>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium capitalize">{n.key.replace(/-/g, " ")}</span>
                                <span className="text-xs text-muted-foreground line-clamp-2">{n.value}</span>
                            </div>
                            {!n.isRead && <span className="ml-auto mt-1 h-2 w-2 rounded-full bg-primary" />}
                        </DropdownMenuItem>
                    ))
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/notifications" className="w-full cursor-pointer justify-center text-sm">
                        Show all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
