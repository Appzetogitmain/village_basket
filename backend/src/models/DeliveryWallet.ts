import mongoose, { Document, Schema } from "mongoose";

export interface IDeliveryWalletTransaction {
  type: "earning" | "deposit";
  amount: number;
  status: string;
  orderId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  reference: string;
  createdAt: Date;
}

export interface IDeliveryWallet extends Document {
  deliveryBoy: mongoose.Types.ObjectId;
  totalBalance: number;
  cashInHand: number;
  transactions: IDeliveryWalletTransaction[];
  processedEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryWalletTransactionSchema = new Schema<IDeliveryWalletTransaction>(
  {
    type: {
      type: String,
      enum: ["earning", "deposit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const DeliveryWalletSchema = new Schema<IDeliveryWallet>(
  {
    deliveryBoy: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      unique: true,
      index: true,
    },
    totalBalance: {
      type: Number,
      default: 0,
      min: [0, "Total balance cannot be negative"],
    },
    cashInHand: {
      type: Number,
      default: 0,
      min: [0, "Cash in hand cannot be negative"],
    },
    transactions: {
      type: [DeliveryWalletTransactionSchema],
      default: [],
    },
    processedEvents: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

DeliveryWalletSchema.index({ "transactions.type": 1, "transactions.createdAt": -1 });
DeliveryWalletSchema.index({ "transactions.reference": 1 });
DeliveryWalletSchema.index({ "transactions.orderId": 1 });

const DeliveryWallet =
  mongoose.models.DeliveryWallet ||
  mongoose.model<IDeliveryWallet>("DeliveryWallet", DeliveryWalletSchema);

export default DeliveryWallet;
