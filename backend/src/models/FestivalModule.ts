import mongoose, { Schema, Document } from "mongoose";

export interface IFestivalModule extends Document {
    name: string;
    festivalTitle: string;
    festivalSubtitle?: string;
    headerGraphic?: string;
    desktopHeaderGraphic?: string;
    layoutStyle: "grid" | "horizontal";
    backgroundColor?: string;
    backgroundImage?: string;
    textColor?: string;
    labelColor?: string;
    categoryTiles: Array<{
        image: string;
        label?: string;
        categoryId: mongoose.Types.ObjectId;
        subCategoryId?: mongoose.Types.ObjectId;
    }>;
    headerCategorySlug: string; // "all", "grocery", etc.
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const FestivalModuleSchema = new Schema<IFestivalModule>(
    {
        name: {
            type: String,
            required: [true, "Module internal name is required"],
            trim: true,
        },
        festivalTitle: {
            type: String,
            required: [true, "Festival title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        festivalSubtitle: {
            type: String,
            trim: true,
            maxlength: [200, "Subtitle cannot exceed 200 characters"],
        },
        headerGraphic: {
            type: String, // URL to image (Mobile)
        },
        desktopHeaderGraphic: {
            type: String, // URL to image (Desktop/Landscape)
        },
        layoutStyle: {
            type: String,
            enum: ["grid", "horizontal"],
            default: "grid",
        },
        backgroundColor: {
            type: String,
            default: "#FFF9F0",
        },
        backgroundImage: {
            type: String,
        },
        textColor: {
            type: String,
            default: "#8B3D28",
        },
        labelColor: {
            type: String,
            default: "#8B3D28",
        },
        categoryTiles: [
            {
                image: { type: String, required: true },
                label: { type: String },
                categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
                subCategoryId: { type: Schema.Types.ObjectId, ref: "SubCategory" },
            },
        ],
        headerCategorySlug: {
            type: String,
            required: [true, "Header category slug is required"],
            default: "all",
            lowercase: true,
            trim: true,
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Validation to ensure exactly 4 tiles
FestivalModuleSchema.path("categoryTiles").validate(function (value) {
    return value.length === 4;
}, "Exactly 4 category tiles are required.");

// Indexes
FestivalModuleSchema.index({ headerCategorySlug: 1, isActive: 1, startDate: 1, endDate: 1 });
FestivalModuleSchema.index({ order: 1 });

const FestivalModule = mongoose.model<IFestivalModule>("FestivalModule", FestivalModuleSchema);

export default FestivalModule;
