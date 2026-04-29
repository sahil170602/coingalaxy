import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AdMob } from '@capacitor-community/admob';
import Splash from './components/Splash';
import Auth from './components/Auth';
import CompleteProfile from './components/CompleteProfile';
import MainApp from './components/MainApp';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profileStatus, setProfileStatus] = useState('checking'); // 'checking', 'complete', 'incomplete'

  useEffect(() => {
    // 1. GUARANTEED SPLASH TIMER
    // This ensures the splash screen always goes away after 2.8s, regardless of network speed.
    const splashTimer = setTimeout(() => {
      setLoading(false);
    }, 2800);

    // --- APP INITIALIZATION ENGINE ---
    const initializeApp = async () => {
      // 2. Warm up AdMob
      try {
        await AdMob.initialize({
          testingDevices: [], // ADD YOUR REALME 10 PRO ID HERE LATER
          initializeForFamilySafeAds: true,
        });
        console.log("System: AdMob Engine Ready 🛰️");
      } catch (e) {
        console.warn("System: Running in Web Mode - AdMob Disabled");
      }

      // 3. Resolve Auth Session safely
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error; // Catch any silent Supabase network errors

        setSession(currentSession);
        
        if (currentSession) {
          await checkUserProfile(currentSession.user.id);
        } else {
          setProfileStatus('incomplete');
        }
      } catch (err) {
        console.error("Supabase Connection Error:", err.message);
        setProfileStatus('incomplete');
      }
    };

    initializeApp();

    // --- REAL-TIME AUTH LISTENER ---
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await checkUserProfile(newSession.user.id);
      } else {
        setProfileStatus('incomplete');
        // Clear local cache on logout
        localStorage.removeItem('coinGalaxy_dashboard');
      }
    });

    return () => {
      clearTimeout(splashTimer); // Cleanup the timer if component unmounts early
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // --- CORE DATA VALIDATION ---
  const checkUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, coins')
        .eq('id', userId)
        .maybeSingle();

      // If user has a name, they've finished the onboarding
      if (data && data.name) {
        setProfileStatus('complete');
      } else {
        setProfileStatus('incomplete');
      }
    } catch (err) {
      console.error("Profile Check Failure:", err);
      setProfileStatus('incomplete');
    }
  };

  // --- ROUTING SHELL ---
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-star-blue selection:text-white">
      {/* 
        The transition wrapper ensures a smooth fade 
        whenever the routing engine swaps components 
      */}
      <div className={`transition-opacity duration-1000 ${loading ? 'opacity-100' : 'opacity-100'}`}>
        
        {loading ? (
          <Splash />
        ) : !session ? (
          <Auth />
        ) : profileStatus === 'incomplete' ? (
          <CompleteProfile 
            userId={session.user.id} 
            onComplete={() => setProfileStatus('complete')} 
          />
        ) : (
          /* MainApp contains the Dashboard, Vault, and Profile sections */
          <MainApp />
        )}

      </div>

      {/* Global Ambient Glow (Bottom Layer) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-nebula-purple/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-star-blue/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
}