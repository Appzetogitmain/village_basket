
import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  // Order Info
  orderNumber: string;
  orderDate: Date;
  orderType: "INSTANT";
  deliverySlot?: {
    slotId?: string;
    date: Date;
    timeRange: string;
    label?: string;
  };

  // Customer Info
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Delivery Info
  deliveryAddress: {
    address: string;
    city: string;
    state?: string;
    pincode: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };

  // Order Items
  items: mongoose.Types.ObjectId[]; // References to OrderItem

  // Pricing
  subtotal: number;
  tax: number;
  shipping: number;
  platformFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  walletAmountUsed?: number;
  payableAmount: number;

  // Payment
  paymentMethod: string;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  paymentId?: string;
  payment?: {
    method: "razorpay" | "cash" | "wallet" | "upi" | "card";
    status: "pending" | "processing" | "completed" | "failed" | "refunded";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    transactionId?: string;
  };
  paymentCollectedBy?: "cash" | "qr";

  // Order Status
  status:
  | "Received"
  | "Pending"
  | "Processed"
  | "Ready for pickup"
  | "Picked up"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Rejected"
  | "Returned";

  // Delivery Assignment
  deliveryBoy?: mongoose.Types.ObjectId;
  deliveryBoyStatus?:
  | "Assigned"
  | "Picked Up"
  | "In Transit"
  | "Delivered"
  | "Failed";
  assignedAt?: Date;

  // Tracking
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  deliveredAt?: Date;

  // Delivery OTP
  deliveryOtp?: string;
  deliveryOtpExpiresAt?: Date;
  deliveryOtpVerified?: boolean;
  invoiceEnabled?: boolean;
  deliveryDistanceKm?: number;

  // Seller Pickups (for multi-seller orders)
  sellerPickups?: Array<{
    seller: mongoose.Types.ObjectId;
    pickedUpAt?: Date;
    pickedUpBy?: mongoose.Types.ObjectId; // delivery boy who picked up
    latitude?: number; // location where pickup was confirmed
    longitude?: number;
  }>;

  // Notes
  adminNotes?: string;
  customerNotes?: string;
  deliveryInstructions?: string;
  specialRequests?: string;

  // Cancellation/Return
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  isRefunded?: boolean;
  commissionsProcessed?: boolean;

  // Donation
  donationAmount?: number;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    // Order Info
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    orderType: {
      type: String,
      enum: ["INSTANT"],
      default: "INSTANT",
    },
    deliverySlot: {
      slotId: { type: String, trim: true },
      date: Date,
      timeRange: { type: String, trim: true },
      label: { type: String, trim: true },
    },

    // Customer Info
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },

    // Delivery Info
    deliveryAddress: {
      address: {
        type: String,
        required: [true, "Delivery address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        trim: true,
      },
      landmark: {
        type: String,
        trim: true,
      },
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },

    // Order Items
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "OrderItem",
      },
    ],

    // Pricing
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, "Shipping cannot be negative"],
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, "Platform fee cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    couponCode: {
      type: String,
      trim: true,
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    walletAmountUsed: {
      type: Number,
      default: 0,
      min: [0, "Wallet amount used cannot be negative"],
    },
    payableAmount: {
      type: Number,
      default: 0,
      min: [0, "Payable amount cannot be negative"],
    },

    // Payment
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentId: {
      type: String,
      trim: true,
    },
    payment: {
      method: {
        type: String,
        enum: ["razorpay", "cash", "wallet", "upi", "card"],
      },
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded"],
      },
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
      transactionId: {
        type: String,
        trim: true,
      },
    },
    paymentCollectedBy: {
      type: String,
      enum: ["cash", "qr"],
      default: "cash",
    },

    // Order Status
    status: {
      type: String,
      enum: [
        "Received",
        "Accepted",
        "Pending",
        "Processed",
        "Ready for pickup",
        "Picked up",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Rejected",
        "Returned",
      ],
      default: "Received",
    },

    // Delivery Assignment
    deliveryBoy: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
    },
    deliveryBoyStatus: {
      type: String,
      enum: ["Assigned", "Picked Up", "In Transit", "Delivered", "Failed"],
    },
    assignedAt: {
      type: Date,
    },

    // Tracking
    trackingNumber: {
      type: String,
      trim: true,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },

    // Delivery OTP
    deliveryOtp: {
      type: String,
      trim: true,
    },
    deliveryOtpExpiresAt: {
      type: Date,
    },
    deliveryOtpVerified: {
      type: Boolean,
      default: false,
    },
    invoiceEnabled: {
      type: Boolean,
      default: false,
    },
    deliveryDistanceKm: {
      type: Number,
    },

    // Seller Pickups (for multi-seller orders)
    sellerPickups: [
      {
        seller: {
          type: Schema.Types.ObjectId,
          ref: "Seller",
          required: true,
        },
        pickedUpAt: {
          type: Date,
        },
        pickedUpBy: {
          type: Schema.Types.ObjectId,
          ref: "Delivery",
        },
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
    ],

    // Notes
    adminNotes: {
      type: String,
      trim: true,
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },

    // Cancellation/Return
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
    },
    isRefunded: {
      type: Boolean,
      default: false,
    },
    commissionsProcessed: {
      type: Boolean,
      default: false,
    },
    donationAmount: {
      type: Number,
      default: 0,
      min: [0, "Donation amount cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number before validation
OrderSchema.pre("validate", async function (this: IOrder, next) {
  if (!this.orderNumber) {
    let isUnique = false;
    let newOrderNumber = "";
    
    // Try up to 10 times to find a unique 8-digit order number
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      // Generate 8 digit random number
      newOrderNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      // Check if this orderNumber already exists
      const existingOrder = await mongoose.models.Order.findOne({ orderNumber: newOrderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
      attempts++;
    }
    
    // Fallback if somehow 10 attempts fail (highly unlikely with 8 digits)
    if (!isUnique) {
      const timestamp = Date.now().toString().slice(-5);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      newOrderNumber = `${timestamp}${random}`;
    }
    
    this.orderNumber = newOrderNumber;
  }
  next();
});

// Keep legacy and nested payment fields synchronized for backward compatibility.
OrderSchema.pre("save", function (this: IOrder, next) {
  if (this.payment?.method) {
    const methodMap: Record<string, string> = {
      cash: "COD",
      wallet: "Wallet",
      razorpay: "Online",
      upi: "UPI",
      card: "Card",
    };
    const statusMap: Record<string, IOrder["paymentStatus"]> = {
      pending: "Pending",
      processing: "Pending",
      completed: "Paid",
      failed: "Failed",
      refunded: "Refunded",
    };

    this.paymentMethod = methodMap[this.payment.method] || this.paymentMethod;
    this.paymentStatus = statusMap[this.payment.status] || this.paymentStatus;
  } else {
    const normalizedMap: Record<string, IOrder["payment"]> = {
      COD: { method: "cash", status: "pending" },
      Wallet: { method: "wallet", status: this.paymentStatus === "Paid" ? "completed" : "pending" },
      UPI: { method: "upi", status: this.paymentStatus === "Paid" ? "completed" : "pending" },
      Card: { method: "card", status: this.paymentStatus === "Paid" ? "completed" : "pending" },
      Online: { method: "razorpay", status: this.paymentStatus === "Paid" ? "completed" : "pending" },
    };
    if (this.paymentMethod && normalizedMap[this.paymentMethod]) {
      this.payment = normalizedMap[this.paymentMethod];
    }
  }

  next();
});

// Indexes for faster queries
OrderSchema.index({ customer: 1, orderDate: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ deliveryBoy: 1 });
OrderSchema.index({ "payment.method": 1, "payment.status": 1 });

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
