import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Leaderboard() {
  // 1. Stale-while-revalidate caching pattern
  const getCachedData = () => {
    const cache = localStorage.getItem('coinGalaxy_leaderboard');
    return cache ? JSON.parse(cache) : null;
  };

  const cached = getCachedData();

  const [leaders, setLeaders] = useState(cached?.leaders || []);
  const [myStats, setMyStats] = useState(cached?.myStats || { rank: '...', coins: 0 });
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Top 10 Global Users
    const { data: topUsers } = await supabase
      .from('profiles')
      .select('id, name, coins')
      .order('coins', { ascending: false })
      .limit(10);

    // 2. Get current user's coins
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', user.id)
      .single();

    if (myProfile) {
      // 3. Calculate exact global rank efficiently
      // We count how many users have STRICTLY MORE coins than the current user
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('coins', myProfile.coins);

      const exactRank = (count || 0) + 1;
      const formattedStats = { rank: exactRank, coins: myProfile.coins };

      // Update State
      setLeaders(topUsers || []);
      setMyStats(formattedStats);

      // Silently update cache
      localStorage.setItem('coinGalaxy_leaderboard', JSON.stringify({
        leaders: topUsers,
        myStats: formattedStats
      }));
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-400 font-medium tracking-wide animate-pulse">Ranking Hustlers...</div>;
  }

  return (
<div className="w-full px-6 pt-5 relative flex flex-col gap-6">      
      
      {/* Ambient background glow */}
      <div className="absolute top-20 left-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col items-center justify-center mb-2 relative z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.4)] mb-3 transform rotate-12">
          <span className="text-3xl -rotate-12">🏆</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-wide">Top Hustlers</h2>
        <p className="text-gray-400 text-sm mt-1">Weekly Global Ranks</p>
      </div>

      {/* Current User Quick Stat */}
      <div className="glass-panel p-4 flex justify-between items-center relative z-10 border-star-blue/30 bg-star-blue/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-gray-300">
            #{myStats.rank}
          </div>
          <span className="font-semibold text-white">You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-sm">🪙</span>
          <span className="font-bold text-white">{myStats.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="relative z-10 flex flex-col gap-3">
        {leaders.map((leader, index) => {
          const rank = index + 1;
          
          // Determine styles based on rank
          let rankStyle = "bg-white/5 text-gray-400";
          let borderStyle = "border-white/5 hover:border-white/20";
          let nameStyle = "text-white";
          let icon = `#${rank}`;

          if (rank === 1) {
            rankStyle = "bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]";
            borderStyle = "border-yellow-500/30 bg-yellow-500/5";
            nameStyle = "text-yellow-400 font-bold";
            icon = "👑";
          } else if (rank === 2) {
            rankStyle = "bg-gray-300/20 text-gray-300 shadow-[0_0_10px_rgba(209,213,219,0.3)]";
            borderStyle = "border-gray-400/30 bg-gray-400/5";
            icon = "🥈";
          } else if (rank === 3) {
            rankStyle = "bg-orange-700/30 text-orange-400 shadow-[0_0_10px_rgba(194,65,12,0.3)]";
            borderStyle = "border-orange-700/30 bg-orange-700/5";
            icon = "🥉";
          }

          // Format fallback name if user hasn't set one yet
          const displayName = leader.name || `User_${leader.id.substring(0, 4)}`;

          return (
            <div 
              key={leader.id} 
              className={`glass-panel p-4 flex items-center justify-between transition-all duration-300 ${borderStyle}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${rankStyle}`}>
                  {icon}
                </div>
                
                {/* User Name */}
                <span className={`text-lg tracking-wide ${nameStyle}`}>
                  {displayName}
                </span>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wider">{leader.coins.toLocaleString()}</span>
                <span className="text-yellow-400 text-sm drop-shadow-md">🪙</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}