import React from 'react';

const ProceduralLoader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse"></div>

                {/* SVG Procedural X */}
                <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>

                    {/* Line 1: Top-Left to Bottom-Right */}
                    <path
                        d="M 20 20 L 80 80"
                        stroke="url(#grad1)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="animate-draw-line-1"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                    />

                    {/* Line 2: Top-Right to Bottom-Left */}
                    <path
                        d="M 80 20 L 20 80"
                        stroke="url(#grad1)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="animate-draw-line-2"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                    />
                </svg>

                {/* Loading Text */}
                <div className="absolute -bottom-12 text-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold tracking-widest text-sm uppercase animate-pulse">
                        Carregando Dados
                    </span>
                </div>
            </div>

            <style>{`
                .animate-draw-line-1 {
                    animation: draw 1.5s ease-in-out infinite alternate;
                }
                .animate-draw-line-2 {
                    animation: draw 1.5s ease-in-out 0.2s infinite alternate;
                }
                @keyframes draw {
                    0% { stroke-dashoffset: 100; opacity: 0.5; }
                    100% { stroke-dashoffset: 0; opacity: 1; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)); }
                }
            `}</style>
        </div>
    );
};

export default ProceduralLoader;
