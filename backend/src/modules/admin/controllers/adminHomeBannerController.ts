import { Request, Response } from "express";
import HomeBanner from "../../../models/HomeBanner";
import mongoose from "mongoose";

// Get all home banners
export const getHomeBanners = async (_req: Request, res: Response) => {
    try {
        const banners = await HomeBanner.find()
            .populate("headerCategoryId", "name slug")
            .sort({ order: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: banners,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error fetching home banners",
            error: error.message,
        });
    }
};

// Get single home banner by ID
export const getHomeBannerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid banner ID",
            });
        }

        const banner = await HomeBanner.findById(id)
            .populate("headerCategoryId", "name slug")
            .lean();

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Home banner not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: banner,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error fetching home banner",
            error: error.message,
        });
    }
};

// Create new home banner
export const createHomeBanner = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, imageUrl, link, headerCategoryId, order, isActive } = req.body;

        // Validate required fields
        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required",
            });
        }

        // If no order specified, set it to the end
        let bannerOrder = order;
        if (bannerOrder === undefined || bannerOrder === null) {
            const maxOrderBanner = await HomeBanner.findOne().sort({ order: -1 }).lean();
            bannerOrder = maxOrderBanner ? maxOrderBanner.order + 1 : 0;
        }

        const newBanner = new HomeBanner({
            title,
            subtitle,
            imageUrl,
            link,
            headerCategoryId: headerCategoryId || undefined,
            order: bannerOrder,
            isActive: isActive !== undefined ? isActive : true,
        });

        await newBanner.save();

        const populatedBanner = await HomeBanner.findById(newBanner._id)
            .populate("headerCategoryId", "name slug")
            .lean();

        return res.status(201).json({
            success: true,
            message: "Home banner created successfully",
            data: populatedBanner,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error creating home banner",
            error: error.message,
        });
    }
};

// Update home banner
export const updateHomeBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, subtitle, imageUrl, link, headerCategoryId, order, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid banner ID",
            });
        }

        const banner = await HomeBanner.findById(id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Home banner not found",
            });
        }

        // Update fields
        if (title !== undefined) banner.title = title;
        if (subtitle !== undefined) banner.subtitle = subtitle;
        if (imageUrl !== undefined) banner.imageUrl = imageUrl;
        if (link !== undefined) banner.link = link;
        banner.headerCategoryId = headerCategoryId || undefined;
        if (order !== undefined) banner.order = order;
        if (isActive !== undefined) banner.isActive = isActive;

        await banner.save();

        const updatedBanner = await HomeBanner.findById(id)
            .populate("headerCategoryId", "name slug")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Home banner updated successfully",
            data: updatedBanner,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error updating home banner",
            error: error.message,
        });
    }
};

// Delete home banner
export const deleteHomeBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid banner ID",
            });
        }

        const banner = await HomeBanner.findByIdAndDelete(id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Home banner not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Home banner deleted successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error deleting home banner",
            error: error.message,
        });
    }
};

// Reorder home banners
export const reorderHomeBanners = async (req: Request, res: Response) => {
    try {
        const { banners } = req.body; // Array of { id, order }

        if (!Array.isArray(banners)) {
            return res.status(400).json({
                success: false,
                message: "Banners must be an array",
            });
        }

        // Update order for each banner
        const updatePromises = banners.map(({ id, order }: { id: string; order: number }) => {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`Invalid banner ID: ${id}`);
            }
            return HomeBanner.findByIdAndUpdate(id, { order }, { new: true });
        });

        await Promise.all(updatePromises);

        const updatedBanners = await HomeBanner.find()
            .populate("headerCategoryId", "name slug")
            .sort({ order: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: "Home banners reordered successfully",
            data: updatedBanners,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error reordering home banners",
            error: error.message,
        });
    }
};
