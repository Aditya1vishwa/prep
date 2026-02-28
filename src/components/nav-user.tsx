import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Briefcase,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authApi } from "@/api/auth.api"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import useUserStore from "@/store/userStore"
import { useState } from "react"
import Cookies from "js-cookie"
export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const UStore = useUserStore((s) => s.UStore)
  const currentUser = useUserStore((s) => s.user)
  const isAdmin = currentUser?.role === "admin"
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    await Promise.all([
      UStore("user", null),
      UStore("workspaces", []),
    ])
    navigate("/login", { replace: true });
    Cookies.remove("workspaceId");
    try {
      await authApi.logout()
      toast.success("Logged out successfully")
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Logged out locally. Server logout failed.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link to={"/profile?tab=personal"}>
                <DropdownMenuItem className="cursor-pointer">
                  <BadgeCheck />
                  Profile
                </DropdownMenuItem>
              </Link>
              {!isAdmin && (
                <Link to={"/profile?tab=plans"}>
                  <DropdownMenuItem className="cursor-pointer">
                    <CreditCard />
                    Plans
                  </DropdownMenuItem>
                </Link>
              )}
              {!isAdmin && (
                <Link to={"/profile?tab=workspaces"}>
                  <DropdownMenuItem className="cursor-pointer">
                    <Briefcase className="size-4" />
                    Workspaces
                  </DropdownMenuItem>
                </Link>
              )}
              <Link to={"/notifications"}>
                <DropdownMenuItem className="cursor-pointer">
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void handleLogout()
              }}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
