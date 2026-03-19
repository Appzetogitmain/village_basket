import { useState, useEffect } from "react";
import api from "../../services/api/config";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import IconLoader from "../../components/loaders/IconLoader";
import { motion, AnimatePresence } from "framer-motion";

export default function Rewards() {
  const { showToast } = useToast();
  const [coins, setCoins] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rewards"); // 'rewards' or 'history'

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rewardsRes, historyRes] = await Promise.all([
        api.get("/customer/rewards"),
        api.get("/customer/rewards/redemptions")
      ]);

      if (rewardsRes.data.success) {
        setCoins(rewardsRes.data.data.coins);
        setItems(rewardsRes.data.data.items);
      }

      if (historyRes.data.success) {
        setRedemptions(historyRes.data.data);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to load rewards", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (itemId: string, requiredCoins: number) => {
    if (coins < requiredCoins) {
      showToast("You don't have enough coins!", "error");
      return;
    }

    if (!window.confirm("Redeem this reward?")) return;

    try {
      const res = await api.post(`/customer/rewards/redeem/${itemId}`);
      if (res.data.success) {
        showToast("Reward redeemed successfully!", "success");
        setCoins(res.data.data.coinsRemaining);
        fetchData();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to redeem", "error");
    }
  };

  if (loading) return <IconLoader forceShow />;

  return (
    <div className="pb-24">
      {/* Premium Village Header - Compact */}
      <div className="px-4 py-4 bg-[#8B3D28] border-b border-white/10 mb-4 sticky top-0 z-20 flex items-center gap-3 shadow-lg">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <button onClick={() => navigate(-1)} className="p-1.5 text-white hover:bg-white/10 rounded-full transition-all active:scale-95 z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-sm font-black text-white uppercase tracking-[0.2em] font-poppins z-10">Village Rewards</h1>
      </div>

      <div className="px-4">
        {/* Compact Balance Banner */}
        <div className="village-card paper-texture organic-radius p-4 mb-6 relative overflow-hidden bg-[#4A7C59] border-none shadow-[0_8px_20px_rgba(74,124,89,0.2)]">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black text[#8B3D28]/70 uppercase tracking-widest mb-1">Your Earnings</h2>
              <p className="text-[11px] text-[#8B3D28]/90 font-bold leading-tight max-w-[140px]">Earn 1 coin for every successful delivery!</p>
            </div>
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
              <span className="text-[8px] font-black text-[#8B3D28] uppercase tracking-tighter mb-1 opacity-70">Coin Balance</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🪙</span>
                <span className="text-2xl font-black text-[#8B3D28] leading-none">{coins}</span>
              </div>
            </div>
          </div>
          {/* Decorative coin vectors in background */}
          <div className="absolute -bottom-4 -left-4 text-white/5 text-6xl rotate-12 select-none pointer-events-none">🪙</div>
          <div className="absolute -top-4 -right-2 text-white/10 text-4xl rotate-45 select-none pointer-events-none">🪙</div>
        </div>

        {/* Compact Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-village-umber/5 rounded-xl border border-village-umber/5">
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'rewards' 
              ? 'bg-[#8B3D28] text-white shadow-md' 
              : 'text-village-umber/50 hover:bg-white/50'
            }`}
          >
            Available Rewards
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'history' 
              ? 'bg-[#8B3D28] text-white shadow-md' 
              : 'text-village-umber/50 hover:bg-white/50'
            }`}
          >
            History
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "rewards" ? (
            <motion.div 
              key="rewards-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3"
            >
              {items.map((item) => (
                <div key={item._id} className="village-card paper-texture organic-radius overflow-hidden flex flex-col bg-white shadow-sm border border-neutral-100/50">
                  <div className="aspect-[4/3] w-full bg-neutral-50 relative p-3 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain drop-shadow-md" />
                    ) : (
                      <span className="text-3xl">🎁</span>
                    )}
                    <div className="absolute top-1.5 right-1.5 bg-[#4A7C59] text-white font-black px-2 py-0.5 rounded-full text-[9px] shadow-sm flex items-center gap-1">
                      <span>🪙</span> {item.coinsRequired}
                    </div>
                  </div>
                  <div className="p-2.5 flex flex-col flex-1">
                    <h3 className="text-[11px] font-black text-village-umber uppercase tracking-tight line-clamp-1 mb-0.5">{item.name}</h3>
                    <p className="text-[9px] font-bold text-neutral-400 italic line-clamp-2 min-h-[22px] mb-2">{item.description}</p>
                    
                    <div className="mt-auto flex items-center justify-between gap-2">
                       <span className="text-[7px] font-black text-neutral-300 uppercase shrink-0">{item.stock} LEFT</span>
                       <button
                        onClick={() => handleRedeem(item._id, item.coinsRequired)}
                        disabled={coins < item.coinsRequired}
                        className={`h-7 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${
                          coins >= item.coinsRequired
                          ? 'bg-[#4A7C59] text-white shadow-md shadow-[#4A7C59]/20'
                          : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                        }`}
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="col-span-full py-10 text-center village-card paper-texture organic-radius border-dashed border-neutral-300 bg-neutral-50/50">
                  <span className="text-2xl mb-2 block">🍂</span>
                  <h3 className="text-[11px] font-black text-village-umber uppercase opacity-60">No Rewards Yet</h3>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-2"
            >
              {redemptions.length > 0 ? (
                redemptions.map((order) => (
                  <div key={order._id} className="village-card paper-texture organic-radius p-3 flex items-center gap-3 bg-white hover:bg-neutral-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neutral-50 flex-shrink-0 flex items-center justify-center p-1.5 border border-neutral-100">
                      <img
                        src={order.rewardItem?.imageUrl || "https://placehold.co/100x100?text=Gift"}
                        alt=""
                        className="w-full h-full object-contain opacity-80"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-black text-village-umber uppercase tracking-tight truncate">{order.rewardItem?.name || "Deleted Item"}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-red-500">- 🪙 {order.coinsSpent}</span>
                        <span className="text-[9px] text-neutral-300">•</span>
                        <span className="text-[9px] font-bold text-neutral-400">{new Date(order.orderDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'Fulfilled' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center village-card paper-texture organic-radius bg-neutral-50/50">
                  <span className="text-2xl mb-2 block">📜</span>
                  <h3 className="text-[11px] font-black text-village-umber uppercase opacity-40">No History</h3>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

