import React from 'react';
import { Minus, Square, X, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TitleBar: React.FC = () => {
    const handleMinimize = () => {
        // @ts-ignore
        window.ipcRenderer.invoke('window-minimize');
    };

    const handleMaximize = () => {
        // @ts-ignore
        window.ipcRenderer.invoke('window-maximize');
    };

    const handleClose = () => {
        // @ts-ignore
        window.ipcRenderer.invoke('window-close');
    };

    const { toggleLanguage, language } = useApp();

    return (
        <div className="h-8 w-full bg-zinc-50/50 dark:bg-zinc-900 flex items-center justify-between select-none transition-colors duration-200" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            <div className="px-4 text-xs font-medium text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                HOME 0.1
                <button
                    onClick={toggleLanguage}
                    className="p-1 rounded hover:bg-zinc-500/10 text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    title={`Switch to ${language === 'en' ? 'Japanese' : 'English'}`}
                >
                    <Globe size={12} />
                </button>
            </div>
            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    onClick={handleMinimize}
                    className="w-10 h-full flex items-center justify-center bg-transparent border-none outline-none text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-500/10 transition-all"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-10 h-full flex items-center justify-center bg-transparent border-none outline-none text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-500/10 transition-all"
                >
                    <Square size={12} />
                </button>
                <button
                    onClick={handleClose}
                    className="w-10 h-full flex items-center justify-center bg-transparent border-none outline-none text-zinc-500 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
