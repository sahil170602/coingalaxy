import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const rewardsList = [
  { id: 1, title: '₹10 Mobile Recharge', type: 'real', cost: 1000, icon: '📱', color: 'from-green-500 to-emerald-700' },
  { id: 2, title: 'Amazon 10% Off', type: 'affiliate', cost: 500, icon: '📦', color: 'from-orange-400 to-red-500' },
  { id: 3, title: 'Flipkart Deal', type: 'affiliate', cost: 300, icon: '👕', color: 'from-blue-400 to-indigo-600' },
  { id: 4, title: '₹500 Swiggy Voucher', type: 'hype', cost: 5000, icon: '🍔', color: 'from-gray-600 to-gray-800' }
];

export default function Rewards() {
  const cached = JSON.parse(localStorage.getItem('coinGalaxy_dashboard'));
  const [balance, setBalance] = useState(cached?.coins || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const syncBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('coins').eq('id', user.id).single();
      if (data) setBalance(data.coins);
    };
    syncBalance();
  }, []);

  const handleRedeem = async (reward) => {
    if (balance < reward.cost) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Log the redemption request
    const { error: redeemError } = await supabase.from('redemptions').insert([{
      user_id: user.id,
      reward_title: reward.title,
      coin_cost: reward.cost,
      status: reward.type === 'affiliate' ? 'completed' : 'pending'
    }]);

    if (!redeemError) {
      // 2. Deduct coins from profile
      const newBalance = balance - reward.cost;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: newBalance })
        .eq('id', user.id);

      if (!updateError) {
        setBalance(newBalance);
        // Update dashboard cache so the coin count is consistent everywhere
        const newCache = { ...cached, coins: newBalance };
        localStorage.setItem('coinGalaxy_dashboard', JSON.stringify(newCache));
        alert(`Success! ${reward.title} requested.`);
      }
    }
    setLoading(false);
  };

  return (
<div className="w-full px-6 pt-5 relative flex flex-col gap-6">      
      <div className="flex flex-col items-center justify-center mb-4 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)] mb-3">
          <span className="text-4xl">🪙</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-wide">Loot Drop</h2>
        <p className="text-gray-400 text-sm mt-1">
          Available: <span className="text-yellow-400 font-bold">{balance.toLocaleString()} Coins</span>
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        {rewardsList.map((reward) => (
          <div key={reward.id} className="glass-panel p-5 relative overflow-hidden group">
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${reward.color} rounded-full mix-blend-screen filter blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{reward.icon}</div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-white">{reward.title}</span>
                  <span className="text-xs text-gray-400 italic">
                    {reward.type === 'real' ? 'Verified Payout' : reward.type === 'hype' ? 'Unlocks at Level 5' : 'Instant Discount'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center relative z-10 border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 text-sm">🪙</span>
                <span className="font-bold text-white">{reward.cost}</span>
              </div>

              <button
                onClick={() => handleRedeem(reward)}
                disabled={loading || reward.type === 'hype' || balance < reward.cost}
                className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                  reward.type === 'hype' ? 'bg-white/5 text-gray-500' :
                  balance >= reward.cost ? 'bg-gradient-to-r from-nebula-purple to-star-blue text-white shadow-lg active:scale-95' : 
                  'bg-white/10 text-gray-400'
                }`}
              >
                {reward.type === 'hype' ? 'Locked' : balance >= reward.cost ? (loading ? '...' : 'Redeem') : 'Low Balance'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}