import React from 'react';

const AnimatedHeroSvg = ({ className }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 800 600" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Animación 3D de acceso inteligente Zentry"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="navyglow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="50%" stopColor="#111827" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
        <linearGradient id="cyanglow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#4facfe" />
        </linearGradient>
        <linearGradient id="beamGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="aurora" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#1e3a8a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0b1220" stopOpacity="0" />
        </radialGradient>
        
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Global animations */}
        <style>
          {`
            @keyframes floatQR {
              0% { transform: translate(150px, 450px); opacity: 0; }
              15% { transform: translate(300px, 375px); opacity: 1; }
              32% { transform: translate(300px, 375px); opacity: 1; }
              50% { transform: translate(450px, 300px); opacity: 1; }
              65%, 100% { transform: translate(650px, 200px); opacity: 0; }
            }
            @keyframes scanAnim {
              0%, 15% { transform: translateY(-40px); opacity: 0; }
              18% { opacity: 1; }
              30% { transform: translateY(40px); opacity: 1; }
              32%, 100% { transform: translateY(40px); opacity: 0; }
            }
            @keyframes liftGate {
              0%, 30% { transform: translate(400px, 210px) rotate(26.5deg); }
              40%, 65% { transform: translate(400px, 210px) rotate(-55deg); }
              75%, 100% { transform: translate(400px, 210px) rotate(26.5deg); }
            }
            @keyframes pulseApprove {
              0%, 30% { r: 0; opacity: 0; stroke-width: 15px; }
              32% { r: 20px; opacity: 1; stroke-width: 25px; }
              50% { r: 200px; opacity: 0; stroke-width: 1px; }
              100% { r: 200px; opacity: 0; }
            }
            @keyframes sparkle1 {
              0%, 30% { transform: translate(300px, 375px) scale(0); opacity: 0; }
              35% { transform: translate(260px, 310px) scale(1); opacity: 1; }
              45%, 100% { transform: translate(240px, 280px) scale(0); opacity: 0; }
            }
            @keyframes sparkle2 {
              0%, 31% { transform: translate(300px, 375px) scale(0); opacity: 0; }
              36% { transform: translate(350px, 340px) scale(1.5); opacity: 1; }
              46%, 100% { transform: translate(380px, 320px) scale(0); opacity: 0; }
            }
            @keyframes sparkle3 {
              0%, 32% { transform: translate(300px, 375px) scale(0); opacity: 0; }
              37% { transform: translate(250px, 420px) scale(1.2); opacity: 1; }
              47%, 100% { transform: translate(220px, 450px) scale(0); opacity: 0; }
            }

            .qr-card-group { animation: floatQR 8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
            .scan-beam-group { animation: scanAnim 8s ease-in-out infinite; }
            .gate-arm { 
              transform: translate(400px, 210px) rotate(26.5deg);
              animation: liftGate 8s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
            }
            .approval-pulse { animation: pulseApprove 8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }
            .sparkle-pt1 { animation: sparkle1 8s ease-out infinite; }
            .sparkle-pt2 { animation: sparkle2 8s ease-out infinite; }
            .sparkle-pt3 { animation: sparkle3 8s ease-out infinite; }
            
            /* Add subtle global breathing to the whole scene */
            .scene-breath { animation: breath 10s ease-in-out infinite; transform-origin: center; }
            @keyframes breath {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
          `}
        </style>
      </defs>

      {/* SVG Background Box */}
      <rect width="800" height="600" fill="url(#navyglow)" rx="48" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
      
      {/* Ambient background light */}
      <circle cx="400" cy="300" r="350" fill="url(#aurora)" />

      {/* Isometric Grid/Platform (Background elements) */}
      <g className="scene-breath">
        {/* Main Base Plate */}
        <path d="M 400 500 L 700 350 L 400 200 L 100 350 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(0, 242, 254, 0.15)" strokeWidth="2" />
        <path d="M 100 350 L 400 500 L 700 350 L 700 370 L 400 520 L 100 370 Z" fill="rgba(0, 242, 254, 0.05)" />
        
        {/* Inner glow lines */}
        <path d="M 400 470 L 640 350 L 400 230 L 160 350 Z" fill="none" stroke="rgba(0, 242, 254, 0.3)" strokeDasharray="10 10" strokeWidth="1.5" />

        {/* --- Post Structure --- */}
        {/* Wait, coordinates earlier had arm at 360,220. Let's make the post slightly larger and center-right */}
        {/* Pivot x=400, y=210. So the post top should be near there. */}
        {/* Right face */}
        <polygon points="380,210 420,190 420,380 380,400" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        {/* Left face */}
        <polygon points="340,190 380,210 380,400 340,380" fill="#1e293b" />
        {/* Top face */}
        <polygon points="340,190 380,170 420,190 380,210" fill="url(#cyanglow)" opacity="0.8" filter="url(#glow)" />
        {/* Cyberpunk details on post */}
        <line x1="360" y1="230" x2="360" y2="350" stroke="#00f2fe" strokeWidth="2" opacity="0.5" />
        <circle cx="400" cy="210" r="8" fill="#fff" />

        {/* Secondary post (Support) */}
        <polygon points="180,310 200,300 200,380 180,390" fill="#0f172a" />
        <polygon points="160,300 180,310 180,390 160,380" fill="#1e293b" />
        <polygon points="160,300 180,290 200,300 180,310" fill="#4facfe" />
      </g>

      {/* Pulsing ring of approval */}
      <circle cx="300" cy="375" r="0" fill="none" stroke="#00f2fe" filter="url(#glow)" className="approval-pulse" />

      {/* --- Gate Arm --- */}
      {/* We apply the transform via class */}
      <g className="gate-arm">
        <rect x="0" y="-8" width="280" height="16" rx="8" fill="#1e293b" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <rect x="15" y="-3" width="250" height="6" rx="3" fill="url(#cyanglow)" filter="url(#glow)" />
        {/* Joint / Pivot circle */}
        <circle cx="0" cy="0" r="24" fill="#0f172a" />
        <circle cx="0" cy="0" r="18" fill="#1e293b" />
        <circle cx="0" cy="0" r="8" fill="#00f2fe" filter="url(#glow)" />
      </g>

      {/* --- Floating QR Card --- */}
      <g className="scene-breath">
        <g className="qr-card-group">
          {/* Subtle shadow underneath the card on the platform */}
          <ellipse cx="0" cy="80" rx="30" ry="15" fill="rgba(0, 242, 254, 0.15)" filter="url(#glow)" />
          
          {/* Card Body */}
          <rect x="-40" y="-60" width="80" height="120" rx="12" fill="rgba(11, 18, 32, 0.7)" stroke="#00f2fe" strokeWidth="2" backdropFilter="blur(8px)" />
          
          {/* Profile pic / Avatar Mock */}
          <circle cx="0" cy="-30" r="15" fill="rgba(255, 255, 255, 0.1)" stroke="#4facfe" strokeWidth="1.5" />
          
          {/* Content lines */}
          <rect x="-25" y="-5" width="50" height="4" rx="2" fill="rgba(255, 255, 255, 0.4)" />
          <rect x="-25" y="5" width="30" height="4" rx="2" fill="rgba(255, 255, 255, 0.2)" />
          
          {/* QR Code Dots Mock */}
          <rect x="-20" y="20" width="12" height="12" rx="2" fill="#00f2fe" />
          <rect x="8" y="20" width="12" height="12" rx="2" fill="#00f2fe" />
          <rect x="-20" y="40" width="12" height="12" rx="2" fill="#00f2fe" />
          <rect x="8" y="40" width="12" height="12" rx="2" fill="#00f2fe" opacity="0.6" />

          {/* Hologram / Scanning Beam overlay */}
          <g className="scan-beam-group">
            <line x1="-50" y1="0" x2="50" y2="0" stroke="#fff" strokeWidth="3" filter="url(#glow)" />
            <polygon points="-50,0 50,0 60,35 -60,35" fill="url(#beamGlow)" />
            <circle cx="0" cy="0" r="3" fill="#fff" />
          </g>
        </g>
      </g>

      {/* --- Sparkles and Particles --- */}
      <g className="sparkles-container">
        {/* Creating multiple sparkles with slightly different shapes/rotations */}
        <g className="sparkle-pt1 text-white">
          <path d="M 0,-15 L 2,-4 L 10,-2 L 2,0 L 0,15 L -2,0 L -10,-2 L -2,-4 Z" fill="#fff" filter="url(#glow)" />
        </g>
        <g className="sparkle-pt2 text-white" style={{ transformOrigin: 'center', rotate: '45deg' }}>
          <path d="M 0,-10 L 1.5,-3 L 7,-1.5 L 1.5,0 L 0,10 L -1.5,0 L -7,-1.5 L -1.5,-3 Z" fill="#00f2fe" filter="url(#glow)" />
        </g>
        <g className="sparkle-pt3 text-white">
          <path d="M 0,-20 L 2.5,-5 L 12,-2.5 L 2.5,0 L 0,20 L -2.5,0 L -12,-2.5 L -2.5,-5 Z" fill="#4facfe" filter="url(#glow)" />
        </g>
      </g>
      
      {/* Front glassmorphism overlay / reflections */}
      <path d="M 0 0 L 800 0 L 800 600 L 0 600 Z" fill="url(#navyglow)" opacity="0.1" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
};

export default AnimatedHeroSvg;
