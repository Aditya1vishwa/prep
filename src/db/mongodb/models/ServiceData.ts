import { Schema, model, Document } from "mongoose";

export interface IServiceData extends Document {
    key: string;
    value: Record<string, any>;
    accessTo: "default" | "user" | "admin";
    createdAt: Date;
    updatedAt: Date;
}

const serviceDataSchema = new Schema<IServiceData>(
    {
        key: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
            default: {},
        },
        accessTo: {
            type: String,
            enum: ["default", "user", "admin"],
            default: "default",
            index: true,
        },
    },
    { timestamps: true }
);

const ServiceData = model<IServiceData>("ServiceData", serviceDataSchema);
export default ServiceData;
