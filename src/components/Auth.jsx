import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { countries } from 'countries-list';

export default function Auth() {
  const countryList = useMemo(() => {
    return Object.entries(countries)
      .map(([code, data]) => {
        const phoneData = Array.isArray(data.phone) ? data.phone[0] : String(data.phone).split(',')[0];
        return {
          code,
          name: data.name,
          emoji: data.emoji,
          dialCode: `+${phoneData}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanPhone = phone.replace(/^\+|^0+/, '').trim();
    const fullPhone = `${countryCode}${cleanPhone}`;
    
    // DEV BYPASS LOGIC
    const dummyEmail = `${fullPhone.replace('+', '')}@coingalaxy.dev`;
    const dummyPassword = 'CoinGalaxyDevPassword123!'; 

    // 1. Try to Login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: dummyPassword,
    });

    // 2. If new user, Sign Up
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: dummyPassword,
        options: {
          data: { phone: fullPhone } // Stores phone in auth.users metadata
        }
      });
      
      if (signUpError) setError(signUpError.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden overscroll-none flex items-center justify-center px-6 bg-[#050505]">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-nebula-purple rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse pointer-events-none"></div>
      
      <div className="glass-panel w-full max-w-md p-8 relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-nebula-purple to-star-blue rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <span className="text-3xl">🌌</span>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-white">Coin Galaxy</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">Enter your mobile number to jump in.</p>

        <form onSubmit={handleNext} className="w-full flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative w-[35%]">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full h-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none appearance-none cursor-pointer text-sm"
              >
                <option value="+91">🇮🇳 +91</option>
                {countryList.map((c) => (
                  <option key={c.code} value={c.dialCode} className="bg-gray-900">
                    {c.emoji} {c.dialCode}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-[65%] px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-star-blue focus:outline-none"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-nebula-purple to-star-blue rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Next 🚀'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-400 text-xs">{error}</p>}
      </div>
    </div>
  );
}