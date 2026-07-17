import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import AppSettings from "../models/AppSettings";
import Delivery from "../models/Delivery";
import DeliveryWallet from "../models/DeliveryWallet";
import Order, { IOrder } from "../models/Order";
import Payment, { IPayment } from "../models/Payment";
import PaymentMethod from "../models/PaymentMethod";

export type NormalizedPaymentMethod =
  | "razorpay"
  | "cash"
  | "wallet"
  | "upi"
  | "card";

type CompletionResult = {
  success: boolean;
  alreadyDelivered: boolean;
  order: IOrder;
  payment?: IPayment | null;
};

const nowIso = () => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

export const createPaymentRecordId = (prefix: string = "PAY"): string =>
  `${prefix}_${nowIso()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

export const normalizePaymentMethod = (input?: string): NormalizedPaymentMethod => {
  const value = (input || "").trim().toLowerCase();
  if (!value || value === "online" || value === "razorpay") return "razorpay";
  if (value === "cod" || value === "cash") return "cash";
  if (value === "wallet") return "wallet";
  if (value === "upi") return "upi";
  if (value === "card") return "card";
  return "razorpay";
};

export const toLegacyPaymentMethod = (method: NormalizedPaymentMethod): string => {
  if (method === "cash") return "COD";
  if (method === "wallet") return "Wallet";
  if (method === "upi") return "UPI";
  if (method === "card") return "Card";
  return "Online";
};

export const isCashOrder = (order: Pick<IOrder, "paymentMethod" | "payment">): boolean => {
  if (order.payment?.method) return order.payment.method === "cash";
  return (order.paymentMethod || "").toUpperCase() === "COD";
};

export const buildOrderPaymentSnapshot = (
  method: NormalizedPaymentMethod,
  status: "pending" | "processing" | "completed" | "failed" | "refunded"
) => ({
  method,
  status,
});

export const createBestEffortPaymentRecord = async (
  order: IOrder,
  session?: mongoose.ClientSession
): Promise<IPayment | null> => {
  try {
    const normalizedMethod = order.payment?.method || normalizePaymentMethod(order.paymentMethod);
    const isPaid = order.payment?.status === "completed" || order.paymentStatus === "Paid";
    const paymentStatus = isPaid ? "completed" : "pending";
    const legacyMethod = toLegacyPaymentMethod(normalizedMethod);

    const update: mongoose.UpdateQuery<IPayment> = {
      $setOnInsert: {
        paymentId: createPaymentRecordId("PAY"),
        order: order._id,
        customer: order.customer,
        userId: order.customer,
        amount: Number(order.total || 0),
        currency: "INR",
        paymentDate: new Date(),
      },
      $set: {
        method: normalizedMethod,
        paymentMethod: legacyMethod,
        paymentGateway: normalizedMethod === "razorpay" ? "Razorpay" : legacyMethod,
        status: paymentStatus,
        amount: Number(order.total || 0),
        metadata: {
          source: "order_create",
          orderPayment: order.payment || null,
        },
      },
    };

    if (isPaid) {
      update.$set = {
        ...(update.$set || {}),
        paidAt: new Date(),
        completedAt: new Date(),
      };
    }

    const payment = await Payment.findOneAndUpdate({ order: order._id }, update, {
      upsert: true,
      new: true,
      session,
    });

    return payment;
  } catch (error) {
    console.error("Best-effort payment record creation failed:", error);
    return null;
  }
};

const addCodCashIfMissing = async (
  deliveryBoyId: mongoose.Types.ObjectId,
  order: IOrder,
  paymentCollectedBy: "cash" | "qr" | undefined,
  customerTip: number,
  session?: mongoose.ClientSession
) => {
  if (!isCashOrder(order)) return;
  if (paymentCollectedBy === "qr") return;

  const codAmount = Number(order.total || 0) + Math.max(0, Number(customerTip || 0));
  if (codAmount <= 0) return;

  const eventKey = `cod_cash_collected_${order._id.toString()}`;
  await DeliveryWallet.updateOne(
    {
      deliveryBoy: deliveryBoyId,
      processedEvents: { $ne: eventKey },
    },
    {
      $inc: { cashInHand: codAmount },
      $addToSet: { processedEvents: eventKey },
    },
    { session }
  );
};

const ensureDeliveryWallet = async (
  deliveryBoyId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
) => {
  await DeliveryWallet.updateOne(
    { deliveryBoy: deliveryBoyId },
    {
      $setOnInsert: {
        deliveryBoy: deliveryBoyId,
        totalBalance: 0,
        cashInHand: 0,
        transactions: [],
        processedEvents: [],
      },
    },
    { upsert: true, session }
  );
};

const syncLegacyCashCollected = async (
  deliveryBoyId: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession
) => {
  const wallet = await DeliveryWallet.findOne({ deliveryBoy: deliveryBoyId }).session(session || null);
  if (!wallet) return;
  await Delivery.updateOne(
    { _id: deliveryBoyId },
    { $set: { cashCollected: Number(wallet.cashInHand || 0) } },
    { session }
  );
};

const reconcileCodCompletion = async (
  order: IOrder,
  session?: mongoose.ClientSession
): Promise<IPayment | null> => {
  if (!isCashOrder(order)) return null;

  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        paymentStatus: "Paid",
        paymentMethod: "COD",
        payment: {
          method: "cash",
          status: "completed",
          razorpayOrderId: order.payment?.razorpayOrderId,
          razorpayPaymentId: order.payment?.razorpayPaymentId,
          razorpaySignature: order.payment?.razorpaySignature,
          transactionId: order.payment?.transactionId,
        },
      },
    },
    { session }
  );

  const payment = await Payment.findOneAndUpdate(
    { order: order._id },
    {
      $setOnInsert: {
        paymentId: createPaymentRecordId("PAY"),
        order: order._id,
        customer: order.customer,
        userId: order.customer,
        currency: "INR",
        paymentDate: new Date(),
      },
      $set: {
        method: "cash",
        paymentMethod: "COD",
        paymentGateway: "COD",
        status: "completed",
        amount: Number(order.total || 0),
        completedAt: new Date(),
        paidAt: new Date(),
        metadata: {
          source: "delivery_complete",
        },
      },
    },
    { upsert: true, new: true, session }
  );

  return payment;
};

export const completeDeliveryLifecycle = async (params: {
  orderId: string;
  deliveryBoyId?: string;
  paymentCollectedBy?: "cash" | "qr";
  customerTip?: number;
}): Promise<CompletionResult> => {
  let session: mongoose.ClientSession | null = null;
  try {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError) {
      console.warn("Delivery completion running without transaction:", sessionError);
      session = null;
    }

    const filter: Record<string, any> = { _id: params.orderId };
    if (params.deliveryBoyId) {
      filter.deliveryBoy = new mongoose.Types.ObjectId(params.deliveryBoyId);
    }

    const deliveredAt = new Date();
    const transitioned = await Order.findOneAndUpdate(
      { ...filter, status: { $ne: "Delivered" } },
      {
        $set: {
          status: "Delivered",
          deliveredAt,
          deliveryBoyStatus: "Delivered",
          ...(params.paymentCollectedBy ? { paymentCollectedBy: params.paymentCollectedBy } : {}),
        },
      },
      { new: true, session: session || undefined }
    );

    const order =
      transitioned ||
      (await Order.findOne(filter).session(session || null));

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "Delivered") {
      throw new Error("Order is not in delivered state");
    }

    const payment = await reconcileCodCompletion(order, session || undefined);

    if (order.deliveryBoy) {
      await ensureDeliveryWallet(order.deliveryBoy as mongoose.Types.ObjectId, session || undefined);
      await addCodCashIfMissing(
        order.deliveryBoy as mongoose.Types.ObjectId,
        order,
        params.paymentCollectedBy || order.paymentCollectedBy,
        Number(params.customerTip || 0),
        session || undefined
      );
      await syncLegacyCashCollected(order.deliveryBoy as mongoose.Types.ObjectId, session || undefined);
    }

    if (session) {
      await session.commitTransaction();
    }

    return {
      success: true,
      alreadyDelivered: !transitioned,
      order,
      payment,
    };
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const getRazorpayCredentials = async (): Promise<{
  keyId: string;
  keySecret: string;
}> => {
  const trim = (value?: string | null) =>
    typeof value === "string" ? value.trim() : "";

  const isValidRazorpayKey = (key: string) =>
    /^rzp_(test|live)_[A-Za-z0-9]+$/.test(key);

  const normalizeCredentialPair = (
    keyId?: string | null,
    keySecret?: string | null
  ) => {
    const id = trim(keyId);
    const secret = trim(keySecret);
    if (!id || !secret || !isValidRazorpayKey(id)) {
      return null;
    }
    return { keyId: id, keySecret: secret };
  };

  const candidates: Array<{ keyId: string; keySecret: string } | null> = [
    normalizeCredentialPair(
      process.env.RAZORPAY_KEY_ID,
      process.env.RAZORPAY_KEY_SECRET
    ),
  ];

  const settings = await AppSettings.findOne().select("paymentGateways");
  if (settings?.paymentGateways?.razorpay?.enabled !== false) {
    candidates.push(
      normalizeCredentialPair(
        settings?.paymentGateways?.razorpay?.keyId,
        settings?.paymentGateways?.razorpay?.keySecret
      )
    );
  }

  const razorpayMethod = await PaymentMethod.findOne({
    $or: [{ provider: { $regex: /razorpay/i } }, { name: { $regex: /razorpay/i } }],
  }).select("+apiKey +secretKey");

  candidates.push(
    normalizeCredentialPair(razorpayMethod?.apiKey, razorpayMethod?.secretKey)
  );

  const creds = candidates.find(Boolean);
  if (!creds) {
    throw new Error("Razorpay credentials not configured");
  }

  return creds;
};

let razorpayAvailabilityCache: { available: boolean; checkedAt: number } | null = null;

export const isRazorpayAvailable = async (): Promise<boolean> => {
  if (
    razorpayAvailabilityCache &&
    Date.now() - razorpayAvailabilityCache.checkedAt < 5 * 60 * 1000
  ) {
    return razorpayAvailabilityCache.available;
  }

  try {
    const razorpay = await getRazorpayInstanceFromDb();
    await razorpay.orders.create({
      amount: 100,
      currency: "INR",
      receipt: `ping_${Date.now().toString(36)}`,
    });
    razorpayAvailabilityCache = { available: true, checkedAt: Date.now() };
    return true;
  } catch (error) {
    console.warn("Razorpay unavailable:", error);
    razorpayAvailabilityCache = { available: false, checkedAt: Date.now() };
    return false;
  }
};

export const isMockCodDepositEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_MOCK_COD_DEPOSIT === "true";

export const isMockCodDepositOrder = (razorpayOrderId: string) =>
  isMockCodDepositEnabled() && razorpayOrderId.startsWith("mock_dep_");

export const getRazorpayInstanceFromDb = async (): Promise<Razorpay> => {
  const creds = await getRazorpayCredentials();
  return new Razorpay({
    key_id: creds.keyId,
    key_secret: creds.keySecret,
  });
};

export const verifyRazorpaySignatureFromDb = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<boolean> => {
  const { keySecret } = await getRazorpayCredentials();
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
  return expected === razorpaySignature;
};
