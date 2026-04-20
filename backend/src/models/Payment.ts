import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  paymentId: string;
  order: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;

  // Payment Info
  method?: "razorpay" | "cash" | "wallet" | "upi" | "card";
  paymentMethod: string;
  paymentGateway?: string;
  transactionId?: string;
  metadata?: Record<string, any>;

  // Razorpay Specific
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Amount
  amount: number;
  currency: string;

  // Status
  status:
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled"
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Refunded"
  | "Cancelled";

  // Payment Details
  completedAt?: Date;
  paymentDate?: Date;
  paidAt?: Date;

  // Gateway Response
  gatewayResponse?: {
    success: boolean;
    message?: string;
    rawResponse?: any;
  };

  // Refund Info
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;

  // Notes
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: [true, "Payment ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },

    // Payment Info
    method: {
      type: String,
      enum: ["razorpay", "cash", "wallet", "upi", "card"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
    paymentGateway: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },

    // Razorpay Specific
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },

    // Amount
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Completed",
        "Failed",
        "Refunded",
        "Cancelled",
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      default: "Pending",
    },

    // Payment Details
    completedAt: {
      type: Date,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
    },

    // Gateway Response
    gatewayResponse: {
      success: Boolean,
      message: String,
      rawResponse: Schema.Types.Mixed,
    },

    // Refund Info
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
      trim: true,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ customer: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ paymentId: 1 }, { unique: true });
PaymentSchema.index({ method: 1, status: 1 });

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
