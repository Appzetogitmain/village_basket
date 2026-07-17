import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../../context/ToastContext";
import {
    getDeliveryWalletBalance,
    getDeliveryWalletTransactions,
    requestDeliveryWithdrawal,
    getDeliveryWithdrawals,
    getDeliveryCommissions,
    createDeliveryCashDepositOrder,
    verifyDeliveryCashDeposit,
    getDeliveryDepositConfig,
} from "../../../services/api/deliveryWalletService";
import { submitManualSettlement } from "../../../services/api/delivery/deliveryService";
import VillageLoader from "../../../components/VillageLoader";
import { useAuth } from "../../../context/AuthContext";
import DeliveryGuestState from "../components/DeliveryGuestState";

type Tab = "transactions" | "withdrawals" | "commissions";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    Wallet: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    ),
    X: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
};

export default function DeliveryWallet() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const isDeliveryUser = isAuthenticated && user?.userType === 'Delivery';

    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>("transactions");
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [commissions, setCommissions] = useState<any>({
        commissions: [],
        total: 0,
        paid: 0,
        pending: 0,
    });
    const [ledger, setLedger] = useState<any>(null);
    const [depositConfig, setDepositConfig] = useState({
        razorpayEnabled: false,
        mockDepositEnabled: true,
    });
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutRemark, setPayoutRemark] = useState("");
    const [payoutInProgress, setPayoutInProgress] = useState(false);
    const [manualSettlementInProgress, setManualSettlementInProgress] = useState(false);

    const [loading, setLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"Bank Transfer" | "UPI">(
        "Bank Transfer",
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isDeliveryUser) {
            setLoading(false);
            return;
        }
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const [balanceRes, transactionsRes, withdrawalsRes, commissionsRes, depositConfigRes] =
                await Promise.all([
                    getDeliveryWalletBalance(),
                    getDeliveryWalletTransactions(),
                    getDeliveryWithdrawals(),
                    getDeliveryCommissions(),
                    getDeliveryDepositConfig(),
                ]);

            if (balanceRes.success) {
                setBalance(balanceRes.data.balance);
                setLedger(balanceRes.data);
            }
            if (transactionsRes.success)
                setTransactions(transactionsRes.data.transactions || []);
            if (withdrawalsRes.success) setWithdrawals(withdrawalsRes.data || []);
            if (commissionsRes.success) setCommissions(commissionsRes.data);
            if (depositConfigRes.success) {
                setDepositConfig(depositConfigRes.data);
            }
        } catch (error: any) {
            showToast(
                error.response?.data?.message || "Failed to load wallet data",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayout = () => {
        const cashInHand = Number(ledger?.cashInHand || 0);
        if (cashInHand <= 0) {
            showToast("No cash in hand to settle", "error");
            return;
        }

        setPayoutAmount(cashInHand.toFixed(2));
        setPayoutRemark("");
        setShowPayoutModal(true);
    };

    const handleManualSettlement = async () => {
        const amount = Number(payoutAmount);
        const cashInHand = Number(ledger?.cashInHand || 0);

        if (!amount || amount <= 0) {
            showToast("Please enter a valid amount", "error");
            return;
        }

        if (amount > cashInHand) {
            showToast("Amount cannot exceed cash in hand", "error");
            return;
        }

        try {
            setManualSettlementInProgress(true);
            const response = await submitManualSettlement({
                amount,
                remark: payoutRemark.trim() || "Cash handover submitted by delivery partner",
            });

            if (response.success) {
                showToast("Cash handover submitted to admin for approval", "success");
                setShowPayoutModal(false);
                setPayoutAmount("");
                setPayoutRemark("");
                fetchWalletData();
            } else {
                showToast(response.message || "Failed to submit cash handover", "error");
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to submit cash handover", "error");
        } finally {
            setManualSettlementInProgress(false);
        }
    };

    const handleRazorpayPayout = async () => {
        const amount = Number(payoutAmount);
        const cashInHand = Number(ledger?.cashInHand || 0);

        if (!amount || amount <= 0) {
            showToast("Please enter a valid amount", "error");
            return;
        }

        if (amount > cashInHand) {
            showToast("Amount cannot exceed cash in hand", "error");
            return;
        }

        try {
            setPayoutInProgress(true);

            const orderResponse = await createDeliveryCashDepositOrder(amount);
            if (!orderResponse.success) {
                showToast(
                    orderResponse.message || "Online payment unavailable. Use manual cash handover.",
                    "error",
                );
                setPayoutInProgress(false);
                return;
            }

            const { razorpayOrderId, razorpayKey, mock } = orderResponse.data;

            if (mock) {
                const verifyResponse = await verifyDeliveryCashDeposit({
                    amount,
                    razorpayOrderId,
                    razorpayPaymentId: `mock_pay_${Date.now()}`,
                    razorpaySignature: "mock_signature",
                });

                if (verifyResponse.success) {
                    showToast("Cash settlement recorded successfully.", "success");
                    setShowPayoutModal(false);
                    setPayoutAmount("");
                    setPayoutRemark("");
                    fetchWalletData();
                } else {
                    showToast(verifyResponse.message || "Settlement verification failed", "error");
                }
                setPayoutInProgress(false);
                return;
            }

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                showToast("Failed to load Razorpay checkout", "error");
                setPayoutInProgress(false);
                return;
            }

            const options = {
                key: razorpayKey,
                amount: Math.round(amount * 100),
                currency: "INR",
                name: "Village Basket",
                description: "COD cash settlement to admin",
                order_id: razorpayOrderId,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || user?.mobile || "",
                },
                theme: {
                    color: "#8B3D28",
                },
                handler: async (response: any) => {
                    try {
                        const verifyResponse = await verifyDeliveryCashDeposit({
                            amount,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        if (verifyResponse.success) {
                            showToast("Payment successful. Cash settlement recorded.", "success");
                            setShowPayoutModal(false);
                            setPayoutAmount("");
                            fetchWalletData();
                        } else {
                            showToast(verifyResponse.message || "Payment verification failed", "error");
                        }
                    } catch (err: any) {
                        showToast(err.response?.data?.message || "Payment verification failed", "error");
                    } finally {
                        setPayoutInProgress(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setPayoutInProgress(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err: any) {
            const message =
                err.response?.data?.message || "Failed to initiate Razorpay payment";
            showToast(
                message.includes("Razorpay")
                    ? `${message} You can submit a manual cash handover instead.`
                    : message,
                "error",
            );
            setPayoutInProgress(false);
        }
    };

    const handleWithdrawRequest = async () => {
        try {
            const amount = parseFloat(withdrawAmount);
            if (isNaN(amount) || amount <= 0) {
                showToast("Please enter a valid amount", "error");
                return;
            }

            if (amount > balance) {
                showToast("Insufficient balance", "error");
                return;
            }

            setIsSubmitting(true);
            const response = await requestDeliveryWithdrawal(amount, paymentMethod);
            if (response.success) {
                showToast("Withdrawal request submitted successfully", "success");
                setShowWithdrawModal(false);
                setWithdrawAmount("");
                fetchWalletData();
            }
        } catch (error: any) {
            showToast(
                error.response?.data?.message || "Failed to request withdrawal",
                "error",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <VillageLoader message="Checking Your Balance" />;
    }

    if (!isDeliveryUser) {
        return <DeliveryGuestState message="Please login as a delivery partner to manage your digital ledger and settlements" />;
    }

    return (
        <div className="min-h-screen bg-transparent pb-24 font-poppins relative">
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>

            {/* Local Header */}
            <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                >
                    <Icons.ChevronLeft size={20} />
                </button>
                <div className="ml-2 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Accounts</span>
                    <span className="font-black text-[12px] text-white tracking-wide mt-1">Digital Ledger</span>
                </div>
            </div>

            {/* Balance Card Surround */}
            <div className="px-6 py-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="village-card paper-texture organic-radius bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] p-7 text-white border-none shadow-2xl shadow-[#8B3D28]/20 relative overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none font-black italic text-8xl flex items-center justify-center select-none">{"\u20B9"}</div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 leading-none mb-2">Available Holdings</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-white/30">{"\u20B9"}</span>
                                    <span className="text-5xl font-black tracking-tighter">{balance.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 ring-1 ring-white/5 ring-offset-2 ring-offset-[#8B3D28]">
                                <Icons.Wallet className="text-white/80" />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="w-full bg-white text-village-umber py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-black/10 transition-all active:scale-[0.98] hover:bg-stone-50"
                        >
                            Extract Funds
                        </button>
                    </div>
                </motion.div>

                {/* Financial Highlights */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                        { label: 'GROSS', value: commissions.total, color: 'text-village-umber' },
                        { label: 'SETTLED', value: commissions.paid, color: 'text-[#4A7C59]' },
                        { label: 'ACCRUED', value: commissions.pending, color: 'text-[#8B3D28]' }
                    ].map((stat, i) => (
                        <div key={i} className="village-card paper-texture organic-radius p-3 border-none shadow-sm flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-[0.15em] text-stone-400 mb-1">{stat.label}</span>
                            <p className={`text-[12px] font-black tracking-tighter truncate ${stat.color}`}>{"\u20B9"}{stat.value?.toFixed(0) || "0"}</p>
                        </div>
                    ))}
                </div>

                {/* Cash in Hand Section */}
                <div className="mt-6">
                    <div className="village-card paper-texture organic-radius p-5 border-none shadow-sm bg-[#4A7C59]/5 border-l-4 border-l-[#4A7C59]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7C59]">Cash in Hand (COD)</span>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                    <span className="text-sm font-black text-[#4A7C59]/40">{"\u20B9"}</span>
                                    <span className="text-2xl font-black tracking-tighter text-[#4A7C59]">{(ledger?.cashInHand || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleOpenPayout}
                                className="px-5 py-3 bg-[#8B3D28] text-white rounded-2xl shadow-xl shadow-[#8B3D28]/30 font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all relative overflow-hidden"
                            >
                                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
                                <span className="relative z-10">Pay Out</span>
                            </button>
                            <div className="hidden w-10 h-10 rounded-xl bg-[#4A7C59]/10 flex items-center justify-center text-[#4A7C59]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tight leading-relaxed">
                            This amount is collected from COD orders. Settle it via Razorpay or submit a manual cash handover to admin.
                        </p>
                        {ledger?.cashInHand > 0 && (
                            <div className="mt-4 p-3 bg-white/50 rounded-xl border border-[#4A7C59]/10 text-[9px] font-black text-village-umber uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] animate-pulse"></span>
                                Action Required: Settlement Pending
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab System */}
                <div className="mt-8">
                    <div className="flex gap-2 p-1.5 bg-stone-100/50 rounded-2xl mb-4 border border-stone-100">
                        {(['transactions', 'withdrawals', 'commissions'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-white text-village-umber shadow-sm ring-1 ring-stone-200'
                                        : 'text-stone-400 hover:text-stone-600'
                                    }`}
                            >
                                {tab === 'transactions' ? 'Log' : tab === 'withdrawals' ? 'Out' : 'Fees'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-3"
                        >
                            {activeTab === "transactions" && (
                                transactions.length === 0 ? (
                                    <EmptyState label="No Audit Trail" />
                                ) : (
                                    transactions.map((txn: any) => (
                                        <div key={txn._id} className="village-card paper-texture organic-radius p-4 border-none shadow-sm flex items-center justify-between group">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="text-[11px] font-black text-village-umber uppercase tracking-tight truncate leading-none mb-1.5">{txn.description}</p>
                                                <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{new Date(txn.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                            <div className={`text-[13px] font-black tracking-tighter shrink-0 ${txn.type === "Credit" ? "text-[#4A7C59]" : "text-red-400"}`}>
                                                {txn.type === "Credit" ? "+" : "-"}{"\u20B9"}{txn.amount.toFixed(0)}
                                            </div>
                                        </div>
                                    ))
                                )
                            )}

                            {activeTab === "withdrawals" && (
                                withdrawals.length === 0 ? (
                                    <EmptyState label="No Outward Flow" />
                                ) : (
                                    withdrawals.map((withdrawal: any) => (
                                        <div key={withdrawal._id} className="village-card paper-texture organic-radius p-4 border-none shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm font-black text-village-umber tracking-tighter leading-none mb-1">{"\u20B9"}{withdrawal.amount.toFixed(2)}</p>
                                                    <p className="text-[8px] font-black text-stone-300 uppercase tracking-[0.1em]">{withdrawal.paymentMethod}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest leading-none ${withdrawal.status === "Completed" ? "bg-[#4A7C59]/10 text-[#4A7C59]" : "bg-stone-100 text-stone-400"
                                                    }`}>
                                                    {withdrawal.status}
                                                </span>
                                            </div>
                                            <p className="text-[8px] font-black text-stone-200 uppercase tracking-widest">{new Date(withdrawal.createdAt).toLocaleDateString("en-IN")}</p>
                                        </div>
                                    ))
                                )
                            )}

                            {activeTab === "commissions" && (
                                commissions.commissions?.length === 0 ? (
                                    <EmptyState label="Zero Commissions" />
                                ) : (
                                    commissions.commissions?.map((comm: any) => (
                                        <div key={comm.id} className="village-card paper-texture organic-radius p-4 border-none shadow-sm flex justify-between items-center">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-village-umber uppercase tracking-tight leading-none mb-1">Fee Partition</p>
                                                <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">ORDER VAL: \u20B9{comm.orderAmount?.toFixed(0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-black text-[#4A7C59] tracking-tighter leading-none mb-1">{"\u20B9"}{comm.amount.toFixed(2)}</p>
                                                <span className="text-[7px] font-black text-stone-200 uppercase tracking-widest leading-none">RATIO: {comm.rate}%</span>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Extraction Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 lg:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowWithdrawModal(false)}
                            className="absolute inset-0 bg-village-umber/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-stone-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl paper-texture overflow-hidden"
                        >
                            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>

                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B3D28] opacity-50 block mb-1">Financial Operation</span>
                                    <h2 className="text-2xl font-black text-village-umber tracking-tighter">Extraction Request</h2>
                                </div>
                                <button onClick={() => setShowWithdrawModal(false)} className="w-10 h-10 rounded-2xl bg-stone-200/50 flex items-center justify-center text-stone-400 group active:scale-90 transition-all">
                                    <Icons.X />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 ml-1">Quantum of Funds</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-stone-200 group-focus-within:text-[#8B3D28] transition-colors">{"\u20B9"}</span>
                                        <input
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full bg-white border-2 border-stone-100 rounded-[1.5rem] pl-12 pr-6 py-5 text-2xl font-black text-village-umber outline-none focus:border-[#8B3D28]/30 focus:ring-8 focus:ring-[#8B3D28]/5 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-3 px-1 text-[8px] font-black uppercase tracking-widest text-stone-300">
                                        <span>Maximum Limit</span>
                                        <span className="text-[#8B3D28]">{"\u20B9"} {balance.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 ml-1">Transfer Protocol</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(["Bank Transfer", "UPI"] as const).map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border-2 transition-all active:scale-95 ${paymentMethod === method
                                                        ? 'bg-[#8B3D28]/5 border-[#8B3D28] text-[#8B3D28]'
                                                        : 'bg-white border-stone-100 text-stone-300'
                                                    }`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleWithdrawRequest}
                                    disabled={isSubmitting || !withdrawAmount}
                                    className="w-full bg-[#8B3D28] text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-[#8B3D28]/30 transition-all active:scale-[0.98] disabled:opacity-50 relative overflow-hidden group mt-4"
                                >
                                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
                                    <span className="relative z-10">{isSubmitting ? "TRANSMITTING..." : "INITIATE TRANSFER"}</span>
                                </button>

                                <p className="text-[7px] font-bold text-stone-300 uppercase tracking-[0.2em] text-center mt-2">Processing latency typically within 24-48 business hours</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payout Modal */}
            <AnimatePresence>
                {showPayoutModal && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 lg:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPayoutModal(false)}
                            className="absolute inset-0 bg-village-umber/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-stone-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl paper-texture overflow-hidden"
                        >
                            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>

                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B3D28] opacity-50 block mb-1">COD Settlement</span>
                                    <h2 className="text-2xl font-black text-village-umber tracking-tighter">
                                        {depositConfig.razorpayEnabled ? "Pay Out via Razorpay" : "Settle Cash in Hand"}
                                    </h2>
                                </div>
                                <button onClick={() => setShowPayoutModal(false)} className="w-10 h-10 rounded-2xl bg-stone-200/50 flex items-center justify-center text-stone-400 group active:scale-90 transition-all">
                                    <Icons.X />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[1.5rem] bg-white border-2 border-stone-100 px-6 py-4">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Cash in Hand</p>
                                    <p className="text-2xl font-black text-[#4A7C59] tracking-tighter">{"\u20B9"}{(ledger?.cashInHand || 0).toFixed(2)}</p>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 ml-1">Settlement Amount</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-stone-200 group-focus-within:text-[#8B3D28] transition-colors">{"\u20B9"}</span>
                                        <input
                                            type="number"
                                            value={payoutAmount}
                                            onChange={(e) => setPayoutAmount(e.target.value)}
                                            max={ledger?.cashInHand || 0}
                                            className="w-full bg-white border-2 border-stone-100 rounded-[1.5rem] pl-12 pr-6 py-5 text-2xl font-black text-village-umber outline-none focus:border-[#8B3D28]/30 focus:ring-8 focus:ring-[#8B3D28]/5 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPayoutAmount(String(ledger?.cashInHand || 0))}
                                        className="mt-3 text-[9px] font-black uppercase tracking-widest text-[#8B3D28]"
                                    >
                                        Use full cash in hand
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3 ml-1">Remark (Optional)</label>
                                    <textarea
                                        value={payoutRemark}
                                        onChange={(e) => setPayoutRemark(e.target.value)}
                                        className="w-full bg-white border-2 border-stone-100 rounded-[1.5rem] px-6 py-4 text-xs font-bold text-village-umber outline-none focus:border-[#8B3D28]/30 transition-all min-h-[90px]"
                                        placeholder="Add handover details for admin"
                                    />
                                </div>

                                {(depositConfig.razorpayEnabled || depositConfig.mockDepositEnabled) && (
                                    <button
                                        onClick={handleRazorpayPayout}
                                        disabled={payoutInProgress || manualSettlementInProgress || !payoutAmount}
                                        className="w-full bg-[#8B3D28] text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-[#8B3D28]/30 transition-all active:scale-[0.98] disabled:opacity-50 relative overflow-hidden group mt-4"
                                    >
                                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
                                        <span className="relative z-10">
                                            {payoutInProgress
                                                ? "PROCESSING..."
                                                : depositConfig.razorpayEnabled
                                                    ? "PAY WITH RAZORPAY"
                                                    : "SETTLE CASH NOW"}
                                        </span>
                                    </button>
                                )}

                                <button
                                    onClick={handleManualSettlement}
                                    disabled={manualSettlementInProgress || payoutInProgress || !payoutAmount}
                                    className={`w-full py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 ${
                                        depositConfig.razorpayEnabled
                                            ? "bg-white text-village-umber border-2 border-stone-200"
                                            : "bg-[#8B3D28] text-white shadow-2xl shadow-[#8B3D28]/30"
                                    }`}
                                >
                                    {manualSettlementInProgress ? "SUBMITTING..." : "SUBMIT MANUAL CASH HANDOVER"}
                                </button>

                                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.15em] text-center leading-relaxed">
                                    {depositConfig.razorpayEnabled
                                        ? "Razorpay settles instantly. Manual handover is sent to admin for approval."
                                        : depositConfig.mockDepositEnabled
                                            ? "Development mode: cash can be settled instantly without Razorpay."
                                            : "Online payment is unavailable. Submit manual cash handover to admin."}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="village-card paper-texture organic-radius p-12 border-none shadow-sm flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mb-4">
                <Icons.Wallet size={20} className="text-stone-300" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</p>
        </div>
    );
}
