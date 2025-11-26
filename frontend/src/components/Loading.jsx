import React from 'react';

const Loading = ({ fullScreen = true, message = 'Carregando...' }) => {
    if (!fullScreen) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-all duration-300">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-b-purple-500 dark:border-b-purple-400 rounded-full animate-spin-reverse opacity-70"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium animate-pulse">{message}</p>
        </div>
    );
};

export default Loading;
