import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    key: string;
    value: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        key: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        value: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = model<INotification>("Notification", notificationSchema);
export default Notification;
