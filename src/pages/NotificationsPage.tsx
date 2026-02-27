import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationApi } from "@/api/notification.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import usePageTitle from "@/hooks/use-page-title";

export default function NotificationsPage() {
    usePageTitle("Notifications");
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["my-notifications"],
        queryFn: () => notificationApi.list(),
    });

    const notifications = data?.data?.data?.notifications ?? [];
    const unreadCount = data?.data?.data?.unreadCount ?? 0;

    const { mutate: markRead } = useMutation({
        mutationFn: (id: string) => notificationApi.markRead(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications"] }),
    });

    const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
        mutationFn: () => notificationApi.markAllRead(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications"] }),
    });

    return (
        <div className="flex flex-1 flex-col gap-4 p-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="text-sm text-muted-foreground">Recent alerts and updates for your account.</p>
                </div>
                <Button variant="outline" onClick={() => markAllRead()} disabled={isMarkingAll || unreadCount === 0}>
                    <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">All Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : notifications.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                            <Bell className="mx-auto mb-2 h-5 w-5" />
                            No notifications found.
                        </div>
                    ) : (
                        notifications.map((n: any) => (
                            <div key={n._id} className="rounded-md border p-3 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium capitalize">{n.key.replace(/-/g, " ")}</p>
                                        {!n.isRead && <Badge className="text-[10px]">New</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{n.value}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {!n.isRead && (
                                    <Button size="sm" variant="outline" onClick={() => markRead(n._id)}>
                                        Mark read
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
