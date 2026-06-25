import mongoose, { Schema, Document } from "mongoose";

export interface IHomeBanner extends Document {
    title?: string;
    subtitle?: string;
    imageUrl: string;
    link?: string;
    headerCategoryId?: mongoose.Types.ObjectId;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HomeBannerSchema = new Schema<IHomeBanner>(
    {
        title: {
            type: String,
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        subtitle: {
            type: String,
            trim: true,
            maxlength: [200, "Subtitle cannot exceed 200 characters"],
        },
        imageUrl: {
            type: String,
            required: [true, "Image URL is required"],
            trim: true,
        },
        link: {
            type: String,
            trim: true,
        },
        headerCategoryId: {
            type: Schema.Types.ObjectId,
            ref: "HeaderCategory",
            required: false,
        },
        order: {
            type: Number,
            required: [true, "Display order is required"],
            default: 0,
            min: [0, "Order cannot be negative"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
HomeBannerSchema.index({ order: 1, isActive: 1 });
HomeBannerSchema.index({ isActive: 1 });
HomeBannerSchema.index({ headerCategoryId: 1 });

const HomeBanner = mongoose.model<IHomeBanner>("HomeBanner", HomeBannerSchema);

export default HomeBanner;
