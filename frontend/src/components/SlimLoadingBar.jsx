import React from 'react';

const SlimLoadingBar = () => {
    return (
        <div className="fixed top-0 left-0 w-full h-[3px] z-[9999] overflow-hidden">
            <div className="h-full w-full bg-transparent">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-progress-indeterminate"></div>
            </div>
            <style>{`
                @keyframes progress-indeterminate {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(50%); }
                    100% { transform: translateX(100%); }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 1.5s infinite linear;
                    width: 50%; /* Bar width relative to screen */
                }
            `}</style>
        </div>
    );
};

export default SlimLoadingBar;
