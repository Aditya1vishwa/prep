export type OnboardingRole = "student" | "job_seeker" | "recruiter";

export interface EducationItem {
    level?: "school" | "high_school" | "undergraduate" | "postgraduate" | "diploma" | "certification";
    classLevel?: string;
    board?: string;
    degree?: string;
    fieldOfStudy?: string;
    institution?: string;
    grade?: string;
    startDate?: string;
    endDate?: string;
    currentlyStudying?: boolean;
    description?: string;
}

export interface ExperienceItem {
    jobTitle?: string;
    company?: string;
    employmentType?: "full_time" | "part_time" | "internship" | "freelance" | "contract";
    location?: string;
    startDate?: string;
    endDate?: string;
    currentlyWorking?: boolean;
    description?: string;
    skillsUsed?: string[];
}

export interface ProjectItem {
    title?: string;
    description?: string;
    technologies?: string[];
    teamSize?: number;
    roleInProject?: string;
    projectUrl?: string;
    githubUrl?: string;
    startDate?: string;
    endDate?: string;
}

export interface RecruiterOpening {
    title?: string;
    department?: string;
    employmentType?: "full_time" | "part_time" | "internship" | "freelance" | "contract";
    locationType?: "remote" | "onsite" | "hybrid";
    locations?: string[];
    minExperienceYears?: number;
    maxExperienceYears?: number;
    skillsRequired?: string[];
    salaryRange?: {
        currency?: string;
        min?: number;
        max?: number;
    };
    description?: string;
    applicationDeadline?: string;
    isHiring?: boolean;
}

export interface OnboardingData {
    _id?: string;
    userId?: string;
    role?: OnboardingRole;
    basicInfo?: {
        profilePhoto?: string;
        phone?: string;
        alternatePhone?: string;
        dateOfBirth?: string;
        gender?: "male" | "female" | "other" | "prefer_not_to_say";
        maritalStatus?: "single" | "married" | "other";
        nationality?: string;
        location?: {
            country?: string;
            state?: string;
            city?: string;
            pincode?: string;
            addressLine?: string;
        };
    };
    professionalInfo?: {
        headline?: string;
        bio?: string;
        experienceLevel?: "fresher" | "junior" | "mid" | "senior" | "lead";
        totalExperienceYears?: number;
        currentCTC?: {
            currency?: string;
            amount?: number;
        };
        noticePeriodDays?: number;
        openToWork?: boolean;
        openToRelocation?: boolean;
        skills?: Array<{
            name?: string;
            level?: "beginner" | "intermediate" | "advanced" | "expert";
            yearsOfExperience?: number;
        }>;
        certifications?: Array<{
            title?: string;
            issuer?: string;
            issueDate?: string;
            credentialId?: string;
            credentialUrl?: string;
        }>;
    };
    education?: EducationItem[];
    experience?: ExperienceItem[];
    projects?: ProjectItem[];
    achievements?: Array<{
        title?: string;
        description?: string;
        date?: string;
    }>;
    preferences?: {
        jobType?: string[];
        employmentType?: string[];
        preferredLocations?: string[];
        targetRoles?: string[];
        expectedSalary?: {
            currency?: string;
            min?: number;
            max?: number;
        };
        shiftPreference?: "day" | "night" | "flexible";
    };
    documents?: {
        resumeUrl?: string;
        resumeParsedData?: Record<string, unknown>;
        portfolioUrl?: string;
        videoResumeUrl?: string;
    };
    socialLinks?: {
        linkedin?: string;
        github?: string;
        leetcode?: string;
        twitter?: string;
        portfolio?: string;
    };
    recruiterInfo?: {
        companyName?: string;
        companyWebsite?: string;
        companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
        industry?: string;
        designation?: string;
        companyLocation?: string;
        openings?: RecruiterOpening[];
    };
    privacySettings?: {
        profileVisibility?: "public" | "private" | "connections_only";
        showPhone?: boolean;
        showEmail?: boolean;
    };
    analytics?: {
        profileViews?: number;
        searchAppearances?: number;
    };
    meta?: {
        profileCompletion?: number;
        isVerified?: boolean;
        onboardingCompleted?: boolean;
    };
    createdAt?: string;
    updatedAt?: string;
}
