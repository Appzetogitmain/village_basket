import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import {
    getBalance,
    getTransactions,
    requestWithdrawal,
    getWithdrawals,
    getCommissions,
    createCashDepositOrder,
    verifyCashDeposit,
    submitManualSettlement,
} from '../modules/delivery/controllers/deliveryWalletController';

const router = Router();

// All routes require delivery boy authentication
router.use(authenticate, requireUserType('Delivery'));

// Wallet balance
router.get('/balance', getBalance);

// Wallet transactions
router.get('/transactions', getTransactions);

// Withdrawal requests
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getWithdrawals);

// Commission earnings
router.get('/commissions', getCommissions);

// COD cash settlement
router.post('/deposit/create-order', createCashDepositOrder);
router.post('/deposit/verify', verifyCashDeposit);
router.post('/manual-settlement', submitManualSettlement);

export default router;
