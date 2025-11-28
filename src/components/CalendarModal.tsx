import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
    const webviewRef = useRef<Electron.WebviewTag>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Small timeout to ensure webview is mounted
        const timer = setTimeout(() => {
            const webview = webviewRef.current;
            if (!webview) return;

            const injectCSS = () => {
                const css = `
                    /* Hide sidebar toggle if possible, but keep navigation */
                    .Kk7lMc-QWPxkf-LgbsSe-haAclf {
                        display: none !important;
                    }

                    /* Ensure the main container starts at the top */
                    .tElJdf {
                        top: 0 !important;
                        height: 100vh !important;
                    }

                    /* Hide "Get the app" banner */
                    .DocsCalWaffleSidebar { display: none !important; }
                    
                    /* Ensure toolbar is visible */
                    .gboEAb {
                        display: flex !important;
                    }

                    /* Ensure header is visible for view switching */
                    header[role="banner"] {
                        display: flex !important;
                    }
                    
                    /* Hide Search and Support if possible to clean up */
                    form[role="search"], 
                    div[aria-label="Support"], 
                    div[aria-label="Settings menu"] {
                        /* display: none !important; - Keeping them for now to ensure view switcher isn't accidentally hidden */
                    }
                `;
                webview.insertCSS(css);
            };

            webview.addEventListener('dom-ready', injectCSS);
            webview.addEventListener('did-navigate', injectCSS);

            // Cleanup listener on unmount or close
            return () => {
                webview.removeEventListener('dom-ready', injectCSS);
                webview.removeEventListener('did-navigate', injectCSS);
            };
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-[90vw] h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
                >
                    <X size={20} className="text-gray-600" />
                </button>

                <webview
                    ref={webviewRef}
                    src="https://calendar.google.com/calendar/u/0/r/agenda"
                    className="h-full w-full"
                    useragent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
                    allowpopups
                />
            </div>
        </div>
    );
};

export default CalendarModal;
