import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, TrendingUp, Briefcase } from "lucide-react";
import usePageTitle from "@/hooks/use-page-title";

interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  newUsersLast30Days: number;
  newUsersLast7Days: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  usePageTitle("Admin Dashboard");

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => adminApi.getAnalytics(),
  });

  const analytics: Analytics | undefined = analyticsData?.data?.data;
  const newUsersLast7Days = analytics?.newUsersLast7Days ?? [];
  const maxCount = useMemo(() => Math.max(1, ...newUsersLast7Days.map((item) => item.count)), [newUsersLast7Days]);

  const statCards = [
    {
      title: "Total Users",
      value: analytics?.totalUsers ?? "—",
      icon: Users,
      description: `${analytics?.newUsersLast30Days ?? 0} new this month`,
      color: "text-blue-500",
    },
    {
      title: "Active Users",
      value: analytics?.activeUsers ?? "—",
      icon: Activity,
      description: "Currently active accounts",
      color: "text-green-500",
    },
    {
      title: "Workspaces",
      value: analytics?.totalWorkspaces ?? "—",
      icon: Briefcase,
      description: "Total workspaces created",
      color: "text-purple-500",
    },
    {
      title: "Growth (7d)",
      value: newUsersLast7Days.reduce((sum, d) => sum + d.count, 0),
      icon: TrendingUp,
      description: "New users in past 7 days",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-1 text-sm">Monitor and manage platform activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Users - Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {newUsersLast7Days.length === 0 ? (
            <p className="text-muted-foreground text-sm">No user growth data available yet.</p>
          ) : (
            <div className="flex h-44 items-end gap-2">
              {newUsersLast7Days.map((item) => {
                const heightPx = item.count === 0 ? 6 : Math.max(10, Math.round((item.count / maxCount) * 120));
                return (
                  <div key={item.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="bg-primary/90 hover:bg-primary w-full rounded-sm transition-colors"
                      style={{ height: `${heightPx}px` }}
                      title={`${item.count} users`}
                    />
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(item.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-[10px] font-medium">{item.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
