import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function CompleteProfile({ onComplete, userId }) {
  const [formData, setFormData] = useState({ name: '', age: '', gender: '' });
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.phone) {
        setPhone(user.user_metadata.phone);
      }
    };
    fetchMetadata();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // FIX: Using .upsert() ensures the row is created if it doesn't exist
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId, // Must include ID for upsert to work
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: phone,
        coins: 0,           // Initialize with 0
        current_streak: 0   // Initialize with 0
      });

    if (error) {
      console.error("Save Error:", error.message);
      alert("Error saving profile: " + error.message);
    } else {
      onComplete(); 
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-[#050505]">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-nebula-purple rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
      
      <div className="glass-panel w-full max-w-md p-8 relative z-10 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-white">Create Profile</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">Set up your avatar to start earning.</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-star-blue transition-all"
          />
          <input
            type="number"
            placeholder="Age"
            required
            min="10"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-star-blue transition-all"
          />
          <select
            required
            value={formData.gender}
            onChange={(e) => setFormData({...formData, gender: e.target.value})}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none appearance-none"
          >
            <option value="" disabled className="text-gray-900">Select Gender</option>
            <option value="Male" className="text-gray-900">Male</option>
            <option value="Female" className="text-gray-900">Female</option>
            <option value="Other" className="text-gray-900">Other</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-nebula-purple to-star-blue rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Enter Galaxy 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}