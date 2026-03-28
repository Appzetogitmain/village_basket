import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../../../models/Product";
import Shop from "../../../models/Shop";
import Category from "../../../models/Category";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Create a new product
 */
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const productData = req.body;

    // Ensure sellerId matches authenticated seller
    if (productData.sellerId && productData.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You can only create products for your own account",
      });
    }

    // 2. Map fields to match Product model
    const newProductData: any = {
      ...productData,
      seller: sellerId, // Map sellerId to seller
      headerCategoryId: productData.headerCategoryId, // Map headerCategoryId
      category: productData.categoryId, // Map categoryId to category
      subcategory: productData.subcategoryId,
      brand: productData.brandId,
      mainImage: productData.mainImageUrl, // Map mainImageUrl to mainImage
      galleryImages: productData.galleryImageUrls,
    };

    // Map variations: Ensure 'title' from frontend is mapped to 'value' (or name) expected by Schema
    if (newProductData.variations) {
      newProductData.variations = newProductData.variations.map((v: any) => ({
        ...v,
        value: v.value || v.title, // Map title to value
        name: v.name || "Variation", // Default name
        retailPrice: Number(v.retailPrice),
        retailDiscPrice: Number(v.retailDiscPrice) || 0,
        wholesalePrice: Number(v.wholesalePrice),
        wholesaleDiscPrice: Number(v.wholesaleDiscPrice) || 0,
        status: v.status || "Available",
      }));
    }

    // 3. Set Price and Stock from Variations
    if (newProductData.variations && newProductData.variations.length > 0) {
      const firstVar = newProductData.variations[0];
      newProductData.retailPrice = firstVar.retailPrice;
      newProductData.retailDiscPrice = firstVar.retailDiscPrice || 0;
      newProductData.wholesalePrice = firstVar.wholesalePrice;
      newProductData.wholesaleDiscPrice = firstVar.wholesaleDiscPrice || 0;

      newProductData.stock = newProductData.variations.reduce(
        (acc: number, curr: any) => acc + (parseInt(curr.stock) || 0),
        0
      );
    }

    // 4. Validate Price (Model requirement)
    if (newProductData.retailPrice === undefined || newProductData.retailPrice === null) {
      return res.status(400).json({
        success: false,
        message: "Product retail price is required (add at least one variation)",
      });
    }

    // 5. Clean up undefined fields
    if (!newProductData.headerCategoryId)
      delete newProductData.headerCategoryId;
    if (!newProductData.subcategory) delete newProductData.subcategory;
    if (!newProductData.brand) delete newProductData.brand;

    // Handle Tax: Frontend sends taxId, Model expects 'tax' (string) or something else?
    // Checking SellerAddProduct.tsx sending taxId -> formData.tax
    // Model Product.ts -> tax: { type: String }
    // Ideally we should store the Tax ID or Name. Since frontend sends ID, let's map it.
    if (productData.taxId) {
      newProductData.tax = productData.taxId;
    }

    // Validate variation prices
    for (const variation of productData.variations) {
      if (Number(variation.retailDiscPrice) > Number(variation.retailPrice)) {
        return res.status(400).json({
          success: false,
          message: `Retail Discounted price (${variation.retailDiscPrice}) cannot be greater than retail price (${variation.retailPrice}) for variation ${variation.title}`,
        });
      }
      if (Number(variation.wholesaleDiscPrice) > Number(variation.wholesalePrice)) {
        return res.status(400).json({
          success: false,
          message: `Wholesale Discounted price (${variation.wholesaleDiscPrice}) cannot be greater than wholesale price (${variation.wholesalePrice}) for variation ${variation.title}`,
        });
      }
    }

    // 6. Set product status - All products are published automatically without approval
    newProductData.publish = true;
    newProductData.status = "Active";
    newProductData.requiresApproval = false;

    // Set default values for other required fields if not provided
    if (!newProductData.popular) newProductData.popular = false;
    if (!newProductData.dealOfDay) newProductData.dealOfDay = false;
    if (!newProductData.isReturnable) newProductData.isReturnable = false;
    if (!newProductData.rating) newProductData.rating = 0;
    if (!newProductData.reviewsCount) newProductData.reviewsCount = 0;
    if (!newProductData.discount) newProductData.discount = 0;
    if (!newProductData.tags) newProductData.tags = [];

    // Handle Shop by Store fields
    if (productData.isShopByStoreOnly !== undefined) {
      newProductData.isShopByStoreOnly = productData.isShopByStoreOnly === true || productData.isShopByStoreOnly === "true";
    }
    if (productData.shopId) {
      newProductData.shopId = productData.shopId;
    } else if (newProductData.isShopByStoreOnly) {
      // If shop by store only is true but no shopId provided, set to null
      newProductData.shopId = null;
    }

    const product = await Product.create(newProductData);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }
);

/**
 * Get seller's products with filters
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const {
    search,
    category,
    status,
    stock,
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query: any = {};
  if ((req as any).user?.userType !== "Admin") {
    query.seller = sellerId;
  }

  // Search filter
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { smallDescription: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search as string, "i")] } },
    ];
  }

  // Category filter
  if (category && category !== "All Category") {
    if (mongoose.Types.ObjectId.isValid(category as string)) {
      query.category = category;
    } else {
      // Find category by name
      try {
        const foundCategory = await Category.findOne({ name: { $regex: category as string, $options: "i" } });
        if (foundCategory) {
          query.category = foundCategory._id;
        } else {
          // If not found, return empty results as name doesn't exist
          query.category = new mongoose.Types.ObjectId();
        }
      } catch (e) {
         // Silently fail search if regex is invalid or other error
         query.category = new mongoose.Types.ObjectId();
      }
    }
  }

  // Status filter (publish, popular, dealOfDay)
  if (status) {
    if (status === "published") {
      query.publish = true;
    } else if (status === "unpublished") {
      query.publish = false;
    } else if (status === "popular") {
      query.popular = true;
    } else if (status === "dealOfDay") {
      query.dealOfDay = true;
    }
  }

  // Stock filter
  if (stock === "inStock") {
    query["variations.stock"] = { $gt: 0 };
  } else if (stock === "outOfStock") {
    query["variations.stock"] = 0;
    query["variations.status"] = "Sold out";
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort: any = {};
  sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

  const products = await Product.find(query)
    .populate("category", "name")
    .populate("subcategory", "name")
    .populate("brand", "name")
    .populate("tax", "name percentage")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments(query);

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get product by ID
 */
export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    // Prevent reserved route names from being treated as product IDs
    const reservedRoutes = ["shops", "brands"];
    if (reservedRoutes.includes(id)) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const query: any = { _id: id };
    if ((req as any).user?.userType !== "Admin") {
      query.seller = sellerId;
    }

    const product = await Product.findOne(query)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("headerCategoryId", "name slug")
      .populate("brand", "name")
      .populate("tax", "name percentage");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  }
);

/**
 * Update product
 */
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const updateData = req.body;

    console.log("DEBUG updateProduct: sellerId from token:", sellerId);
    console.log("DEBUG updateProduct: productId:", id);

    // Remove sellerId from update data if present (cannot change owner)
    delete updateData.sellerId;

    // Map frontend field names to model field names (same as createProduct)
    if (updateData.headerCategoryId !== undefined) {
      // Allow null/empty to clear header category
      updateData.headerCategoryId = updateData.headerCategoryId || null;
    }
    if (updateData.categoryId) {
      updateData.category = updateData.categoryId;
      delete updateData.categoryId;
    }
    if (updateData.subcategoryId) {
      updateData.subcategory = updateData.subcategoryId;
      delete updateData.subcategoryId;
    }
    if (updateData.brandId) {
      updateData.brand = updateData.brandId;
      delete updateData.brandId;
    }
    if (updateData.taxId) {
      updateData.tax = updateData.taxId;
      delete updateData.taxId;
    }
    if (updateData.mainImageUrl) {
      updateData.mainImage = updateData.mainImageUrl;
      delete updateData.mainImageUrl;
    }
    if (updateData.galleryImageUrls) {
      updateData.galleryImages = updateData.galleryImageUrls;
      delete updateData.galleryImageUrls;
    }

    // Validate variations if provided
    if (updateData.variations) {
      if (updateData.variations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Product must have at least one variation",
        });
      }

      // Map variations and validate prices
      updateData.variations = updateData.variations.map((v: any) => ({
        ...v,
        value: v.value || v.title,
        name: v.name || "Variation",
        retailPrice: Number(v.retailPrice),
        retailDiscPrice: Number(v.retailDiscPrice) || 0,
        wholesalePrice: Number(v.wholesalePrice),
        wholesaleDiscPrice: Number(v.wholesaleDiscPrice) || 0,
        status: v.status || "Available",
      }));

      for (const variation of updateData.variations) {
        if (Number(variation.retailDiscPrice) > Number(variation.retailPrice)) {
          return res.status(400).json({
            success: false,
            message: `Retail Discounted price cannot be greater than retail price for variation ${variation.title || variation.value}`,
          });
        }
        if (Number(variation.wholesaleDiscPrice) > Number(variation.wholesalePrice)) {
          return res.status(400).json({
            success: false,
            message: `Wholesale Discounted price cannot be greater than wholesale price for variation ${variation.title || variation.value}`,
          });
        }
      }

      // Sync top-level price and stock from variations (same as createProduct)
      const firstVar = updateData.variations[0];
      updateData.retailPrice = firstVar.retailPrice;
      updateData.retailDiscPrice = firstVar.retailDiscPrice || 0;
      updateData.wholesalePrice = firstVar.wholesalePrice;
      updateData.wholesaleDiscPrice = firstVar.wholesaleDiscPrice || 0;
      
      updateData.stock = updateData.variations.reduce(
        (acc: number, curr: any) => acc + (parseInt(curr.stock) || 0),
        0
      );
    }

    // Handle Shop by Store fields
    if (updateData.isShopByStoreOnly !== undefined) {
      updateData.isShopByStoreOnly = updateData.isShopByStoreOnly === true || updateData.isShopByStoreOnly === "true";
    }
    if (updateData.shopId !== undefined) {
      // Allow null to clear shopId
      updateData.shopId = updateData.shopId || null;
    } else if (updateData.isShopByStoreOnly === false) {
      // If shop by store only is false, clear shopId
      updateData.shopId = null;
    }

    // Use findOne and then save to trigger pre-save hooks
    const query: any = { _id: id };
    if ((req as any).user?.userType !== "Admin") {
      query.seller = sellerId;
    }
    const product = await Product.findOne(query);

    if (!product) {
      // Check if product exists at all
      const existingProduct = await Product.findById(id).select("seller");
      if (existingProduct) {
        console.log(
          "DEBUG updateProduct: product exists but owned by:",
          existingProduct.seller
        );
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Apply updates
    Object.assign(product, updateData);

    // If variations were updated, mark as modified
    if (updateData.variations) {
      product.markModified("variations");
    }

    await product.save();

    // Re-populate for response
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("headerCategoryId", "name slug")
      .populate("brand", "name")
      .populate("tax", "name percentage");

    console.log("DEBUG updateProduct: product updated successfully");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: populatedProduct,
    });
  }
);

/**
 * Delete product
 */
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    console.log("DEBUG deleteProduct: sellerId from token:", sellerId);
    console.log("DEBUG deleteProduct: productId:", id);

    const query: any = { _id: id };
    if ((req as any).user?.userType !== "Admin") {
      query.seller = sellerId;
    }

    const product = await Product.findOneAndDelete(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }
);

/**
 * Update stock for a product variation
 */
export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const { id, variationId } = req.params;
  const { stock, status } = req.body;

  const query: any = { _id: id };
  if ((req as any).user?.userType !== "Admin") {
    query.seller = sellerId;
  }
  const product = await Product.findOne(query);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const variation: any = product.variations?.find(
    (v: any) => v._id?.toString() === variationId
  );
  if (!variation) {
    return res.status(404).json({
      success: false,
      message: "Variation not found",
    });
  }

  if (stock !== undefined) {
    variation.stock = stock;
    // Automatically update status based on stock
    if (stock === 0) {
      variation.status = "Sold out";
    } else if (stock > 0 && variation.status === "Sold out") {
      variation.status = "Available";
    }
  }
  if (status) {
    variation.status = status;
  }

  // Mark variations as modified since we updated a sub-document field
  product.markModified("variations");
  await product.save();

  return res.status(200).json({
    success: true,
    message: "Stock updated successfully",
    data: product,
  });
});

/**
 * Update product status (publish, popular, dealOfDay)
 */
export const updateProductStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const { publish, popular, dealOfDay } = req.body;

    const updateData: any = {};
    if (publish !== undefined) updateData.publish = publish;
    if (popular !== undefined) updateData.popular = popular;
    if (dealOfDay !== undefined) updateData.dealOfDay = dealOfDay;

    const query: any = { _id: id };
    if ((req as any).user?.userType !== "Admin") {
      query.seller = sellerId;
    }

    const product = await Product.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      data: product,
    });
  }
);

/**
 * Bulk update stock for multiple products/variations
 */
export const bulkUpdateStock = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { updates } = req.body; // Array of { productId, variationId, stock }

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "Updates must be an array",
      });
    }

    const results = [];
    for (const update of updates) {
      const { productId, variationId, stock } = update;

      const query: any = { _id: productId };
      if ((req as any).user?.userType !== "Admin") {
        query.seller = sellerId;
      }
      const product = await Product.findOne(query);
      if (product) {
        const variation: any = product.variations?.find(
          (v: any) => v._id?.toString() === variationId
        );
        if (variation) {
          variation.stock = stock;
          if (stock === 0) variation.status = "Sold out";
          else if (stock > 0 && variation.status === "Sold out")
            variation.status = "In stock";

          await product.save();
          results.push({ productId, variationId, success: true });
        } else {
          results.push({
            productId,
            variationId,
            success: false,
            message: "Variation not found",
          });
        }
      } else {
        results.push({
          productId,
          variationId,
          success: false,
          message: "Product not found",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk stock update processed",
      data: results,
    });
  }
);

/**
 * Get all active shops (for seller to select when creating shop-by-store-only products)
 */
export const getShops = asyncHandler(async (_req: Request, res: Response) => {
  const shops = await Shop.find({ isActive: true })
    .select("_id name storeId image")
    .sort({ order: 1, name: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Shops fetched successfully",
    data: shops || [],
  });
});
