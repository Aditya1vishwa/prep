import { Schema, model, Document, Types } from "mongoose";
import { CreditType, CREDIT_TYPE_VALUES } from "../../../constant/dbConstant.js";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ICredit extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    amount: number;
    type: CreditType;
    creditAssign: number;
    creditUsed: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    expiryDate: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const creditSchema = new Schema<ICredit>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        creditAssign: {
            type: Number,
            required: [true, "creditAssign is required"],
            default: 0,
        },
        creditUsed: {
            type: Number,
            required: [true, "creditUsed is required"],
            default: 0,
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: CREDIT_TYPE_VALUES,
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, "Description cannot exceed 300 characters"],
        },
        expiryDate: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

creditSchema.index({ userId: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Credit = model<ICredit>("Credit", creditSchema);
export default Credit;
