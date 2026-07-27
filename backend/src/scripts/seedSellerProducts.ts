/**
 * Seed sample products for Village Seed Store (9111966732 / Indore)
 *
 * Run: npx tsx src/scripts/seedSellerProducts.ts
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import Seller from "../models/Seller";
import Product from "../models/Product";
import Category from "../models/Category";
import Inventory from "../models/Inventory";

const SELLER_MOBILE = "9111966732";

const PRODUCTS = [
  {
    productName: "Tomato (Tamatar)",
    categorySlug: "vegetables",
    pack: "500 g",
    retailPrice: 40,
    retailDiscPrice: 32,
    wholesalePrice: 28,
    stock: 100,
    popular: true,
    tags: ["vegetables", "fresh"],
  },
  {
    productName: "Onion (Pyaaz)",
    categorySlug: "vegetables",
    pack: "1 kg",
    retailPrice: 45,
    retailDiscPrice: 38,
    wholesalePrice: 32,
    stock: 120,
    popular: true,
    tags: ["vegetables", "fresh"],
  },
  {
    productName: "Potato (Aloo)",
    categorySlug: "vegetables",
    pack: "1 kg",
    retailPrice: 35,
    retailDiscPrice: 28,
    wholesalePrice: 24,
    stock: 150,
    popular: true,
    tags: ["vegetables", "fresh"],
  },
  {
    productName: "Green Chilli",
    categorySlug: "vegetables",
    pack: "250 g",
    retailPrice: 30,
    retailDiscPrice: 24,
    wholesalePrice: 20,
    stock: 80,
    tags: ["vegetables", "fresh"],
  },
  {
    productName: "Coriander Leaves",
    categorySlug: "vegetables",
    pack: "100 g",
    retailPrice: 20,
    retailDiscPrice: 15,
    wholesalePrice: 12,
    stock: 60,
    tags: ["vegetables", "leaves"],
  },
  {
    productName: "Banana (Kela)",
    categorySlug: "fruits",
    pack: "1 dozen",
    retailPrice: 60,
    retailDiscPrice: 50,
    wholesalePrice: 42,
    stock: 90,
    popular: true,
    tags: ["fruits", "fresh"],
  },
  {
    productName: "Apple (Seb)",
    categorySlug: "fruits",
    pack: "1 kg",
    retailPrice: 180,
    retailDiscPrice: 149,
    wholesalePrice: 130,
    stock: 70,
    popular: true,
    dealOfDay: true,
    tags: ["fruits", "fresh"],
  },
  {
    productName: "Orange (Santra)",
    categorySlug: "fruits",
    pack: "1 kg",
    retailPrice: 90,
    retailDiscPrice: 75,
    wholesalePrice: 65,
    stock: 85,
    tags: ["fruits", "fresh"],
  },
];

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI missing");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected:", mongoose.connection.name);

    const seller = await Seller.findOne({ mobile: SELLER_MOBILE });
    if (!seller) {
      console.error(`Seller with mobile ${SELLER_MOBILE} not found. Run seedOneSeller.ts first.`);
      process.exit(1);
    }
    console.log("Seller:", seller.storeName, seller._id.toString());

    // Sample image from existing product if available
    const existingWithImage = await Product.findOne({
      mainImage: { $exists: true, $nin: [null, ""] },
    })
      .select("mainImage")
      .lean();
    const fallbackImage = existingWithImage?.mainImage || "";

    let created = 0;
    let skipped = 0;

    for (const item of PRODUCTS) {
      const category = await Category.findOne({
        $or: [{ slug: item.categorySlug }, { name: new RegExp(item.categorySlug, "i") }],
        status: "Active",
      });

      if (!category) {
        console.warn(`Category not found for ${item.productName} (${item.categorySlug}), skipping`);
        skipped++;
        continue;
      }

      const already = await Product.findOne({
        seller: seller._id,
        productName: item.productName,
      });
      if (already) {
        console.log(`Skip (exists): ${item.productName}`);
        skipped++;
        continue;
      }

      const discount = item.retailDiscPrice
        ? Math.round(((item.retailPrice - item.retailDiscPrice) / item.retailPrice) * 100)
        : 0;

      const product = await Product.create({
        productName: item.productName,
        smallDescription: `${item.productName} - Fresh from Indore`,
        description: `Fresh ${item.productName} from Village Seed Store, Indore.`,
        category: category._id,
        headerCategoryId: (category as any).headerCategoryId,
        seller: seller._id,
        mainImage: fallbackImage,
        galleryImages: fallbackImage ? [fallbackImage] : [],
        retailPrice: item.retailPrice,
        retailDiscPrice: item.retailDiscPrice,
        wholesalePrice: item.wholesalePrice,
        wholesaleDiscPrice: item.wholesalePrice,
        compareAtPrice: item.retailPrice,
        stock: item.stock,
        minWholesaleQuantity: 5,
        variationType: "Weight",
        variations: [
          {
            name: "Variation",
            value: item.pack,
            retailPrice: item.retailPrice,
            retailDiscPrice: item.retailDiscPrice,
            wholesalePrice: item.wholesalePrice,
            wholesaleDiscPrice: item.wholesalePrice,
            minWholesaleQuantity: 5,
            stock: item.stock,
            status: "Available",
          },
        ],
        publish: true,
        popular: !!item.popular,
        dealOfDay: !!(item as any).dealOfDay,
        status: "Active",
        manufacturer: "Village Seed Store",
        madeIn: "Indore",
        pack: item.pack,
        isReturnable: true,
        maxReturnDays: 2,
        totalAllowedQuantity: 20,
        rating: 4.5,
        reviewsCount: 12,
        discount,
        tags: item.tags,
        requiresApproval: false,
        isShopByStoreOnly: false,
      });

      try {
        await Inventory.create({
          product: product._id,
          seller: seller._id,
          currentStock: item.stock,
          reservedStock: 0,
          availableStock: item.stock,
          lowStockThreshold: 10,
          reorderLevel: 5,
        });
      } catch {
        // inventory optional if already exists
      }

      console.log(`Created: ${product.productName} | ₹${item.retailDiscPrice} | ${item.pack}`);
      created++;
    }

    console.log("\nSummary:", { created, skipped, seller: seller.storeName, mobile: SELLER_MOBILE });
    await mongoose.disconnect();
  } catch (error: any) {
    console.error("Seed failed:", error.message || error);
    process.exit(1);
  }
}

run();
