"use client"

import * as React from "react"
import { useState } from "react"
import { Briefcase, LayoutDashboard, Users, Plus, Shield, Settings } from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddWorkspaceDialog } from "@/components/workspaces/AddWorkspaceDialog"
import useUserStore from "@/store/userStore"
import { getDashboardRoute } from "@/lib/dashboard-route"
import { ChevronsUpDown } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useUserStore((s) => s.user)
  const isAdmin = user?.role === "admin"
  const workspaces = useUserStore((s) => s.workspaces)
  const [addWsOpen, setAddWsOpen] = useState(false)
  const [activeWs, setActiveWs] = useState<string | null>(null)

  const currentWs = workspaces.find((w: any) => w._id === activeWs) ?? workspaces[0]

  const navItems = [
    {
      title: "Dashboard",
      url: getDashboardRoute(user?.role),
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    ...(isAdmin
      ? [
        {
          title: "Users",
          url: "/admin/users",
          icon: Users,
          items: [],
        },
        {
          title: "Settings",
          url: "/admin/settings",
          icon: Settings,
          items: [
            {
              title: "Default Access",
              url: "/admin/settings?section=access",
            },
            {
              title: "Assets",
              url: "/admin/settings?section=assets",
            }
          ],
        },
      ]
      : []),
  ]

  const navUser = {
    name: user?.name ?? "Guest",
    email: user?.email ?? "",
    avatar: user?.avatar?.url ?? "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {isAdmin ? <Shield className="size-4" /> : <Briefcase className="size-4" />}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {isAdmin ? "Admin Panel" : (currentWs?.name ?? "No Workspace")}
                    </span>
                    <span className="truncate text-xs capitalize">
                      {isAdmin ? "System Access" : (currentWs?.type ?? "personal")}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin" : "Workspaces"}
                </DropdownMenuLabel>

                {isAdmin ? (
                  <DropdownMenuItem className="gap-2 p-2" disabled>
                    <Shield className="size-3.5 shrink-0" />
                    Admin controls enabled
                  </DropdownMenuItem>
                ) : (
                  <>
                    {workspaces.map((ws: any) => (
                      <DropdownMenuItem
                        key={ws._id}
                        onClick={() => setActiveWs(ws._id)}
                        className="gap-2 p-2"
                      >
                        <div className="flex size-6 items-center justify-center rounded-sm border">
                          <Briefcase className="size-3.5 shrink-0" />
                        </div>
                        {ws.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 p-2 cursor-pointer"
                      onClick={() => setAddWsOpen(true)}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <Plus className="size-4" />
                      </div>
                      <div className="font-medium text-muted-foreground">Add workspace</div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />

      {!isAdmin && <AddWorkspaceDialog open={addWsOpen} onClose={() => setAddWsOpen(false)} />}
    </Sidebar>
  )
}
