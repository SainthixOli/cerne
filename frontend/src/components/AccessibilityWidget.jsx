import React, { useState, useEffect } from 'react';
import { Accessibility, Type, Sun, Moon, Volume2, Eye, X, ZoomIn, ZoomOut } from 'lucide-react';

const AccessibilityWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [fontSize, setFontSize] = useState(100);
    const [contrastMode, setContrastMode] = useState('normal'); // 'normal', 'neon', 'clean'
    const [clickToReadMode, setClickToReadMode] = useState(false);

    // Setup TTS
    useEffect(() => {
        // Cleanup speech on unmount
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Load preferences
    useEffect(() => {
        const savedFontSize = localStorage.getItem('access_fontSize');
        const savedContrast = localStorage.getItem('access_contrastMode'); // Changed key
        const savedClickToRead = localStorage.getItem('access_clickToRead');

        if (savedFontSize) setFontSize(parseInt(savedFontSize));
        if (savedContrast) {
            setContrastMode(savedContrast);
        }
        if (savedClickToRead === 'true') setClickToReadMode(true);
    }, []);

    // Apply preferences
    useEffect(() => {
        // Font Size
        document.documentElement.style.fontSize = `${itemsToRem(fontSize)}px`;
        localStorage.setItem('access_fontSize', fontSize);

        // Apply Contrast Mode
        // Reset all first
        document.documentElement.classList.remove('high-contrast', 'hc-neon', 'hc-clean'); // Removed 'high-contrast' from here as it's replaced by specific modes

        if (contrastMode === 'neon') {
            document.documentElement.classList.add('hc-neon');
        } else if (contrastMode === 'clean') {
            document.documentElement.classList.add('hc-clean');
        }

        localStorage.setItem('access_contrastMode', contrastMode);

    }, [fontSize, contrastMode]);

    // Click to Read Logic
    useEffect(() => {
        if (!clickToReadMode) {
            document.body.style.cursor = 'default';
            window.speechSynthesis.cancel(); // Stop any ongoing speech when mode is off
            return;
        }

        document.body.style.cursor = 'help'; // Indicate clickable mode

        const handleClickToRead = (e) => {
            // Prevent default action if in reading mode (optional, maybe we want links to still work? User said "clicar em cima e traduzir", implies reading)
            // For now, let's just read and let the click propagate unless it's strictly text.
            // e.preventDefault(); 

            let target = e.target;

            // Try to find text content
            let textToRead = target.innerText || target.textContent;

            // If element is empty, traverse up
            if (!textToRead || textToRead.trim().length === 0) {
                textToRead = target.parentElement?.innerText;
            }

            if (textToRead && textToRead.trim().length > 0) {
                // Cancel previous speech
                window.speechSynthesis.cancel();

                // Speak new text
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.lang = 'pt-BR';
                utterance.rate = 1.0;

                // Highlight element being read (visual feedback)
                // Highlight logic (adapted for modes)
                // We only highlight if not in high contrast to avoid breaking the style, 
                // or we use a safe highlight color.
                const originalBackground = target.style.backgroundColor;
                // In neon mode, background is black, we might want a different highlight or none.
                // For simplicity, we skip visual highlight in neon mode to avoid flicker/breakage, 
                // or use a subtle outline.
                if (contrastMode !== 'neon') {
                    target.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                }

                utterance.onend = () => {
                    if (contrastMode !== 'neon') target.style.backgroundColor = originalBackground;
                };

                window.speechSynthesis.speak(utterance);
            }
        };

        document.addEventListener('click', handleClickToRead);

        return () => {
            document.removeEventListener('click', handleClickToRead);
            document.body.style.cursor = 'default';
            window.speechSynthesis.cancel(); // Stop speech on cleanup
        };
    }, [clickToReadMode, contrastMode]);

    // Helper to convert % to px (assuming base 16px)
    const itemsToRem = (percent) => {
        return (16 * (percent / 100));
    };

    const handleReset = () => {
        setFontSize(100);
        setContrastMode('normal');
        setClickToReadMode(false);
        window.speechSynthesis.cancel();
    };

    return (
        <div className="fixed bottom-6 left-6 z-50 font-sans">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    aria-label="Opções de Acessibilidade"
                    title="Acessibilidade"
                >
                    <Accessibility size={28} />
                </button>
            )}

            {/* Control Panel */}
            {isOpen && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-80 border border-gray-200 dark:border-gray-700 animate-slide-up origin-bottom-left">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center">
                            <Accessibility className="mr-2 text-blue-600" size={20} /> Acessibilidade
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Font Size */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Type className="mr-2" size={16} /> Tamanho da Fonte
                            </label>
                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                <button
                                    onClick={() => setFontSize(Math.max(80, fontSize - 10))}
                                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors w-full flex justify-center"
                                    aria-label="Diminuir fonte"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <span className="font-mono text-sm w-12 text-center">{fontSize}%</span>
                                <button
                                    onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors w-full flex justify-center"
                                    aria-label="Aumentar fonte"
                                >
                                    <ZoomIn size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Contrast Modes */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Sun className="mr-2" size={16} /> Contraste
                            </label>
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                <button
                                    onClick={() => setContrastMode('normal')}
                                    className={`flex-1 py-1 text-xs rounded-md transition-all ${contrastMode === 'normal'
                                            ? 'bg-white shadow text-gray-900 font-bold'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    Padrão
                                </button>
                                <button
                                    onClick={() => setContrastMode('clean')}
                                    className={`flex-1 py-1 text-xs rounded-md transition-all ${contrastMode === 'clean'
                                            ? 'bg-white shadow text-black font-extrabold border-2 border-black'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    Bolder
                                </button>
                                <button
                                    onClick={() => setContrastMode('neon')}
                                    className={`flex-1 py-1 text-xs rounded-md transition-all ${contrastMode === 'neon'
                                            ? 'bg-black text-yellow-400 font-bold border border-yellow-400'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    Neon
                                </button>
                            </div>
                        </div>

                        {/* Reading Mode (Click to Read) */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                    <Eye className="mr-2" size={16} /> Leitura por Clique
                                </label>
                                <span className="text-xs text-gray-500">Clique no texto para ouvir</span>
                            </div>
                            <button
                                onClick={() => setClickToReadMode(!clickToReadMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${clickToReadMode ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${clickToReadMode ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <button
                            onClick={handleReset}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline"
                        >
                            Restaurar Padrões
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessibilityWidget;
