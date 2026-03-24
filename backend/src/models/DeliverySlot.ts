import mongoose, { Document, Schema } from "mongoose";

export interface IDeliverySlot extends Document {
  name: string;          // e.g., "Morning Slot", "Evening Slot"
  startTime: string;     // "07:00" (24h)
  endTime: string;       // "10:00" (24h)
  label: string;         // Display string e.g., "7 AM - 10 AM"
  maxOrders: number;     // Max orders this slot can handle per day
  isActive: boolean;
  sortOrder: number;     // For display ordering
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySlotSchema = new Schema<IDeliverySlot>(
  {
    name: {
      type: String,
      required: [true, "Slot name is required"],
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
    },
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
    },
    maxOrders: {
      type: Number,
      default: 50,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DeliverySlotSchema.index({ isActive: 1, sortOrder: 1 });

const DeliverySlot =
  mongoose.models.DeliverySlot ||
  mongoose.model<IDeliverySlot>("DeliverySlot", DeliverySlotSchema);

export default DeliverySlot;
