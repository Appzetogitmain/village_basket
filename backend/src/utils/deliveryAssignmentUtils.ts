import mongoose from "mongoose";

type DeliveryAssignmentEntry = {
  deliveryBoy?: mongoose.Types.ObjectId | string;
};

type OrderWithAssignments = {
  deliveryBoy?: mongoose.Types.ObjectId | string;
  assignedDeliveryBoys?: DeliveryAssignmentEntry[];
};

export function isOrderAssignedToDeliveryBoy(
  order: OrderWithAssignments,
  deliveryBoyId: string
): boolean {
  const normalizedId = deliveryBoyId.toString();
  if (order.deliveryBoy?.toString() === normalizedId) return true;
  return (
    order.assignedDeliveryBoys?.some(
      (entry) => entry.deliveryBoy?.toString() === normalizedId
    ) ?? false
  );
}

export function deliveryBoyOrderFilter(deliveryBoyId: string) {
  return {
    $or: [
      { deliveryBoy: deliveryBoyId },
      { "assignedDeliveryBoys.deliveryBoy": deliveryBoyId },
    ],
  };
}

export function addDeliveryBoyToOrder(
  order: {
    deliveryBoy?: mongoose.Types.ObjectId;
    deliveryBoyStatus?: string;
    assignedAt?: Date;
    assignedDeliveryBoys?: Array<{
      deliveryBoy: mongoose.Types.ObjectId;
      assignedAt?: Date;
      status?: string;
    }>;
  },
  deliveryBoyId: string
): boolean {
  const normalizedId = deliveryBoyId.toString();
  if (!order.assignedDeliveryBoys) {
    order.assignedDeliveryBoys = [];
  }

  const alreadyAssigned = order.assignedDeliveryBoys.some(
    (entry) => entry.deliveryBoy?.toString() === normalizedId
  );
  if (alreadyAssigned) return false;

  order.assignedDeliveryBoys.push({
    deliveryBoy: new mongoose.Types.ObjectId(normalizedId),
    assignedAt: new Date(),
    status: "Assigned",
  });

  if (!order.deliveryBoy) {
    order.deliveryBoy = new mongoose.Types.ObjectId(normalizedId);
    order.deliveryBoyStatus = "Assigned";
    order.assignedAt = new Date();
  }

  return true;
}
