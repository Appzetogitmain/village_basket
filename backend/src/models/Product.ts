import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  // Basic Info
  productName: string;
  smallDescription?: string;
  description?: string;

  // Categorization
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  subSubCategory?: mongoose.Types.ObjectId;
  headerCategoryId?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;

  // Seller Info
  seller: mongoose.Types.ObjectId;

  // Images
  mainImage?: string;
  galleryImages: string[];

  // Pricing & Inventory
  retailPrice: number;
  retailDiscPrice?: number;
  wholesalePrice: number;
  wholesaleDiscPrice?: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  barcode?: string;
  minWholesaleQuantity: number;



  // Variations
  variationType?: string; // e.g., 'Size', 'Color', 'Weight'
    variations?: Array<{
    name: string;
    value: string;
    retailPrice?: number;
    retailDiscPrice?: number;
    wholesalePrice?: number;
    wholesaleDiscPrice?: number;
    minWholesaleQuantity?: number;
    stock?: number;
    sku?: string;
    status?: string;
  }>;

  // Status Flags
  publish: boolean;
  popular: boolean;
  dealOfDay: boolean;
  status: "Active" | "Inactive" | "Pending" | "Rejected";

  // Product Details
  manufacturer?: string;
  madeIn?: string;
  tax?: mongoose.Types.ObjectId;
  fssaiLicNo?: string;
  totalAllowedQuantity?: number;

  // Return Policy
  isReturnable: boolean;
  maxReturnDays?: number;

  // SEO
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  seoImageAlt?: string;

  // Details
  pack?: string;
  shelfLife?: string;
  marketer?: string;

  // Ratings
  rating: number;
  reviewsCount: number;
  discount: number; // Calculated percentage

  returnPolicyText?: string;

  // Tags
  tags: string[];

  // Approval
  requiresApproval: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;

  // Commission
  commission?: number;

  // Shop by Store
  isShopByStoreOnly?: boolean;
  shopId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    // Basic Info
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    smallDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Categorization
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [
        function (this: any) {
          return !this.isShopByStoreOnly;
        },
        "Category is required",
      ],
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    subSubCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    headerCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "HeaderCategory",
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
    },

    // Seller Info
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
    },

    // Images
    mainImage: {
      type: String,
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },

    // Pricing & Inventory
    retailPrice: {
      type: Number,
      required: [true, "Retail price is required"],
      min: [0, "Retail price cannot be negative"],
    },
    retailDiscPrice: {
      type: Number,
      default: 0,
      min: [0, "Retail discounted price cannot be negative"],
    },
    wholesalePrice: {
      type: Number,
      required: [true, "Wholesale price is required"],
      min: [0, "Wholesale price cannot be negative"],
    },
    wholesaleDiscPrice: {
      type: Number,
      default: 0,
      min: [0, "Wholesale discounted price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare at price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    minWholesaleQuantity: {
      type: Number,
      default: 1,
      min: [1, "Minimum wholesale quantity cannot be less than 1"],
    },



    // Variations
    variationType: {
      type: String,
      trim: true,
    },
    variations: {
      type: [
        {
          name: String,
          value: String,
          retailPrice: Number,
          retailDiscPrice: { type: Number, default: 0 },
          wholesalePrice: Number,
          wholesaleDiscPrice: { type: Number, default: 0 },
          minWholesaleQuantity: { type: Number, default: 1 },
          stock: Number,
          status: {
            type: String,
            enum: ["Available", "Sold out", "In stock"],
            default: "Available",
          },
          sku: String,
        },
      ],
      default: [],
    },

    // Status Flags
    publish: {
      type: Boolean,
      default: true,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    dealOfDay: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Rejected"],
      default: "Active",
    },

    // Product Details
    manufacturer: {
      type: String,
      trim: true,
    },
    madeIn: {
      type: String,
      trim: true,
    },
    tax: {
      type: Schema.Types.ObjectId,
      ref: "Tax",
      trim: true,
    },
    fssaiLicNo: {
      type: String,
      trim: true,
    },
    totalAllowedQuantity: {
      type: Number,
      min: [0, "Total allowed quantity cannot be negative"],
    },

    // Return Policy
    isReturnable: {
      type: Boolean,
      default: false,
    },
    maxReturnDays: {
      type: Number,
      min: [0, "Max return days cannot be negative"],
    },

    // SEO
    seoTitle: {
      type: String,
      trim: true,
    },
    seoKeywords: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    seoImageAlt: {
      type: String,
      trim: true,
    },

    // Details
    pack: { type: String, trim: true },
    shelfLife: { type: String, trim: true },
    marketer: { type: String, trim: true },

    // Ratings
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },

    returnPolicyText: { type: String, trim: true },

    // Tags
    tags: {
      type: [String],
      default: [],
    },

    // Approval (removed - all products are auto-published)
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    approvedAt: {
      type: Date,
    },

    // Commission
    commission: {
      type: Number,
      min: [0, "Commission cannot be negative"],
    },

    // Shop by Store
    isShopByStoreOnly: {
      type: Boolean,
      default: false,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for mrp (alias for compareAtPrice to match frontend)
ProductSchema.virtual("mrp").get(function () {
  return this.compareAtPrice;
});

// Calculate discount and sync stock/price from variations before saving
ProductSchema.pre("save", function (next) {
  // Sync price and stock from variations if they exist
  if (this.variations && this.variations.length > 0) {
    const firstVariation = this.variations[0];
    
    if (firstVariation.retailPrice !== undefined) {
      this.retailPrice = firstVariation.retailPrice;
    }
    if (firstVariation.retailDiscPrice !== undefined) {
      this.retailDiscPrice = firstVariation.retailDiscPrice;
    }
    if (firstVariation.wholesalePrice !== undefined) {
      this.wholesalePrice = firstVariation.wholesalePrice;
    }
    if (firstVariation.wholesaleDiscPrice !== undefined) {
      this.wholesaleDiscPrice = firstVariation.wholesaleDiscPrice;
    }

    // Calculate total stock as sum of all variation stocks
    this.stock = this.variations.reduce(
      (acc: number, curr: any) => acc + (Number(curr.stock) || 0),
      0
    );
  }

  // Calculate generic discount percentage based on retail price for display consistency
  if (this.compareAtPrice && this.compareAtPrice > this.retailPrice) {
    this.discount = Math.round(
      ((this.compareAtPrice - this.retailPrice) / this.compareAtPrice) * 100
    );
  } else {
    this.discount = 0;
  }
  next();
});

// Indexes for faster queries
ProductSchema.index({ seller: 1, status: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ publish: 1 });
// Compound indexes for common queries
ProductSchema.index({ status: 1, publish: 1 }); // For getProducts
ProductSchema.index({ category: 1, status: 1, publish: 1 }); // For category products
ProductSchema.index({ subcategory: 1, status: 1, publish: 1 }); // For subcategory products
ProductSchema.index({
  productName: "text",
  smallDescription: "text",
  description: "text",
  tags: "text",
  pack: "text",
});

const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
