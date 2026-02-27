import useUserStore from "@/store/userStore";
import usePageTitle from "@/hooks/use-page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, UserCircle2 } from "lucide-react";

export default function UserDashboardPage() {
  const user = useUserStore((s) => s.user);
  const workspaces = useUserStore((s) => s.workspaces);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  usePageTitle("Dashboard");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Good day, {firstName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">Here is your workspace overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Your Profile</CardTitle>
            <UserCircle2 className="text-blue-500 h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Name:</span> {user?.name ?? "—"}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}
            </p>
            <p className="text-sm capitalize">
              <span className="text-muted-foreground">Role:</span> {user?.role ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Workspaces</CardTitle>
            <Briefcase className="text-green-500 h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">{workspaces.length}</p>
            <p className="text-muted-foreground text-xs">Accessible workspaces</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
