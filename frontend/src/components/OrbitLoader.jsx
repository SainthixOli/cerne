import React from 'react';

const OrbitLoader = () => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
            <div className="relative w-8 h-8 flex items-center justify-center fade-in">
                {/* Core (Cerne) */}
                <div className="absolute w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>

                {/* Orbit Path (Optional visual guide, maybe too messy, keeping it invisible or very faint) */}
                <div className="absolute w-6 h-6 border border-blue-200/20 dark:border-blue-500/20 rounded-full"></div>

                {/* Orbiting Electron */}
                <div className="absolute w-full h-full animate-spin-orbit">
                    <div className="w-1.5 h-1.5 bg-purple-500 dark:bg-purple-400 rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                </div>
            </div>

            <style>{`
                @keyframes spin-orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-orbit {
                    animation: spin-orbit 1s linear infinite;
                }
                .fade-in {
                    animation: fadeIn 0.4s ease-out backwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default OrbitLoader;
