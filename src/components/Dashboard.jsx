import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdMob } from '@capacitor-community/admob'; 

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // MISSION STATES
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeLog, setActiveLog] = useState(null); 
  const [remainingTime, setRemainingTime] = useState(null);

  // --- ANDROID & BROWSER BACK BUTTON PROTECTION ---
  useEffect(() => {
    const handleBack = () => {
      if (selectedTask) {
        setSelectedTask(null);
        setActiveLog(null);
      }
    };

    if (selectedTask) {
      window.history.pushState({ overlayOpen: true }, "");
      window.addEventListener('popstate', handleBack);
    }

    return () => window.removeEventListener('popstate', handleBack);
  }, [selectedTask]);

  useEffect(() => { 
    fetchData(); 
    prepareAd();
  }, []);

  // Timer Tick Logic
  useEffect(() => {
    let timer;
    if (selectedTask?.task_type === 'timer' && activeLog) {
      timer = setInterval(() => {
        const start = new Date(activeLog.started_at).getTime();
        const duration = selectedTask.duration_minutes * 60000;
        const now = new Date().getTime();
        const diff = (start + duration) - now;
        if (diff <= 0) {
          setRemainingTime(0);
          clearInterval(timer);
        } else {
          setRemainingTime(diff);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedTask, activeLog]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const today = new Date().toISOString().split('T')[0];

    const [profileRes, tasksRes, categoriesRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('coins, current_streak').eq('id', user.id).maybeSingle(),
      supabase.from('tasks').select('*').order('reward', { ascending: true }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('task_logs').select('*').eq('user_id', user.id).gte('started_at', today)
    ]);

    if (tasksRes.data) {
      const logs = logsRes.data || [];
      const completedIds = logs.filter(l => l.completed_at).map(l => l.task_id);
      setTasks(tasksRes.data.map(t => ({
        ...t,
        completed: completedIds.includes(t.id),
        inProgress: logs.find(l => l.task_id === t.id && !l.completed_at)
      })));
      setCategories(categoriesRes.data || []);
      setCoins(profileRes.data?.coins || 0);
      setStreak(profileRes.data?.current_streak || 0);
    }
    setLoading(false);
  };

  // --- AD SYSTEM ---
  const prepareAd = async () => {
    try {
      await AdMob.prepareInterstitial({ adId: 'ca-app-pub-8456439900730561/6965170697' });
      await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-8456439900730561/2763035955' });
    } catch (e) { console.warn("AdMob is mobile-only."); }
  };

  const handleRewardedAdTask = async () => {
    return new Promise(async (resolve) => {
      // Bypass for Web testing
      if (!window.Capacitor?.isNativePlatform) {
        console.log("Web Mode: Simulating 2s Ad...");
        setTimeout(() => resolve(true), 2000);
        return;
      }
      try {
        const reward = await AdMob.showRewardVideoAd();
        resolve(!!reward);
      } catch (e) {
        console.error("Ad failed:", e);
        resolve(true); // Fallback for dev
      }
    });
  };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setActiveLog(task.inProgress || null);
    setRemainingTime(null);
  };

  const startMission = async () => {
    if (!selectedTask || activeLog) return;
    const { data, error } = await supabase.from('task_logs')
      .insert([{ user_id: userId, task_id: selectedTask.id }])
      .select().single();
    if (!error) {
      setActiveLog(data);
      fetchData();
    }
  };

  const checkConditions = () => {
    if (!selectedTask) return false;
    if (selectedTask.start_hour !== null) {
      const currentHour = new Date().getHours();
      if (currentHour < selectedTask.start_hour || currentHour >= selectedTask.end_hour) {
        return { valid: false, msg: `Locked Until ${selectedTask.start_hour}:00` };
      }
    }
    if (selectedTask.task_type === 'timer') {
      if (!activeLog) return { valid: false, msg: "Start Mission First" };
      if (remainingTime > 0) return { valid: false, msg: `Wait ${Math.ceil(remainingTime / 60000)}m` };
    }
    return { valid: true, msg: "Complete Mission" };
  };

  const handleComplete = async () => {
    const condition = checkConditions();
    if (!condition.valid) return;

    // Trigger Ads
    try {
      if (selectedTask.task_type === 'ad' || selectedTask.title.includes("Ad")) {
        const finished = await handleRewardedAdTask();
        if (!finished) {
          alert("Watch the full video to claim rewards! 📺");
          return; 
        }
      } else {
        await AdMob.showInterstitial();
      }
      prepareAd();
    } catch (e) { console.warn("Ad skip on web."); }

    const newCoins = coins + selectedTask.reward;
    const today = new Date().toISOString().split('T')[0];

    if (activeLog) {
      await supabase.from('task_logs').update({ completed_at: today }).eq('id', activeLog.id);
    } else {
      await supabase.from('task_logs').insert([{ user_id: userId, task_id: selectedTask.id, completed_at: today }]);
    }

    await supabase.from('profiles').update({ coins: newCoins }).eq('id', userId);
    setCoins(newCoins);
    setSelectedTask(null);
    setActiveLog(null);
    fetchData();
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "READY";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="px-6 relative flex flex-col gap-10 pb-32">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl pt-6 pb-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">Coin Galaxy</h2>
            <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]"></p>
          </div>
          <div className="flex gap-3">
            <div className="glass-panel px-3 py-2 flex items-center gap-2 border-orange-500/20 bg-orange-500/5">
              <span className="text-orange-500 text-sm">🔥</span>
              <span className="font-black text-white text-sm">{streak}</span>
            </div>
            <div className="glass-panel px-3 py-2 flex items-center gap-2 border-star-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <span className="text-yellow-400 text-sm">🪙</span>
              <span className="font-black text-white text-sm">{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD LIST */}
      <div className="flex flex-col gap-12">
        {categories.map((cat) => {
          const catTasks = tasks.filter(t => t.category === cat.id);
          if (catTasks.length === 0) return null;
          return (
            <section key={cat.id} className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-star-blue/60 ml-1">
                {cat.icon} {cat.label}
              </h3>
              <div className="flex flex-col gap-3">
                {catTasks.map((task) => (
                  <button 
                    key={task.id} 
                    onClick={() => handleOpenTask(task)}
                    className={`glass-panel p-5 flex items-center justify-between text-left transition-all ${
                      task.completed ? 'opacity-40 grayscale' : 'hover:border-white/20 active:scale-95'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-lg tracking-tight">{task.title}</span>
                      <span className="text-yellow-400 font-black text-xs">+{task.reward} Coins</span>
                    </div>
                    <div className="text-gray-500 font-black text-[10px] uppercase tracking-widest">
                      {task.completed ? '✓' : task.inProgress ? '●' : '→'}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* MISSION OVERLAY */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-lg">
            <button onClick={() => window.history.back()} className="text-gray-500 font-black text-xs uppercase tracking-widest">Cancel</button>
            <span className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Mission Protocol</span>
            <div className="w-12"></div>
          </div>

          <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex flex-col items-center gap-6 mb-12">
              <span className="text-7xl p-8 bg-white/5 rounded-[2.5rem] shadow-inner">{selectedTask.icon}</span>
              <h2 className="text-4xl font-black text-white tracking-tighter text-center leading-none">{selectedTask.title}</h2>
              <div className="px-5 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.05)]">
                <span className="text-yellow-400 font-black text-sm uppercase tracking-widest">🪙 {selectedTask.reward} Reward</span>
              </div>
            </div>

            <div className="glass-panel p-6 mb-6 border-white/5">
              <h4 className="text-[10px] font-black uppercase text-star-blue tracking-[0.2em] mb-4">Objective Details</h4>
              <p className="text-gray-300 text-sm leading-relaxed font-medium">{selectedTask.instructions}</p>
            </div>

            {selectedTask.task_type === 'timer' && activeLog && (
              <div className="glass-panel p-10 flex flex-col items-center border-star-blue/20 bg-star-blue/5">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Time to Extraction</p>
                <p className="text-6xl font-black text-white tracking-tighter">
                  {formatTime(remainingTime)}
                </p>
              </div>
            )}
          </div>

          <div className="p-8 bg-[#0a0a0a] border-t border-white/5 pb-12">
            {selectedTask.completed ? (
              <div className="w-full py-5 text-center text-green-500 font-black uppercase tracking-widest bg-green-500/5 rounded-2xl border border-green-500/10">
                ✓ Mission Accomplished
              </div>
            ) : !activeLog && !['click', 'ad'].includes(selectedTask.task_type) ? (
              <button 
                onClick={startMission}
                className="w-full py-5 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(250,204,21,0.2)] active:scale-95 transition-all"
              >
                Start Mission 🚀
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={!checkConditions().valid}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all ${
                  checkConditions().valid 
                  ? 'bg-gradient-to-r from-nebula-purple to-star-blue text-white shadow-lg' 
                  : 'bg-white/5 text-gray-600 border border-white/5 opacity-50'
                }`}
              >
                {checkConditions().valid ? (selectedTask.task_type === 'ad' ? 'Watch Ad to Claim 📺' : 'Claim Reward ✓') : checkConditions().msg}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}