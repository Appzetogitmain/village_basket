import mongoose from "mongoose";
import Product from "../models/Product";
import Inventory from "../models/Inventory";

/**
 * Approved sellers' products should never stay in Pending.
 * Activates all non-Active products for an approved seller.
 */
export async function activateApprovedSellerProducts(
  sellerId: mongoose.Types.ObjectId | string
): Promise<number> {
  const result = await Product.updateMany(
    {
      seller: sellerId,
      status: { $ne: "Active" },
    },
    {
      $set: {
        status: "Active",
        requiresApproval: false,
      },
    }
  );

  return result.modifiedCount;
}

/**
 * Delete all products (and inventory) owned by a seller.
 */
export async function deleteSellerProducts(
  sellerId: mongoose.Types.ObjectId | string
): Promise<{ productsDeleted: number; inventoryDeleted: number }> {
  const products = await Product.find({ seller: sellerId }).select("_id");
  const productIds = products.map((p) => p._id);

  const inventoryResult = await Inventory.deleteMany({
    $or: [{ seller: sellerId }, { product: { $in: productIds } }],
  });

  const productResult = await Product.deleteMany({ seller: sellerId });

  return {
    productsDeleted: productResult.deletedCount,
    inventoryDeleted: inventoryResult.deletedCount,
  };
}
