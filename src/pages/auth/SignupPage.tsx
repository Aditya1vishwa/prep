import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authApi } from "@/api/auth.api";
import type { AuthUser } from "@/api/auth.api";
import AppLogo from "@/components/AppLogo";
import { ModeToggle } from "@/components/mode-toggle";
import useUserStore from "@/store/userStore";
import usePageTitle from "@/hooks/use-page-title";
import { getDashboardRoute } from "@/lib/dashboard-route";

export default function SignupPage() {
    usePageTitle("Signup");
    const navigate = useNavigate();
    const UStore = useUserStore((s) => s.UStore);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const { mutate, isPending } = useMutation({
        mutationFn: () => authApi.signup({ name, email, password }),
        onSuccess: (res) => {
            const payload = (res.data as { data?: { user?: AuthUser } })?.data;
            const user = payload?.user;
            if (!user) {
                toast.success("Account created successfully. Please login.");
                navigate("/login", { replace: true });
                return;
            }
            Promise.all([
                UStore("user", user),
                UStore("workspaces", []),
            ]);
            toast.success(`Account created! Welcome, ${user.name} 🎉`);
            if (user.role === "user" && !user.onboardingCompleted) {
                navigate("/onboarding", { replace: true });
            } else {
                navigate(getDashboardRoute(user.role), { replace: true });
            }
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err?.response?.data?.message || "Signup failed. Please try again.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        mutate();
    };

    return (
        <div className=" flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <AppLogo className="self-center" />

                <div className={cn("flex flex-col gap-6")}>
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">Create your account</CardTitle>
                            <CardDescription>
                                Sign up with Google or use your email
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <FieldGroup>
                                    {/* Social sign-up — coming soon */}
                                    <Field>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full"
                                            onClick={() =>
                                                toast.info("Google sign-up coming soon!", {
                                                    description: "Use email & password for now.",
                                                })
                                            }
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                <path
                                                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                            Sign up with Google
                                        </Button>
                                    </Field>

                                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                        Or continue with
                                    </FieldSeparator>

                                    {/* Full Name */}
                                    <Field>
                                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            disabled={isPending}
                                        />
                                    </Field>

                                    {/* Email */}
                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isPending}
                                        />
                                    </Field>

                                    {/* Password + Confirm side by side */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field>
                                            <FieldLabel htmlFor="password">Password</FieldLabel>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                disabled={isPending}
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="confirm-password">Confirm</FieldLabel>
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirm}
                                                onChange={(e) => setConfirm(e.target.value)}
                                                required
                                                disabled={isPending}
                                            />
                                        </Field>
                                    </div>
                                    <FieldDescription>Must be at least 6 characters long.</FieldDescription>

                                    {/* Submit */}
                                    <Field>
                                        <Button type="submit" disabled={isPending} className="w-full">
                                            {isPending ? "Creating account…" : "Create Account"}
                                        </Button>
                                        <FieldDescription className="text-center">
                                            Already have an account?{" "}
                                            <Link
                                                to="/login"
                                                className="underline underline-offset-4 hover:text-primary"
                                            >
                                                Sign in
                                            </Link>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>

                    <FieldDescription className="px-6 text-center">
                        By clicking continue, you agree to our{" "}
                        <a href="#" className="underline underline-offset-4">Terms of Service</a>{" "}
                        and{" "}
                        <a href="#" className="underline underline-offset-4">Privacy Policy</a>.
                    </FieldDescription>
                </div>
            </div>
            <div className="fixed bottom-5 right-5 z-50">
                <ModeToggle />
            </div>
        </div>
    );
}
