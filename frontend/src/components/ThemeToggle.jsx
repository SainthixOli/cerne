import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Alternar Tema"
        >
            {theme === 'light' && <Sun size={20} className="text-orange-500" />}
            {theme === 'dark' && <Moon size={20} className="text-blue-400" />}
            {theme === 'black' && <Monitor size={20} className="text-gray-400" />}
        </button>
    );
};

export default ThemeToggle;
