import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate configuration
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn("⚠️  Cloudinary credentials not found in environment variables");
}

export default cloudinary;

// Folder structure constants
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: "village_basket/products",
  PRODUCT_GALLERY: "village_basket/products/gallery",
  CATEGORIES: "village_basket/categories",
  SUBCATEGORIES: "village_basket/subcategories",
  COUPONS: "village_basket/coupons",
  SELLERS: "village_basket/sellers",
  SELLER_PROFILE: "village_basket/sellers/profile",
  SELLER_DOCUMENTS: "village_basket/sellers/documents",
  DELIVERY: "village_basket/delivery",
  DELIVERY_DOCUMENTS: "village_basket/delivery/documents",
  STORES: "village_basket/stores",
  USERS: "village_basket/users",
} as const;
