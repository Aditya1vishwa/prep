import { Schema, model, Document, Types } from "mongoose";
import jwt from "jsonwebtoken";
import {
    UserRole,
    USER_ROLE_VALUES,
    UserStatus,
    USER_STATUS_VALUES,
} from "../../../constant/dbConstant.js";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: {
        url?: string;
        path?: string;
        name?: string;
    };
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    lastLogin?: Date;
    defaultWorkspace?: Types.ObjectId;
    refreshToken?: string;
    forgetPasswordToken?: string;
    forgetPasswordTokenExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Methods
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        phone: {
            type: String,
            trim: true,
            match: [/^\+?[\d\s\-()]{7,20}$/, "Please provide a valid phone number"],
        },
        avatar: {
            url: { type: String },
            path: { type: String },
            name: { type: String },
        },
        role: {
            type: String,
            enum: USER_ROLE_VALUES,
            default: "user",
        },
        status: {
            type: String,
            enum: USER_STATUS_VALUES,
            default: "active",
            index: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            type: Date,
        },
        defaultWorkspace: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
        },
        refreshToken: {
            type: String,
            select: false,
        },
        forgetPasswordToken: {
            type: String,
            select: false,
        },
        forgetPasswordTokenExpiry: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ email: 1, status: 1 });

// ─── Methods ──────────────────────────────────────────────────────────────────

userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: (process.env.JWT_ACCESS_EXPIRY || "15m") as jwt.SignOptions["expiresIn"] }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRY || "7d") as jwt.SignOptions["expiresIn"] }
    );
};

// ─── Model ────────────────────────────────────────────────────────────────────

const User = model<IUser>("User", userSchema);
export default User;
