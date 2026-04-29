import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Redeem() {
  const [rewards, setRewards] = useState([]);
  const [coins, setCoins] = useState(0);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [profileRes, rewardsRes] = await Promise.all([
      supabase.from('profiles').select('coins').eq('id', user.id).single(),
      supabase.from('rewards').select('*').eq('is_active', true).order('coin_cost', { ascending: true })
    ]);

    if (profileRes.data) setCoins(profileRes.data.coins);
    if (rewardsRes.data) setRewards(rewardsRes.data);
    setLoading(false);
  };

  const handleRedeem = async (reward) => {
    if (coins < reward.coin_cost) {
      alert("Insufficient Coins! Keep grinding. 🔥");
      return;
    }

    if (!window.confirm(`Redeem ${reward.title} for 🪙 ${reward.coin_cost}?`)) return;

    setProcessing(true);
    const newBalance = coins - reward.coin_cost;

    // 1. Create Redemption Request
    const { error: redeemError } = await supabase.from('redemptions').insert([
      { 
        user_id: userId, 
        reward_title: reward.title, 
        coin_cost: reward.coin_cost,
        status: 'pending' 
      }
    ]);

    if (!redeemError) {
      // 2. Deduct Coins from Profile
      await supabase.from('profiles').update({ coins: newBalance }).eq('id', userId);
      setCoins(newBalance);
      alert("Request Sent! Admin will process it within 24 hours. 🛰️");
    } else {
      alert("Error: " + redeemError.message);
    }
    setProcessing(false);
  };

  return (
    <div className="px-6 pt-10 pb-20 relative flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="relative z-10">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Payout Vault</h2>
        <p className="text-gray-500 text-xs font-black tracking-[0.2em] uppercase mt-1">Convert your grind to cash</p>
      </div>

      {/* BALANCE CARD */}
      <div className="glass-panel p-6 border-star-blue/30 bg-star-blue/5 relative z-10 flex justify-between items-center overflow-hidden">
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-star-blue rounded-full blur-[50px] opacity-20"></div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Available Balance</p>
          <p className="text-3xl font-black text-white mt-1 tracking-tighter">🪙 {coins.toLocaleString()}</p>
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl border border-white/10">
          💰
        </div>
      </div>

      {/* REWARDS GRID */}
      <div className="relative z-10 grid grid-cols-1 gap-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="glass-panel p-5 flex items-center justify-between border-white/5 hover:border-white/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/5">
                {reward.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white tracking-tight">{reward.title}</span>
                <span className="text-yellow-400 font-black text-xs uppercase tracking-widest mt-0.5">
                  Cost: {reward.coin_cost}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleRedeem(reward)}
              disabled={processing}
              className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                coins >= reward.coin_cost 
                ? 'bg-white text-black hover:bg-star-blue hover:text-white shadow-xl shadow-white/5' 
                : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
              }`}
            >
              {processing ? '...' : 'REDEEM'}
            </button>
          </div>
        ))}
      </div>

      {/* Ambient Glow */}
      <div className="absolute bottom-20 left-0 w-64 h-64 bg-nebula-purple rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
    </div>
  );
}