import { Outlet, useLocation, Link } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import NotificationMenu from "@/components/notifications/NotificationMenu";
import useUserStore from "@/store/userStore";
import { getDashboardRoute } from "@/lib/dashboard-route";

// Map path segments to readable labels
const breadcrumbMap: Record<string, string> = {
    admin: "Admin",
    users: "Users",
    settings: "Settings",
    workspaces: "Workspaces",
    notifications: "Notifications",
    dashboard: "Dashboard",
};

export default function AppLayout() {
    const location = useLocation();
    const user = useUserStore((s) => s.user);
    const segments = location.pathname.split("/").filter(Boolean);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to={getDashboardRoute(user?.role)}>Home</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {segments.map((seg, idx) => {
                                    const isLast = idx === segments.length - 1;
                                    const label = breadcrumbMap[seg] ?? seg;
                                    const href = "/" + segments.slice(0, idx + 1).join("/");
                                    return (
                                        <span key={seg} className="flex items-center gap-1.5">
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink asChild>
                                                        <Link to={href}>{label}</Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        </span>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-4">
                        <div className="flex items-center gap-1">
                            <NotificationMenu />
                            <ModeToggle />
                        </div>
                    </div>
                </header>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
