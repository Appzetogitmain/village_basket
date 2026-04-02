import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWalletTransactions, WalletTransaction } from '../../../services/api/customerService';

interface VillageWalletProps {
  balance: number;
}

export default function VillageWallet({ balance }: VillageWalletProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showHistory) {
      fetchTransactions();
    }
  }, [showHistory]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getWalletTransactions();
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <motion.div 
        className="village-card paper-texture organic-radius p-5 bg-gradient-to-br from-[#8B3D28] via-[#8B3D28] to-[#722F1E] text-white overflow-hidden relative group cursor-pointer shadow-[0_20px_50px_-12px_rgba(139,61,40,0.5)] border border-white/10"
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowHistory(true)}
      >
        {/* Cinematic Grain/Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        
        {/* Dynamic Light Blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-[60px] group-hover:bg-white/30 transition-all duration-700 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/20 rounded-full blur-[40px]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                <span className="text-xl filter drop-shadow-md">🧧</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 block leading-none mb-1">Village Wallet</span>
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Status</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#8B3D28] bg-white backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg">Secure</span>
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Available Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-medium text-white/60">₹</span>
                <h2 className="text-4xl font-black tracking-tighter leading-none bg-clip-text text-white drop-shadow-2xl">
                  {balance.toLocaleString('en-IN')}
                </h2>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all shadow-xl">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Statement</span>
            </div>
          </div>
        </div>

        {/* Bottom subtle bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </motion.div>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
            />
            <motion.div 
              className="fixed inset-x-0 bottom-0 z-[110] bg-stone-50 rounded-t-[32px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Header */}
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white relative shrink-0">
                <div className="flex flex-col">
                   <h3 className="text-lg font-black text-village-umber uppercase tracking-tight">Transaction History</h3>
                   <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Village Wallet</span>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                    <div className="animate-spin text-2xl">🪙</div>
                    <p className="text-xs font-black uppercase tracking-widest mt-4">Loading statement...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4 grayscale opacity-30">📜</div>
                    <p className="text-sm font-black text-stone-400 uppercase tracking-widest">No wallet transactions yet</p>
                    <p className="text-[10px] text-stone-300 font-bold uppercase mt-2">Refunds and credits will appear here</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <motion.div 
                      key={tx._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          tx.type === 'Credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {tx.type === 'Credit' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-village-umber leading-tight mb-0.5">{tx.description}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${
                          tx.type === 'Credit' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount}
                        </p>
                        <p className="text-[9px] text-stone-300 font-black uppercase tracking-widest">{tx.status}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer info */}
              <div className="p-6 bg-white border-t border-stone-100 shrink-0">
                <div className="bg-stone-50 p-4 rounded-2xl flex items-center gap-3">
                  <span className="text-lg">💡</span>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight leading-relaxed">
                    Wallet funds never expire and can be used for any village purchase at checkout.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
