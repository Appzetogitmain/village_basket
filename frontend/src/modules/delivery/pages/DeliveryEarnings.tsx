import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "../../../context/ToastContext";
import {
  getDashboardStats,
  getEarningsHistory,
  requestWithdrawal,
  DeliveryDashboardStats,
} from "../../../services/api/delivery/deliveryService";
import VillageLoader from "../../../components/VillageLoader";

// Icons
const Icons = {
    ChevronLeft: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    Wallet: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    ),
    TrendingUp: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    )
};

export default function DeliveryEarnings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DeliveryDashboardStats | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          getDashboardStats(),
          getEarningsHistory(),
        ]);
        setStats(statsData);
        setEarningsHistory(historyData);
      } catch (err: any) {
        setError(err.message || "Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <VillageLoader message="Calculating Your Revenue" />;
  }

  const totalDeliveries = earningsHistory.reduce(
    (sum, day) => sum + day.deliveries,
    0,
  );

  const handleWithdraw = async () => {
    try {
      const amount = parseFloat(withdrawAmount);
      if (!amount || amount <= 0) {
        showToast("Please enter a valid amount", "error");
        return;
      }

      if (stats?.walletBalance !== undefined && amount > stats.walletBalance) {
        showToast("Withdrawal amount cannot exceed available balance", "error");
        return;
      }

      if (!window.confirm(`Confirm withdrawal request for ₹${amount}?`)) {
        return;
      }

      setIsWithdrawing(true);
      await requestWithdrawal(amount);
      showToast("Withdrawal request submitted successfully", "success");
      setWithdrawAmount("");
      // Refresh data
      const statsData = await getDashboardStats();
      setStats(statsData);
    } catch (err: any) {
      showToast(err.message || "Failed to request withdrawal", "error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>

      {/* Local Header */}
      <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
          >
              <Icons.ChevronLeft size={20} />
          </button>
          <div className="ml-2 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Financials</span>
              <span className="font-black text-[12px] text-white tracking-wide mt-1">Earnings & Payouts</span>
          </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {/* Current Wallet Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] organic-radius p-6 text-white mb-6 shadow-2xl shadow-[#8B3D28]/30 group">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
                <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">Available Funds</p>
                <div className="h-[2px] w-8 bg-white/10 rounded-full mt-1"></div>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
              <Icons.Wallet className="text-white" size={18} />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1">
             <span className="text-lg font-black text-white/60">₹</span>
             <h3 className="text-4xl font-black tracking-tighter leading-none">
               {stats?.walletBalance?.toFixed(2) || "0.00"}
             </h3>
          </div>
          
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
             <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">Pending Settlements: 0</p>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-[#4A7C59] rounded-lg shadow-inner">
                <div className="w-1 h-1 rounded-full bg-white opacity-80"></div>
                <span className="text-[7px] font-black text-white uppercase tracking-widest">Liquid</span>
             </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="village-card paper-texture organic-radius p-4 border-none shadow-sm flex flex-col items-center text-center">
                 <p className="text-stone-400 text-[8px] font-black uppercase tracking-widest mb-1.5 font-black">Month Total</p>
                 <p className="text-village-umber text-sm font-black">₹{stats?.totalEarning?.toFixed(0) || "0"}</p>
            </div>
            <div className="village-card paper-texture organic-radius p-4 border-none shadow-sm flex flex-col items-center text-center">
                 <p className="text-stone-400 text-[8px] font-black uppercase tracking-widest mb-1.5 font-black">Success Rate</p>
                 <p className="text-[#4A7C59] text-sm font-black">98.2%</p>
            </div>
        </div>

        {/* Withdraw Section - Integrated as a clean input box */}
        <div className="village-card paper-texture organic-radius p-6 border-none shadow-sm mb-6">
          <h3 className="text-village-umber text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-5 text-center">
            Instant Withdrawal
          </h3>
          <div className="relative mb-5">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[16px] font-black text-stone-300">₹</span>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-10 py-3.5 text-lg font-black focus:ring-4 focus:ring-[#8B3D28]/5 focus:border-[#8B3D28] outline-none transition-all placeholder:text-stone-200 text-village-umber"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing || !withdrawAmount}
            className="w-full bg-[#8B3D28] text-white rounded-2xl py-4 font-black text-[11px] uppercase tracking-[0.25em] shadow-lg shadow-[#8B3D28]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none relative overflow-hidden group"
          >
             <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
            <span className="relative z-10">{isWithdrawing ? "Securing Transaction..." : "Process Transfer"}</span>
          </button>
        </div>

        {/* Earnings History */}
        <div className="village-card paper-texture organic-radius p-0 border-none shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-stone-100 flex items-baseline justify-between">
            <h3 className="text-village-umber text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Log History</h3>
            <div className="h-[2px] w-12 bg-stone-100 rounded-full"></div>
          </div>
          <div className="divide-y divide-stone-50">
            {earningsHistory.length > 0 ? (
              earningsHistory.map((day, index) => (
                <div
                  key={index}
                  className="p-4 flex justify-between items-center bg-stone-50/20 hover:bg-stone-50 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-[#8B3D28]/40">
                       <Icons.TrendingUp size={14} />
                    </div>
                    <div>
                        <p className="text-village-umber text-[10px] font-black uppercase tracking-widest leading-none">
                        {day.date}
                        </p>
                        <p className="text-stone-400 text-[8px] font-bold uppercase tracking-widest mt-1.5">
                        {day.deliveries} Drops Completed
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-village-umber text-[12px] font-black tracking-tighter">
                        ₹{day.amount}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-stone-200">
                    <Icons.TrendingUp size={24} />
                </div>
                <p className="text-stone-300 text-[9px] font-black uppercase tracking-widest">No activity log found</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center opacity-40 mb-10">
            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-relaxed">
                Fiscal statements are updated every 24 hours.<br/>
                Withdrawals are processed manually via bank gateway.
            </p>
        </div>
      </div>
    </div>
  );
}
