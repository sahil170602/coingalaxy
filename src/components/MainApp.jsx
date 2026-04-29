import { useState } from 'react';
import Dashboard from './Dashboard';
import Leaderboard from './Leaderboard';
import Rewards from './Rewards';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
   <div className="fixed inset-0 h-screen w-screen bg-galaxy-dark text-white overflow-hidden flex flex-col">
    
    {/* Glow Background */}
    <div className="absolute top-0 right-0 w-96 h-96 bg-nebula-purple rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"></div>
    
    {/* SCROLLABLE AREA: This is the ONLY part that moves */}
    <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth pb-0">
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'leaderboard' && <Leaderboard />}
      {activeTab === 'rewards' && <Rewards />}
    </div>

     {/* NAV BAR: Stays pinned outside the scroll area */}
    <div className="fixed bottom-1 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="glass-panel py-3 px-6 flex justify-between items-center rounded-2xl bg-white/5 border-white/10 shadow-2xl backdrop-blur-xl"> 
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-star-blue scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'leaderboard' ? 'text-orange-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="text-xl drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">🔥</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Ranks</span>
          </button>

          <button 
            onClick={() => setActiveTab('rewards')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'rewards' ? 'text-yellow-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="text-xl drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">🎁</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Rewards</span>
          </button>

        </div>
      </div>

    </div>
  );
}