export type AppRole = "admin" | "user";

export function getDashboardRoute(role?: string | null) {
  return role === "admin" ? "/admin/dashboard" : "/dashboard";
}
