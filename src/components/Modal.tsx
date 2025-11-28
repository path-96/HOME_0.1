import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-green-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200 transition-colors duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-green-200 dark:border-zinc-800 bg-green-50 dark:bg-zinc-900/50 transition-colors duration-200">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-green-500 dark:text-zinc-400 hover:text-green-900 dark:hover:text-white hover:bg-green-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    {children}
                </div>

                {footer && (
                    <div className="px-4 py-3 bg-green-50 dark:bg-zinc-900/50 border-t border-green-200 dark:border-zinc-800 flex justify-end gap-2 transition-colors duration-200">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
