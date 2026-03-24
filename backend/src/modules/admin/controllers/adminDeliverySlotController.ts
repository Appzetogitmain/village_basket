import { Request, Response } from "express";
import DeliverySlot from "../../../models/DeliverySlot";

/**
 * GET /admin/delivery-slots
 * Get all delivery slots (admin)
 */
export const getAllDeliverySlots = async (_req: Request, res: Response) => {
  try {
    const slots = await DeliverySlot.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching delivery slots",
      error: error.message,
    });
  }
};

/**
 * POST /admin/delivery-slots
 * Create a new delivery slot
 */
export const createDeliverySlot = async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, label, maxOrders, isActive, sortOrder } =
      req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Name, start time, and end time are required",
      });
    }

    // Auto-generate label if not provided
    const generatedLabel =
      label || `${formatTime(startTime)} - ${formatTime(endTime)}`;

    const existingCount = await DeliverySlot.countDocuments();

    const slot = new DeliverySlot({
      name: name.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      label: generatedLabel,
      maxOrders: maxOrders || 50,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? sortOrder : existingCount,
    });

    await slot.save();

    return res.status(201).json({
      success: true,
      message: "Delivery slot created successfully",
      data: slot,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error creating delivery slot",
      error: error.message,
    });
  }
};

/**
 * PUT /admin/delivery-slots/:id
 * Update a delivery slot
 */
export const updateDeliverySlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, label, maxOrders, isActive, sortOrder } =
      req.body;

    const slot = await DeliverySlot.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Delivery slot not found",
      });
    }

    if (name !== undefined) slot.name = name.trim();
    if (startTime !== undefined) slot.startTime = startTime.trim();
    if (endTime !== undefined) slot.endTime = endTime.trim();
    if (label !== undefined) slot.label = label;
    else if (startTime || endTime) {
      slot.label = `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
    }
    if (maxOrders !== undefined) slot.maxOrders = maxOrders;
    if (isActive !== undefined) slot.isActive = isActive;
    if (sortOrder !== undefined) slot.sortOrder = sortOrder;

    await slot.save();

    return res.status(200).json({
      success: true,
      message: "Delivery slot updated successfully",
      data: slot,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating delivery slot",
      error: error.message,
    });
  }
};

/**
 * PATCH /admin/delivery-slots/:id/status
 * Toggle active/inactive
 */
export const toggleDeliverySlotStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const slot = await DeliverySlot.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Delivery slot not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Delivery slot ${isActive ? "activated" : "deactivated"}`,
      data: slot,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating slot status",
      error: error.message,
    });
  }
};

/**
 * DELETE /admin/delivery-slots/:id
 */
export const deleteDeliverySlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const slot = await DeliverySlot.findByIdAndDelete(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Delivery slot not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery slot deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error deleting delivery slot",
      error: error.message,
    });
  }
};

/**
 * GET /customer/delivery-slots  (public/customer-accessible)
 * Get only active delivery slots for display on checkout
 */
export const getActiveDeliverySlotsForCustomer = async (
  _req: Request,
  res: Response
) => {
  try {
    const slots = await DeliverySlot.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("_id name label startTime endTime")
      .lean();

    return res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching delivery slots",
      error: error.message,
    });
  }
};

// Helper to convert 24h "HH:MM" to "H AM/PM"
function formatTime(time: string): string {
  if (!time) return time;
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr || "0", 10);
  const period = hour >= 12 ? "PM" : "AM";
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  const minutePart = minute > 0 ? `:${minute.toString().padStart(2, "0")}` : "";
  return `${hour}${minutePart} ${period}`;
}
