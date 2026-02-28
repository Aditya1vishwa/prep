import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { onboardingApi } from "@/api/onboarding.api";
import usePageTitle from "@/hooks/use-page-title";
import useUserStore from "@/store/userStore";
import type { EducationItem, ExperienceItem, OnboardingRole, ProjectItem, RecruiterOpening } from "@/types/onboarding";
import { getDashboardRoute } from "@/lib/dashboard-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const steps = [
    { id: 0, title: "Role & Basics" },
    { id: 1, title: "Role Details" },
    { id: 2, title: "Education / Work / Openings" },
    { id: 3, title: "Links & Privacy" },
];

const parseCSV = (value: string): string[] =>
    value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const emptyEducation = (): EducationItem => ({
    level: "undergraduate",
    degree: "",
    fieldOfStudy: "",
    institution: "",
    grade: "",
    currentlyStudying: false,
});

const emptyExperience = (): ExperienceItem => ({
    jobTitle: "",
    company: "",
    employmentType: "full_time",
    location: "",
    currentlyWorking: false,
    description: "",
    skillsUsed: [],
});

const emptyProject = (): ProjectItem => ({
    title: "",
    description: "",
    technologies: [],
    projectUrl: "",
    githubUrl: "",
});

const emptyOpening = (): RecruiterOpening => ({
    title: "",
    department: "",
    employmentType: "full_time",
    locationType: "onsite",
    locations: [],
    minExperienceYears: 0,
    maxExperienceYears: 0,
    skillsRequired: [],
    salaryRange: { currency: "INR", min: 0, max: 0 },
    description: "",
    isHiring: true,
});

export default function OnboardingPage() {
    usePageTitle("Onboarding");
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useUserStore((state) => state.user);
    const UStore = useUserStore((state) => state.UStore);

    const [activeStep, setActiveStep] = useState(0);
    const [role, setRole] = useState<OnboardingRole>("student");

    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [stateName, setStateName] = useState("");

    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [experienceLevel, setExperienceLevel] = useState<"fresher" | "junior" | "mid" | "senior" | "lead">("fresher");
    const [skillsInput, setSkillsInput] = useState("");
    const [preferredLocationsInput, setPreferredLocationsInput] = useState("");
    const [targetRolesInput, setTargetRolesInput] = useState("");
    const [openToWork, setOpenToWork] = useState(true);
    const [openToRelocation, setOpenToRelocation] = useState(false);

    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companySize, setCompanySize] = useState<"1-10" | "11-50" | "51-200" | "201-500" | "500+">("1-10");
    const [industry, setIndustry] = useState("");
    const [designation, setDesignation] = useState("");
    const [companyLocation, setCompanyLocation] = useState("");

    const [educations, setEducations] = useState<EducationItem[]>([emptyEducation()]);
    const [experiences, setExperiences] = useState<ExperienceItem[]>([emptyExperience()]);
    const [projects, setProjects] = useState<ProjectItem[]>([emptyProject()]);
    const [achievements, setAchievements] = useState<Array<{ title?: string; description?: string }>>([{ title: "", description: "" }]);
    const [openings, setOpenings] = useState<RecruiterOpening[]>([emptyOpening()]);

    const [linkedin, setLinkedin] = useState("");
    const [github, setGithub] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [profileVisibility, setProfileVisibility] = useState<"public" | "private" | "connections_only">("public");
    const [showPhone, setShowPhone] = useState(false);
    const [showEmail, setShowEmail] = useState(false);

    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [videoResumeFile, setVideoResumeFile] = useState<File | null>(null);

    const onboardingQuery = useQuery({
        queryKey: ["onboarding-me"],
        queryFn: () => onboardingApi.getMe(),
        enabled: Boolean(user && user.role === "user"),
    });

    const onboardingData = onboardingQuery.data?.data?.data;

    useEffect(() => {
        if (!user || user.role !== "user") {
            navigate(getDashboardRoute(user?.role), { replace: true });
            return;
        }
        if (user.onboardingCompleted) {
            navigate(getDashboardRoute(user.role), { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!onboardingData) return;

        if (onboardingData.meta?.onboardingCompleted) {
            Promise.resolve(UStore("user.onboardingCompleted", true)).then(() => {
                navigate(getDashboardRoute(user?.role), { replace: true });
            });
            return;
        }

        setRole(onboardingData.role ?? "student");
        setPhone(onboardingData.basicInfo?.phone ?? "");
        setCountry(onboardingData.basicInfo?.location?.country ?? "");
        setCity(onboardingData.basicInfo?.location?.city ?? "");
        setStateName(onboardingData.basicInfo?.location?.state ?? "");

        setHeadline(onboardingData.professionalInfo?.headline ?? "");
        setBio(onboardingData.professionalInfo?.bio ?? "");
        setExperienceLevel(onboardingData.professionalInfo?.experienceLevel ?? "fresher");
        setSkillsInput((onboardingData.professionalInfo?.skills ?? []).map((item) => item.name).filter(Boolean).join(", "));
        setPreferredLocationsInput((onboardingData.preferences?.preferredLocations ?? []).join(", "));
        setTargetRolesInput((onboardingData.preferences?.targetRoles ?? []).join(", "));
        setOpenToWork(Boolean(onboardingData.professionalInfo?.openToWork));
        setOpenToRelocation(Boolean(onboardingData.professionalInfo?.openToRelocation));

        setCompanyName(onboardingData.recruiterInfo?.companyName ?? "");
        setCompanyWebsite(onboardingData.recruiterInfo?.companyWebsite ?? "");
        setCompanySize(onboardingData.recruiterInfo?.companySize ?? "1-10");
        setIndustry(onboardingData.recruiterInfo?.industry ?? "");
        setDesignation(onboardingData.recruiterInfo?.designation ?? "");
        setCompanyLocation(onboardingData.recruiterInfo?.companyLocation ?? "");

        setEducations(onboardingData.education?.length ? onboardingData.education : [emptyEducation()]);
        setExperiences(onboardingData.experience?.length ? onboardingData.experience : [emptyExperience()]);
        setProjects(onboardingData.projects?.length ? onboardingData.projects : [emptyProject()]);
        setAchievements(onboardingData.achievements?.length ? onboardingData.achievements : [{ title: "", description: "" }]);
        setOpenings(onboardingData.recruiterInfo?.openings?.length ? onboardingData.recruiterInfo.openings : [emptyOpening()]);

        setLinkedin(onboardingData.socialLinks?.linkedin ?? "");
        setGithub(onboardingData.socialLinks?.github ?? "");
        setPortfolioUrl(onboardingData.documents?.portfolioUrl ?? "");
        setProfileVisibility(onboardingData.privacySettings?.profileVisibility ?? "public");
        setShowPhone(Boolean(onboardingData.privacySettings?.showPhone));
        setShowEmail(Boolean(onboardingData.privacySettings?.showEmail));
    }, [onboardingData, UStore, navigate, user?.role]);

    const uploadMutation = useMutation({
        mutationFn: (formData: FormData) => onboardingApi.uploadAssets(formData),
    });

    const saveStepMutation = useMutation({
        mutationFn: ({ step, data }: { step: string; data: unknown }) => onboardingApi.saveStep(step, data),
    });

    const completeMutation = useMutation({
        mutationFn: () => onboardingApi.complete(),
    });

    const isBusy = onboardingQuery.isLoading || uploadMutation.isPending || saveStepMutation.isPending || completeMutation.isPending;

    const uploadSelectedFiles = async (): Promise<void> => {
        if (!profilePhotoFile && !resumeFile && !videoResumeFile) return;
        const formData = new FormData();
        if (profilePhotoFile) formData.append("profilePhoto", profilePhotoFile);
        if (resumeFile) formData.append("resume", resumeFile);
        if (videoResumeFile) formData.append("videoResume", videoResumeFile);
        await uploadMutation.mutateAsync(formData);
        setProfilePhotoFile(null);
        setResumeFile(null);
        setVideoResumeFile(null);
    };

    const saveCurrentStep = async (): Promise<void> => {
        if (activeStep === 0) {
            await uploadSelectedFiles();
            await saveStepMutation.mutateAsync({ step: "role", data: { role } });
            await saveStepMutation.mutateAsync({
                step: "basicInfo",
                data: {
                    phone,
                    location: {
                        country,
                        state: stateName,
                        city,
                    },
                },
            });
            return;
        }

        if (activeStep === 1) {
            if (role === "student") {
                await saveStepMutation.mutateAsync({ step: "education", data: educations });
                await saveStepMutation.mutateAsync({
                    step: "preferences",
                    data: { targetRoles: parseCSV(targetRolesInput), preferredLocations: parseCSV(preferredLocationsInput) },
                });
                return;
            }

            if (role === "job_seeker") {
                await saveStepMutation.mutateAsync({
                    step: "professionalInfo",
                    data: {
                        headline,
                        bio,
                        experienceLevel,
                        openToWork,
                        openToRelocation,
                        skills: parseCSV(skillsInput).map((name) => ({ name, level: "intermediate", yearsOfExperience: 0 })),
                    },
                });
                await saveStepMutation.mutateAsync({
                    step: "preferences",
                    data: {
                        targetRoles: parseCSV(targetRolesInput),
                        preferredLocations: parseCSV(preferredLocationsInput),
                    },
                });
                return;
            }

            await saveStepMutation.mutateAsync({
                step: "recruiterInfo",
                data: {
                    companyName,
                    companyWebsite,
                    companySize,
                    industry,
                    designation,
                    companyLocation,
                },
            });
            return;
        }

        if (activeStep === 2) {
            if (role === "student") {
                await saveStepMutation.mutateAsync({ step: "projects", data: projects });
                await saveStepMutation.mutateAsync({ step: "achievements", data: achievements });
                return;
            }

            if (role === "job_seeker") {
                await saveStepMutation.mutateAsync({ step: "education", data: educations });
                await saveStepMutation.mutateAsync({ step: "experience", data: experiences });
                await saveStepMutation.mutateAsync({ step: "projects", data: projects });
                return;
            }

            await saveStepMutation.mutateAsync({
                step: "recruiterInfo",
                data: {
                    companyName,
                    companyWebsite,
                    companySize,
                    industry,
                    designation,
                    companyLocation,
                    openings,
                },
            });
            return;
        }

        await uploadSelectedFiles();
        await saveStepMutation.mutateAsync({
            step: "documents",
            data: {
                portfolioUrl,
            },
        });
        await saveStepMutation.mutateAsync({
            step: "socialLinks",
            data: {
                linkedin,
                github,
            },
        });
        await saveStepMutation.mutateAsync({
            step: "privacySettings",
            data: {
                profileVisibility,
                showPhone,
                showEmail,
            },
        });
    };

    const handleNext = async () => {
        try {
            await saveCurrentStep();
            await queryClient.invalidateQueries({ queryKey: ["onboarding-me"] });

            if (activeStep < steps.length - 1) {
                setActiveStep((prev) => prev + 1);
                toast.success("Step saved");
                return;
            }

            await completeMutation.mutateAsync();
            await Promise.all([
                UStore("user.onboardingCompleted", true),
                queryClient.invalidateQueries({ queryKey: ["onboarding-me"] }),
            ]);
            toast.success("Onboarding completed");
            navigate(getDashboardRoute(user?.role), { replace: true });
        } catch (error: unknown) {
            const errorMessage =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : "Failed to save onboarding step";
            toast.error(errorMessage);
        }
    };

    const profileCompletion = onboardingData?.meta?.profileCompletion ?? 0;
    const title = useMemo(() => steps[activeStep]?.title ?? "Onboarding", [activeStep]);

    const updateEducation = (index: number, key: keyof EducationItem, value: string | boolean) => {
        setEducations((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
    };

    const updateExperience = (index: number, key: keyof ExperienceItem, value: string | boolean) => {
        setExperiences((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
    };

    const updateProject = (index: number, key: keyof ProjectItem, value: string) => {
        setProjects((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? {
                        ...item,
                        [key]: key === "technologies" ? parseCSV(value) : value,
                    }
                    : item
            )
        );
    };

    return (
        <div className="flex flex-1 flex-col p-6 gap-6 max-w-5xl mx-auto w-full">
            <div>
                <h1 className="text-2xl font-bold">Complete Your Onboarding</h1>
                <p className="text-muted-foreground text-sm mt-1">Role based setup for students, job seekers, and recruiters.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Step {activeStep + 1} of {steps.length}</CardDescription>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {steps.map((step) => (
                            <Badge key={step.id} variant={activeStep === step.id ? "default" : "secondary"}>
                                {step.id + 1}. {step.title}
                            </Badge>
                        ))}
                        <Badge variant="outline">Completion: {profileCompletion}%</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {activeStep === 0 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Role</Label>
                                <Select value={role} onValueChange={(value) => setRole(value as OnboardingRole)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                                        <SelectItem value="recruiter">Recruiter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>State</Label><Input value={stateName} onChange={(e) => setStateName(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                            <div className="space-y-1.5 md:col-span-2"><Label>Profile Photo</Label><Input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] ?? null)} /></div>
                        </div>
                    )}

                    {activeStep === 1 && role === "student" && (
                        <div className="space-y-4">
                            {educations.map((edu, idx) => (
                                <div key={idx} className="grid gap-3 md:grid-cols-2 rounded-md border p-3">
                                    <div className="space-y-1.5">
                                        <Label>Level</Label>
                                        <Select value={edu.level ?? "undergraduate"} onValueChange={(value) => updateEducation(idx, "level", value)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="school">School</SelectItem>
                                                <SelectItem value="high_school">High School</SelectItem>
                                                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                                                <SelectItem value="postgraduate">Postgraduate</SelectItem>
                                                <SelectItem value="diploma">Diploma</SelectItem>
                                                <SelectItem value="certification">Certification</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5"><Label>Class / Degree</Label><Input value={edu.degree ?? ""} onChange={(e) => updateEducation(idx, "degree", e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Institution</Label><Input value={edu.institution ?? ""} onChange={(e) => updateEducation(idx, "institution", e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Field of Study</Label><Input value={edu.fieldOfStudy ?? ""} onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)} /></div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <Button variant="outline" size="sm" onClick={() => setEducations((prev) => prev.filter((_, i) => i !== idx))} disabled={educations.length === 1}>Remove</Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={() => setEducations((prev) => [...prev, emptyEducation()])}>Add Education</Button>
                            <div className="space-y-1.5">
                                <Label>Target Roles (comma separated)</Label>
                                <Input value={targetRolesInput} onChange={(e) => setTargetRolesInput(e.target.value)} placeholder="Data Analyst, Software Engineer Intern" />
                            </div>
                        </div>
                    )}

                    {activeStep === 1 && role === "job_seeker" && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2"><Label>Headline</Label><Input value={headline} onChange={(e) => setHeadline(e.target.value)} /></div>
                            <div className="space-y-1.5 md:col-span-2"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} /></div>
                            <div className="space-y-1.5">
                                <Label>Experience Level</Label>
                                <Select value={experienceLevel} onValueChange={(value) => setExperienceLevel(value as typeof experienceLevel)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fresher">Fresher</SelectItem>
                                        <SelectItem value="junior">Junior</SelectItem>
                                        <SelectItem value="mid">Mid</SelectItem>
                                        <SelectItem value="senior">Senior</SelectItem>
                                        <SelectItem value="lead">Lead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Skills (comma separated)</Label><Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Preferred Locations</Label><Input value={preferredLocationsInput} onChange={(e) => setPreferredLocationsInput(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Target Roles</Label><Input value={targetRolesInput} onChange={(e) => setTargetRolesInput(e.target.value)} /></div>
                            <div className="flex items-center justify-between rounded-md border p-3"><Label htmlFor="openToWork">Open to Work</Label><Switch id="openToWork" checked={openToWork} onCheckedChange={setOpenToWork} /></div>
                            <div className="flex items-center justify-between rounded-md border p-3"><Label htmlFor="openToRelocation">Open to Relocation</Label><Switch id="openToRelocation" checked={openToRelocation} onCheckedChange={setOpenToRelocation} /></div>
                        </div>
                    )}

                    {activeStep === 1 && role === "recruiter" && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5"><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Company Website</Label><Input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} /></div>
                            <div className="space-y-1.5">
                                <Label>Company Size</Label>
                                <Select value={companySize} onValueChange={(value) => setCompanySize(value as typeof companySize)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10</SelectItem>
                                        <SelectItem value="11-50">11-50</SelectItem>
                                        <SelectItem value="51-200">51-200</SelectItem>
                                        <SelectItem value="201-500">201-500</SelectItem>
                                        <SelectItem value="500+">500+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Your Designation</Label><Input value={designation} onChange={(e) => setDesignation(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Company Location</Label><Input value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} /></div>
                        </div>
                    )}

                    {activeStep === 2 && role === "student" && (
                        <div className="space-y-4">
                            {projects.map((project, idx) => (
                                <div key={idx} className="grid gap-3 md:grid-cols-2 rounded-md border p-3">
                                    <div className="space-y-1.5"><Label>Project Title</Label><Input value={project.title ?? ""} onChange={(e) => updateProject(idx, "title", e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Tech Stack</Label><Input value={(project.technologies ?? []).join(", ")} onChange={(e) => updateProject(idx, "technologies", e.target.value)} /></div>
                                    <div className="space-y-1.5 md:col-span-2"><Label>Description</Label><Textarea value={project.description ?? ""} onChange={(e) => updateProject(idx, "description", e.target.value)} /></div>
                                    <div className="md:col-span-2 flex justify-end"><Button variant="outline" size="sm" onClick={() => setProjects((prev) => prev.filter((_, i) => i !== idx))} disabled={projects.length === 1}>Remove</Button></div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={() => setProjects((prev) => [...prev, emptyProject()])}>Add Project</Button>
                        </div>
                    )}

                    {activeStep === 2 && role === "job_seeker" && (
                        <div className="space-y-4">
                            <p className="text-sm font-medium">Education</p>
                            {educations.map((edu, idx) => (
                                <div key={idx} className="grid gap-3 md:grid-cols-2 rounded-md border p-3">
                                    <div className="space-y-1.5"><Label>Degree</Label><Input value={edu.degree ?? ""} onChange={(e) => updateEducation(idx, "degree", e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Institution</Label><Input value={edu.institution ?? ""} onChange={(e) => updateEducation(idx, "institution", e.target.value)} /></div>
                                    <div className="space-y-1.5 md:col-span-2"><Label>Field of Study</Label><Input value={edu.fieldOfStudy ?? ""} onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)} /></div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={() => setEducations((prev) => [...prev, emptyEducation()])}>Add Education</Button>

                            <p className="text-sm font-medium">Experience</p>
                            {experiences.map((exp, idx) => (
                                <div key={idx} className="grid gap-3 md:grid-cols-2 rounded-md border p-3">
                                    <div className="space-y-1.5"><Label>Job Title</Label><Input value={exp.jobTitle ?? ""} onChange={(e) => updateExperience(idx, "jobTitle", e.target.value)} /></div>
                                    <div className="space-y-1.5"><Label>Company</Label><Input value={exp.company ?? ""} onChange={(e) => updateExperience(idx, "company", e.target.value)} /></div>
                                    <div className="space-y-1.5 md:col-span-2"><Label>Description</Label><Textarea value={exp.description ?? ""} onChange={(e) => updateExperience(idx, "description", e.target.value)} /></div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={() => setExperiences((prev) => [...prev, emptyExperience()])}>Add Experience</Button>
                        </div>
                    )}

                    {activeStep === 2 && role === "recruiter" && (
                        <div className="space-y-4">
                            {openings.map((opening, idx) => (
                                <div key={idx} className="grid gap-3 md:grid-cols-2 rounded-md border p-3">
                                    <div className="space-y-1.5"><Label>Opening Title</Label><Input value={opening.title ?? ""} onChange={(e) => setOpenings((prev) => prev.map((item, i) => i === idx ? { ...item, title: e.target.value } : item))} /></div>
                                    <div className="space-y-1.5"><Label>Department</Label><Input value={opening.department ?? ""} onChange={(e) => setOpenings((prev) => prev.map((item, i) => i === idx ? { ...item, department: e.target.value } : item))} /></div>
                                    <div className="space-y-1.5">
                                        <Label>Employment Type</Label>
                                        <Select value={opening.employmentType ?? "full_time"} onValueChange={(value) => setOpenings((prev) => prev.map((item, i) => i === idx ? { ...item, employmentType: value as RecruiterOpening["employmentType"] } : item))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full_time">Full Time</SelectItem>
                                                <SelectItem value="part_time">Part Time</SelectItem>
                                                <SelectItem value="internship">Internship</SelectItem>
                                                <SelectItem value="contract">Contract</SelectItem>
                                                <SelectItem value="freelance">Freelance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5"><Label>Locations (comma separated)</Label><Input value={(opening.locations ?? []).join(", ")} onChange={(e) => setOpenings((prev) => prev.map((item, i) => i === idx ? { ...item, locations: parseCSV(e.target.value) } : item))} /></div>
                                    <div className="space-y-1.5"><Label>Skills Required (comma separated)</Label><Input value={(opening.skillsRequired ?? []).join(", ")} onChange={(e) => setOpenings((prev) => prev.map((item, i) => i === idx ? { ...item, skillsRequired: parseCSV(e.target.value) } : item))} /></div>
                                    <div className="flex items-center justify-between rounded-md border p-3"><Label>Hiring Active</Label><Switch checked={opening.isHiring !== false} onCheckedChange={(checked) => setOpenings((prev) => prev.map((item, i) => i === idx ? { ...item, isHiring: checked } : item))} /></div>
                                    <div className="md:col-span-2 flex justify-end"><Button variant="outline" size="sm" onClick={() => setOpenings((prev) => prev.filter((_, i) => i !== idx))} disabled={openings.length === 1}>Remove</Button></div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={() => setOpenings((prev) => [...prev, emptyOpening()])}>Add Opening</Button>
                        </div>
                    )}

                    {activeStep === 3 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {role !== "recruiter" && (
                                <>
                                    <div className="space-y-1.5"><Label>Resume Upload</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} /></div>
                                    <div className="space-y-1.5"><Label>Video Resume Upload</Label><Input type="file" accept="video/*" onChange={(e) => setVideoResumeFile(e.target.files?.[0] ?? null)} /></div>
                                </>
                            )}
                            <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>GitHub</Label><Input value={github} onChange={(e) => setGithub(e.target.value)} /></div>
                            <div className="space-y-1.5 md:col-span-2"><Label>Portfolio URL</Label><Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} /></div>
                            <div className="space-y-1.5">
                                <Label>Profile Visibility</Label>
                                <Select value={profileVisibility} onValueChange={(value) => setProfileVisibility(value as typeof profileVisibility)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="connections_only">Connections only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-3"><Label htmlFor="showPhone">Show Phone</Label><Switch id="showPhone" checked={showPhone} onCheckedChange={setShowPhone} /></div>
                            <div className="flex items-center justify-between rounded-md border p-3"><Label htmlFor="showEmail">Show Email</Label><Switch id="showEmail" checked={showEmail} onCheckedChange={setShowEmail} /></div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <Button variant="outline" disabled={activeStep === 0 || isBusy} onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}>Back</Button>
                        <Button disabled={isBusy} onClick={handleNext}>{isBusy ? "Saving..." : activeStep === steps.length - 1 ? "Finish" : "Save & Continue"}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
