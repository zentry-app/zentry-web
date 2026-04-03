"use client";

import React from "react";
import { motion } from "framer-motion";

const PremiumHeroAnimation = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative w-full aspect-square max-w-[600px] mx-auto ${className}`}>
      {/* Background Glow */}
      <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-[100px] mix-blend-screen" />
      <div className="absolute inset-[20%] rounded-full bg-cyan-400/20 blur-[80px] mix-blend-screen" />

      <svg
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        <defs>
          <linearGradient id="phoneGrad" x1="0" y1="0" x2="800" y2="800" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#00f2fe" />
            <stop offset="1" stopColor="#4facfe" />
          </linearGradient>

          <linearGradient id="blueGlow" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#0070FF" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>

          <filter id="neonBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Orbit Rings */}
        <motion.circle
          cx="400"
          cy="400"
          r="300"
          stroke="url(#blueGlow)"
          strokeWidth="1"
          strokeDasharray="4 12"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ originX: "50%", originY: "50%" }}
          opacity="0.3"
        />
        <motion.circle
          cx="400"
          cy="400"
          r="220"
          stroke="url(#cyanGlow)"
          strokeWidth="2"
          strokeDasharray="10 20"
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ originX: "50%", originY: "50%" }}
          opacity="0.4"
        />

        {/* Central Core (Phone / App representation) */}
        <motion.g
          initial={{ y: 20 }}
          animate={{ y: -20 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        >
          {/* Glass Phone Frame */}
          <rect x="280" y="200" width="240" height="420" rx="32" fill="url(#phoneGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="4" className="backdrop-blur-xl" />

          {/* Screen inner shadow / glow */}
          <rect x="290" y="210" width="220" height="400" rx="24" fill="#0b1220" stroke="url(#cyanGlow)" strokeWidth="1" opacity="0.8" />

          {/* Top Notch */}
          <rect x="360" y="220" width="80" height="15" rx="7.5" fill="#1e293b" />

          {/* App UI Elements Floating inside phone */}
          <motion.rect x="310" y="260" width="180" height="40" rx="10" fill="url(#blueGlow)" opacity="0.2"
            animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
          <rect x="325" y="275" width="100" height="10" rx="5" fill="#4facfe" />
          <circle cx="465" cy="280" r="8" fill="#00f2fe" />

          {/* Cards */}
          <rect x="310" y="320" width="85" height="100" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          <rect x="405" y="320" width="85" height="100" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />

          {/* Large Card (QR) */}
          <rect x="310" y="440" width="180" height="120" rx="16" fill="url(#cyanGlow)" opacity="0.1" stroke="url(#cyanGlow)" strokeWidth="1" />

          {/* QR Inner */}
          <g fill="#00f2fe">
            <rect x="360" y="465" width="20" height="20" rx="4" />
            <rect x="420" y="465" width="20" height="20" rx="4" />
            <rect x="360" y="515" width="20" height="20" rx="4" />
            <rect x="390" y="490" width="20" height="20" rx="4" />
            <rect x="420" y="515" width="20" height="20" rx="2" />
          </g>

          {/* Scanning Beam Over QR */}
          <motion.g
            animate={{ y: [0, 60, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <line x1="330" y1="460" x2="470" y2="460" stroke="#00f2fe" strokeWidth="2" filter="url(#neonBlur)" />
            <polygon points="330,460 470,460 490,480 310,480" fill="#00f2fe" opacity="0.1" />
          </motion.g>

        </motion.g>

        {/* Floating Elements (Security Shield) */}
        <motion.g
          initial={{ y: -10, x: -10 }}
          animate={{ y: 15, x: 10 }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        >
          {/* Outer glow shield */}
          <path d="M 220 280 C 220 280 260 270 260 230 C 260 230 260 300 220 340 C 180 300 180 230 180 230 C 180 270 220 280 220 280 Z" fill="none" stroke="url(#cyanGlow)" strokeWidth="4" filter="url(#neonBlur)" opacity="0.6" />
          {/* Inner core shield */}
          <path d="M 220 280 C 220 280 260 270 260 230 C 260 230 260 300 220 340 C 180 300 180 230 180 230 C 180 270 220 280 220 280 Z" fill="url(#cyanGlow)" stroke="#fff" strokeWidth="2" opacity="0.9" />
          {/* Checkmark inside shield */}
          <path d="M 205 285 L 215 295 L 235 265" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Floating Elements (House / Building) */}
        <motion.g
          initial={{ y: 20, x: 10 }}
          animate={{ y: -15, x: -5 }}
          transition={{ duration: 4.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
        >
          {/* Isometric House shape */}
          <path d="M 580 250 L 640 290 L 640 360 L 520 360 L 520 290 Z" fill="rgba(11,18,32,0.8)" stroke="url(#blueGlow)" strokeWidth="3" filter="url(#neonBlur)" opacity="0.5" className="backdrop-blur-md" />
          <path d="M 580 250 L 640 290 L 640 360 L 520 360 L 520 290 Z" fill="url(#phoneGrad)" stroke="url(#blueGlow)" strokeWidth="2" />
          <path d="M 510 295 L 580 245 L 650 295" fill="none" stroke="#00f2fe" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#neonBlur)" />
          {/* House Window */}
          <rect x="560" y="310" width="40" height="30" rx="4" fill="url(#cyanGlow)" opacity="0.8" />
          <line x1="580" y1="310" x2="580" y2="340" stroke="#0b1220" strokeWidth="2" />
          <line x1="560" y1="325" x2="600" y2="325" stroke="#0b1220" strokeWidth="2" />
        </motion.g>

        {/* Connection Nodes (Lines connecting the floating elements to the phone) */}
        <motion.path
          d="M 240 280 Q 280 240 310 320"
          fill="none"
          stroke="url(#cyanGlow)"
          strokeWidth="2"
          strokeDasharray="5 5"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        <motion.path
          d="M 540 320 Q 500 280 470 360"
          fill="none"
          stroke="url(#blueGlow)"
          strokeWidth="2"
          strokeDasharray="5 5"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Floating Sparks / Particles */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.circle
            key={i}
            cx={300 + Math.random() * 200}
            cy={200 + Math.random() * 400}
            r={1.5 + Math.random() * 2}
            fill="#fff"
            filter="url(#neonBlur)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -40]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default PremiumHeroAnimation;
