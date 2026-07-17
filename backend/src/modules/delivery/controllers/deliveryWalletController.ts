import { Request, Response } from 'express';
import {
    getWalletBalance,
    getWalletTransactions,
    createWithdrawalRequest,
    getWithdrawalRequests,
} from '../../../services/walletManagementService';
import { getCommissionSummary } from '../../../services/commissionService';
import DeliveryWallet from '../../../models/DeliveryWallet';
import Delivery from '../../../models/Delivery';
import {
    getRazorpayCredentials,
    getRazorpayInstanceFromDb,
    verifyRazorpaySignatureFromDb,
    isRazorpayAvailable,
    isMockCodDepositEnabled,
    isMockCodDepositOrder,
} from '../../../services/codService';

const ensureDeliveryWallet = async (deliveryBoyId: string) => {
    return DeliveryWallet.findOneAndUpdate(
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
        { upsert: true, new: true }
    );
};

/**
 * Get delivery boy wallet balance
 */
export const getBalance = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;
        const balance = await getWalletBalance(deliveryBoyId, 'DELIVERY_BOY');
        const ledger = await ensureDeliveryWallet(deliveryBoyId);

        return res.status(200).json({
            success: true,
            data: {
                balance,
                totalBalance: Number(ledger?.totalBalance || 0),
                cashInHand: Number(ledger?.cashInHand || 0),
            },
        });
    } catch (error: any) {
        console.error('Error getting wallet balance:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get wallet balance',
        });
    }
};

/**
 * Get delivery boy wallet transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;
        const { page = 1, limit = 20 } = req.query;

        const result = await getWalletTransactions(
            deliveryBoyId,
            'DELIVERY_BOY',
            Number(page),
            Number(limit)
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error getting wallet transactions:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get wallet transactions',
        });
    }
};

/**
 * Request withdrawal
 */
export const requestWithdrawal = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;
        const { amount, paymentMethod } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid withdrawal amount',
            });
        }

        if (!paymentMethod || !['Bank Transfer', 'UPI'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method',
            });
        }

        const result = await createWithdrawalRequest(
            deliveryBoyId,
            'DELIVERY_BOY',
            amount,
            paymentMethod
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json(result);
    } catch (error: any) {
        console.error('Error requesting withdrawal:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to request withdrawal',
        });
    }
};

/**
 * Get delivery boy withdrawal requests
 */
export const getWithdrawals = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;
        const { status } = req.query;

        const result = await getWithdrawalRequests(
            deliveryBoyId,
            'DELIVERY_BOY',
            status as string
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error getting withdrawal requests:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get withdrawal requests',
        });
    }
};

/**
 * Get delivery boy commission earnings
 */
export const getCommissions = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;

        const result = await getCommissionSummary(deliveryBoyId, 'DELIVERY_BOY');

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error getting commission earnings:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get commission earnings',
        });
    }
};

/**
 * Get COD deposit configuration
 */
export const getDepositConfig = async (req: Request, res: Response) => {
    try {
        const razorpayEnabled = await isRazorpayAvailable();

        return res.status(200).json({
            success: true,
            data: {
                razorpayEnabled,
                mockDepositEnabled: isMockCodDepositEnabled() && !razorpayEnabled,
            },
        });
    } catch (error: any) {
        console.error('Error getting deposit config:', error);
        return res.status(200).json({
            success: true,
            data: {
                razorpayEnabled: false,
                mockDepositEnabled: isMockCodDepositEnabled(),
            },
        });
    }
};

/**
 * Create Razorpay order to deposit collected COD cash
 */
export const createCashDepositOrder = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;
        const amount = Number(req.body?.amount || 0);

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
        }

        const wallet = await ensureDeliveryWallet(deliveryBoyId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Delivery wallet not found',
            });
        }

        if (amount > Number(wallet.cashInHand || 0)) {
            return res.status(400).json({
                success: false,
                message: 'Deposit amount cannot exceed cash in hand',
            });
        }

        const razorpay = await getRazorpayInstanceFromDb();
        const { keyId } = await getRazorpayCredentials();

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `dep_${Date.now().toString(36)}`,
            notes: {
                type: 'cash_limit_deposit',
                deliveryId: deliveryBoyId,
                amount: String(amount),
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                razorpayKey: keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            },
        });
    } catch (error: any) {
        console.error('Error creating cash deposit order:', error);

        if (
            error?.statusCode === 401 &&
            isMockCodDepositEnabled()
        ) {
            const mockOrderId = `mock_dep_${Date.now().toString(36)}`;
            return res.status(200).json({
                success: true,
                data: {
                    razorpayOrderId: mockOrderId,
                    razorpayKey: 'mock',
                    amount: Math.round(amount * 100),
                    currency: 'INR',
                    mock: true,
                },
            });
        }

        const razorpayMessage =
            error?.error?.description ||
            error?.description ||
            error?.message;

        return res.status(400).json({
            success: false,
            razorpayEnabled: false,
            message:
                razorpayMessage ||
                'Online payment is unavailable. Please submit a manual cash handover.',
        });
    }
};

/**
 * Verify cash deposit and settle delivery cash in hand
 */
export const verifyCashDeposit = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;
        const amount = Number(req.body?.amount || 0);
        const razorpayOrderId = String(req.body?.razorpayOrderId || '');
        const razorpayPaymentId = String(req.body?.razorpayPaymentId || '');
        const razorpaySignature = String(req.body?.razorpaySignature || '');

        if (!amount || amount <= 0 || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required verification details',
            });
        }

        const signatureValid = isMockCodDepositOrder(razorpayOrderId)
            ? true
            : await verifyRazorpaySignatureFromDb(
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            );

        if (!signatureValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Razorpay signature',
            });
        }

        await ensureDeliveryWallet(deliveryBoyId);
        const existing = await DeliveryWallet.findOne({
            deliveryBoy: deliveryBoyId,
            transactions: {
                $elemMatch: { "metadata.razorpayPaymentId": razorpayPaymentId },
            },
        });

        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Deposit already verified',
                data: {
                    cashInHand: Number(existing.cashInHand || 0),
                    alreadyProcessed: true,
                },
            });
        }

        const updateResult = await DeliveryWallet.updateOne(
            {
                deliveryBoy: deliveryBoyId,
                cashInHand: { $gte: amount },
                transactions: {
                    $not: {
                        $elemMatch: { "metadata.razorpayPaymentId": razorpayPaymentId },
                    },
                },
            },
            {
                $inc: { cashInHand: -amount },
                $push: {
                    transactions: {
                        type: 'deposit',
                        status: 'Completed',
                        amount,
                        reference: `deposit_${razorpayPaymentId}`,
                        metadata: {
                            razorpayOrderId,
                            razorpayPaymentId,
                        },
                        createdAt: new Date(),
                    },
                },
            }
        );

        if (updateResult.modifiedCount === 0) {
            const postCheck = await DeliveryWallet.findOne({
                deliveryBoy: deliveryBoyId,
                transactions: {
                    $elemMatch: { "metadata.razorpayPaymentId": razorpayPaymentId },
                },
            });

            if (postCheck) {
                return res.status(200).json({
                    success: true,
                    message: 'Deposit already verified',
                    data: {
                        cashInHand: Number(postCheck.cashInHand || 0),
                        alreadyProcessed: true,
                    },
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Amount exceeds cash in hand',
            });
        }

        const updatedWallet = await DeliveryWallet.findOne({ deliveryBoy: deliveryBoyId });
        const cashInHand = Number(updatedWallet?.cashInHand || 0);

        await Delivery.findByIdAndUpdate(deliveryBoyId, {
            $set: { cashCollected: cashInHand },
        });

        return res.status(200).json({
            success: true,
            message: 'Deposit verified successfully',
            data: { cashInHand },
        });
    } catch (error: any) {
        console.error('Error verifying cash deposit:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify deposit',
        });
    }
};
/**
 * Submit manual cash settlement (Delivery Boy reporting handover)
 */
export const submitManualSettlement = async (req: Request, res: Response) => {
    try {
        const deliveryBoyId = req.user!.userId;
        const amount = Number(req.body?.amount || 0);
        const orderId = req.body?.orderId === "" ? undefined : req.body?.orderId;
        const remark = req.body?.remark;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
        }

        const wallet = await ensureDeliveryWallet(deliveryBoyId);
        if (amount > Number(wallet.cashInHand || 0)) {
            return res.status(400).json({
                success: false,
                message: 'Settlement amount cannot exceed cash in hand',
            });
        }

        const CashCollection = (await import('../../../models/CashCollection')).default;
        
        const settlement = await CashCollection.create({
            deliveryBoy: deliveryBoyId,
            order: orderId, // If orderId is provided, track it
            amount,
            remark,
            status: 'Pending',
            initiatedBy: 'DeliveryBoy',
            collectedAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: 'Settlement request submitted successfully',
            data: settlement,
        });
    } catch (error: any) {
        console.error('Error submitting manual settlement:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit settlement',
        });
    }
};
