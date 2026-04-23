import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import FestivalModule from "../../../models/FestivalModule";
import { cache } from "../../../utils/cache";


/**
 * Create a new Festival Module
 */
export const createFestivalModule = asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        festivalTitle,
        festivalSubtitle,
        headerGraphic,
        layoutStyle,
        categoryTiles,
        headerCategorySlug,
        startDate,
        endDate,
        isActive = true,
        order = 0,
    } = req.body;

    // Validation
    if (!name || !festivalTitle || !categoryTiles || !headerCategorySlug || !startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: "All required fields must be provided",
        });
    }

    if (categoryTiles.length !== 4) {
        return res.status(400).json({
            success: false,
            message: "Exactly 4 category tiles are required",
        });
    }


    const festivalModule = await FestivalModule.create({
        name,
        festivalTitle,
        festivalSubtitle,
        headerGraphic,
        layoutStyle,
        categoryTiles,
        headerCategorySlug: headerCategorySlug.toLowerCase(),
        startDate,
        endDate,
        isActive,
        order,
    });

    // Invalidate home content cache
    cache.delete(`home-content-${headerCategorySlug.toLowerCase()}-0-0`);

    return res.status(201).json({
        success: true,
        message: "Festival Module created successfully",
        data: festivalModule,
    });
});

/**
 * Get all Festival Modules
 */
export const getAllFestivalModules = asyncHandler(async (req: Request, res: Response) => {
    const { headerCategorySlug, isActive } = req.query;

    let query: any = {};
    if (headerCategorySlug) {
        query.headerCategorySlug = (headerCategorySlug as string).toLowerCase();
    }
    if (isActive !== undefined) {
        query.isActive = isActive === "true";
    }

    const modules = await FestivalModule.find(query)
        .populate("categoryTiles.categoryId", "name image slug")
        .populate("categoryTiles.subCategoryId", "name image slug")
        .sort({ order: 1, createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: modules,
    });
});

/**
 * Get Festival Module by ID
 */
export const getFestivalModuleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const festivalModule = await FestivalModule.findById(id)
        .populate("categoryTiles.categoryId", "name image slug")
        .populate("categoryTiles.subCategoryId", "name image slug");

    if (!festivalModule) {
        return res.status(404).json({
            success: false,
            message: "Festival Module not found",
        });
    }

    return res.status(200).json({
        success: true,
        data: festivalModule,
    });
});

/**
 * Update Festival Module
 */
export const updateFestivalModule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingModule = await FestivalModule.findById(id);
    if (!existingModule) {
        return res.status(404).json({
            success: false,
            message: "Festival Module not found",
        });
    }

    if (updateData.categoryTiles && updateData.categoryTiles.length !== 4) {
        return res.status(400).json({
            success: false,
            message: "Exactly 4 category tiles are required",
        });
    }


    const updatedModule = await FestivalModule.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    // Invalidate cache
    const slug = updatedModule?.headerCategorySlug || existingModule.headerCategorySlug;
    cache.delete(`home-content-${slug.toLowerCase()}-0-0`);

    return res.status(200).json({
        success: true,
        message: "Festival Module updated successfully",
        data: updatedModule,
    });
});

/**
 * Delete Festival Module
 */
export const deleteFestivalModule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const festivalModule = await FestivalModule.findById(id);
    if (!festivalModule) {
        return res.status(404).json({
            success: false,
            message: "Festival Module not found",
        });
    }

    await FestivalModule.findByIdAndDelete(id);

    // Invalidate cache
    cache.delete(`home-content-${festivalModule.headerCategorySlug.toLowerCase()}-0-0`);

    return res.status(200).json({
        success: true,
        message: "Festival Module deleted successfully",
    });
});

/**
 * Reorder Festival Modules
 */
export const reorderFestivalModules = asyncHandler(async (req: Request, res: Response) => {
    const { modules } = req.body; // Array of { id, order }

    if (!Array.isArray(modules)) {
        return res.status(400).json({
            success: false,
            message: "Modules must be an array",
        });
    }

    const updatePromises = modules.map(({ id, order }: { id: string; order: number }) => {
        return FestivalModule.findByIdAndUpdate(id, { order }, { new: true });
    });

    await Promise.all(updatePromises);

    return res.status(200).json({
        success: true,
        message: "Festival Modules reordered successfully",
    });
});
