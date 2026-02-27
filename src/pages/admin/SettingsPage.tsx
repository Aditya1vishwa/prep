import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Image, Settings } from "lucide-react";
import { adminApi } from "@/api/admin.api";
import type { DefaultAccessSetting, DefaultAssetSetting } from "@/api/admin.api";
import usePageTitle from "@/hooks/use-page-title";
import { useLocation, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const fallbackAccess: DefaultAccessSetting = {
  plan: "free",
  canCreateWorkspace: false,
  maxWorkspaces: 1,
  canInviteMembers: false,
  maxTeamMembers: 1,
  canExportData: false,
  canAccessAnalytics: false,
  currentCredits: 0,
};

const fallbackAssets: DefaultAssetSetting = {
  appLogoUrl: "",
  smallLogoUrl: "",
  faviconUrl: "",
  appName: "PrepBuddy",
  primaryColor: "#6366f1",
};

export default function SettingsPage() {
  usePageTitle("Settings");

  const location = useLocation();
  const navigate = useNavigate();
  const section = new URLSearchParams(location.search).get("section") || "access";

  const { data: accessData, isLoading: isLoadingAccess } = useQuery({
    queryKey: ["admin-default-access"],
    queryFn: () => adminApi.getDefaultAccessSetting(),
  });

  const { data: assetData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ["admin-default-assets"],
    queryFn: () => adminApi.getDefaultAssetSetting(),
  });

  const [accessForm, setAccessForm] = useState<DefaultAccessSetting>(fallbackAccess);
  const [assetForm, setAssetForm] = useState<DefaultAssetSetting>(fallbackAssets);

  useEffect(() => {
    const payload = accessData?.data?.data;
    if (payload) setAccessForm(payload);
  }, [accessData]);

  useEffect(() => {
    const payload = assetData?.data?.data;
    if (payload) setAssetForm(payload);
  }, [assetData]);

  const { mutate: saveAccess, isPending: isSavingAccess } = useMutation({
    mutationFn: () => adminApi.updateDefaultAccessSetting(accessForm),
    onSuccess: () => toast.success("Default access settings updated"),
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update access settings"),
  });

  const { mutate: saveAssets, isPending: isSavingAssets } = useMutation({
    mutationFn: () => adminApi.updateDefaultAssetSetting(assetForm),
    onSuccess: () => toast.success("Default asset settings updated"),
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update asset settings"),
  });

  const handleSectionChange = (value: string) => {
    navigate(`/admin/settings?section=${value}`, { replace: true });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage default access and default assets via service data.</p>
      </div>

      <Tabs value={section} onValueChange={handleSectionChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="access">Default Access</TabsTrigger>
          <TabsTrigger value="assets">Asset Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Default Access
              </CardTitle>
              <CardDescription>Applied for new users by default.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingAccess ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Plan</Label>
                    <Select value={accessForm.plan} onValueChange={(v) => setAccessForm((f) => ({ ...f, plan: v as any }))}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Max Workspaces</Label>
                      <Input type="number" min={1} value={accessForm.maxWorkspaces}
                        onChange={(e) => setAccessForm((f) => ({ ...f, maxWorkspaces: Number(e.target.value) || 1 }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max Team Members</Label>
                      <Input type="number" min={1} value={accessForm.maxTeamMembers}
                        onChange={(e) => setAccessForm((f) => ({ ...f, maxTeamMembers: Number(e.target.value) || 1 }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Default Credits</Label>
                      <Input type="number" min={0} value={accessForm.currentCredits}
                        onChange={(e) => setAccessForm((f) => ({ ...f, currentCredits: Number(e.target.value) || 0 }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label>Can Create Workspace</Label>
                      <Switch checked={accessForm.canCreateWorkspace} onCheckedChange={(v) => setAccessForm((f) => ({ ...f, canCreateWorkspace: v }))} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label>Can Invite Members</Label>
                      <Switch checked={accessForm.canInviteMembers} onCheckedChange={(v) => setAccessForm((f) => ({ ...f, canInviteMembers: v }))} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label>Can Export Data</Label>
                      <Switch checked={accessForm.canExportData} onCheckedChange={(v) => setAccessForm((f) => ({ ...f, canExportData: v }))} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label>Can Access Analytics</Label>
                      <Switch checked={accessForm.canAccessAnalytics} onCheckedChange={(v) => setAccessForm((f) => ({ ...f, canAccessAnalytics: v }))} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => saveAccess()} disabled={isSavingAccess}>
                      {isSavingAccess ? "Saving..." : "Save Access Settings"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-4 w-4" /> Asset Settings
              </CardTitle>
              <CardDescription>Default brand assets and app identity from service data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAssets ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label>App Name</Label>
                      <Input value={assetForm.appName} onChange={(e) => setAssetForm((f) => ({ ...f, appName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Primary Color</Label>
                      <Input value={assetForm.primaryColor} onChange={(e) => setAssetForm((f) => ({ ...f, primaryColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>App Logo URL</Label>
                      <Input value={assetForm.appLogoUrl} onChange={(e) => setAssetForm((f) => ({ ...f, appLogoUrl: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Small Logo URL</Label>
                      <Input value={assetForm.smallLogoUrl} onChange={(e) => setAssetForm((f) => ({ ...f, smallLogoUrl: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Favicon URL</Label>
                      <Input value={assetForm.faviconUrl} onChange={(e) => setAssetForm((f) => ({ ...f, faviconUrl: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => saveAssets()} disabled={isSavingAssets}>
                      {isSavingAssets ? "Saving..." : "Save Asset Settings"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
