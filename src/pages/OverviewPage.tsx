import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import AppLogo from "@/components/AppLogo";
import { BookOpen, BrainCircuit, GraduationCap, Sparkles } from "lucide-react";
import useUserStore from "@/store/userStore";
import usePageTitle from "@/hooks/use-page-title";
import { getDashboardRoute } from "@/lib/dashboard-route";

export default function OverviewPage() {
    const navigate = useNavigate();
    const user = useUserStore((s) => s.user);
    usePageTitle("Overview");

    return (
        <div className="bg-background min-h-screen flex flex-col items-center justify-center p-3 md:p-14 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 blur-[100px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="max-w-5xl w-full flex flex-col gap-12 relative z-10">
                <header className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <AppLogo className="w-12 h-12" />
                        <div className="flex items-center gap-2">
                            {user ? (
                                <Button size="sm" onClick={() => navigate(getDashboardRoute(user.role))}>
                                    Dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                                        Login
                                    </Button>
                                    <Button size="sm" onClick={() => navigate("/signup")}>
                                        Sign up
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-center text-center gap-4">
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            PrepBuddy
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl">
                            Your AI-powered study companion that transforms how you learn and prepare for exams.
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <BrainCircuit className="w-10 h-10 text-primary mb-2" />
                            <CardTitle>AI Study Materials</CardTitle>
                            <CardDescription>Generate notes, quizzes, and summaries instantly from any topic.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Stop wasting hours organizing. PrepBuddy's AI analyzes your curriculum and creates high-quality study materials in seconds.
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <Sparkles className="w-10 h-10 text-primary mb-2" />
                            <CardTitle>Smart Personalization</CardTitle>
                            <CardDescription>Learning that adapts to your unique pace and style.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            PrepBuddy identifies your weak areas and tailors its recommendations to help you master complex subjects efficiently.
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <BookOpen className="w-10 h-10 text-primary mb-2" />
                            <CardTitle>Organized Workspaces</CardTitle>
                            <CardDescription>Keep all your subjects and notes organized in one place.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Create dedicated workspaces for different subjects, collaborate with peers, and access your materials from anywhere.
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <GraduationCap className="w-10 h-10 text-primary mb-2" />
                            <CardTitle>Exam Readiness</CardTitle>
                            <CardDescription>Feel confident on test day with real-time feedback.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            Take practice tests generated from your materials and get instant feedback on where to focus your efforts.
                        </CardContent>
                    </Card>
                </div>

                <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    {user ? (
                        <Button size="lg" className="rounded-full px-8 flex gap-2" onClick={() => navigate(getDashboardRoute(user.role))}>
                            Go to Dashboard <Sparkles className="w-4 h-4" />
                        </Button>
                    ) : (
                        <>
                            <Button size="lg" className="rounded-full px-8 flex gap-2" onClick={() => navigate("/signup")}>
                                Get Started for Free <Sparkles className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="lg" className="rounded-full px-8" onClick={() => navigate("/login")}>
                                Login to Your Account
                            </Button>
                        </>
                    )}
                </footer>
            </div>

            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
                <p className="text-xs text-muted-foreground hidden sm:block">Switch Theme</p>
                <ModeToggle />
            </div>
        </div>
    );
}
