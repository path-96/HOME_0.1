import React from 'react';
import { Minus, Square, X } from 'lucide-react';

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

    return (
        <div className="h-8 w-full bg-green-50 dark:bg-zinc-950 flex items-center justify-between select-none transition-colors duration-200" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            <div className="px-4 text-xs font-medium text-emerald-900/40 dark:text-emerald-500/40">HOME 1.1</div>
            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    onClick={handleMinimize}
                    className="w-10 h-full flex items-center justify-center bg-transparent border-none outline-none text-emerald-900/40 dark:text-emerald-500/40 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-10 h-full flex items-center justify-center bg-transparent border-none outline-none text-emerald-900/40 dark:text-emerald-500/40 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                    <Square size={12} />
                </button>
                <button
                    onClick={handleClose}
                    className="w-10 h-full flex items-center justify-center bg-transparent border-none outline-none text-emerald-900/40 dark:text-emerald-500/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
