import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import useUserStore from "@/store/userStore";
import usePageTitle from "@/hooks/use-page-title";
import { onboardingApi } from "@/api/onboarding.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  UserCircle2,
  Rocket,
  GraduationCap,
  SearchCheck,
  Building2,
} from "lucide-react";

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const workspaces = useUserStore((s) => s.workspaces);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  usePageTitle("Dashboard");

  const { data } = useQuery({
    queryKey: ["dashboard-onboarding-role"],
    queryFn: () => onboardingApi.getMe(),
    enabled: !!user,
  });

  const onboardingRole = data?.data?.data?.role ?? "student";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Good day, {firstName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">Here is your personalized dashboard.</p>
      </div>

      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-background to-primary/5">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/15 p-3">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Ready to level up today?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Launch a guided path and keep momentum with focused goals.
              </p>
            </div>
            <Button size="lg" className="px-8" onClick={() => navigate("/dashboard")}>Start New Learning Path</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Role Track</CardTitle>
            {onboardingRole === "student" ? (
              <GraduationCap className="h-4 w-4 text-indigo-500" />
            ) : onboardingRole === "job_seeker" ? (
              <SearchCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <Building2 className="h-4 w-4 text-orange-500" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">{onboardingRole.replace("_", " ")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {onboardingRole === "student"
                ? "Practice-focused learning dashboard"
                : onboardingRole === "job_seeker"
                  ? "Career-growth and placement dashboard"
                  : "Hiring and talent pipeline dashboard"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Your Profile</CardTitle>
            <UserCircle2 className="text-blue-500 h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm"><span className="text-muted-foreground">Name:</span> {user?.name ?? "—"}</p>
            <p className="text-sm"><span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}</p>
            <p className="text-sm capitalize"><span className="text-muted-foreground">Account:</span> {user?.role ?? "—"}</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        {onboardingRole === "student" && (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Prep Progress</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Track mock tests, weak topics, and daily streaks.</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Campus Targets</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Set internship targets and placement deadlines.</p></CardContent>
            </Card>
          </>
        )}
        {onboardingRole === "job_seeker" && (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Application Pipeline</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Manage active applications and interview stages.</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Upskill Focus</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Choose role-specific learning goals and assessments.</p></CardContent>
            </Card>
          </>
        )}
        {onboardingRole === "recruiter" && (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Hiring Pipeline</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Review top candidates and shortlist by role fit.</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Open Positions</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Monitor all active openings and applicant volume.</p></CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
