import { useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import useUserStore from "@/store/userStore";

interface Props {
    children?: ReactNode;
}

export default function AuthLayout({ children }: Props) {
    const UStore = useUserStore((s) => s.UStore);
    const [bootstrapped, setBootstrapped] = useState(false);

    const { data, isPending, isError } = useQuery({
        queryKey: ["auth-me"],
        queryFn: () => authApi.me(),
        retry: false,
        staleTime: 60_000,
    });

    useEffect(() => {
        if (!data) return;
        const payload = data.data.data;
        Promise.all([
            UStore("user", payload.user),
            UStore("workspaces", payload.workspaces ?? []),
        ]).finally(() => setBootstrapped(true));
    }, [data, UStore]);

    useEffect(() => {
        if (!isError) return;
        Promise.all([
            UStore("user", null),
            UStore("workspaces", []),
        ]).finally(() => setBootstrapped(true));
    }, [isError, UStore]);

    if (!bootstrapped || isPending) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading account...</p>
            </div>
        );
    }

    if (!bootstrapped) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return <>{children ?? <Outlet />}</>;
}
