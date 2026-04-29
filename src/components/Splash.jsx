export default function Splash() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center w-screen h-screen overflow-hidden bg-galaxy-dark touch-none overscroll-none">
      
      {/* Deep space animated glowing background */}
      {/* Added pointer-events-none so the blobs don't interfere with the screen */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-nebula-purple rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-star-blue rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-pulse pointer-events-none"></div>

      {/* Center Logo Area */}
      <div className="relative z-10 flex flex-col items-center animate-[bounce_2s_infinite]">
        <div className="w-24 h-24 bg-gradient-to-br from-nebula-purple to-star-blue rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.6)] flex items-center justify-center mb-6">
          <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">🌌</span>
        </div>
      </div>

      {/* Brand Text */}
      <h1 className="relative z-10 text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-lg mb-2">
        COIN GALAXY
      </h1>
      <p className="relative z-10 text-star-blue font-medium tracking-widest text-sm uppercase">
        Loading Universe...
      </p>
    </div>
  );
}