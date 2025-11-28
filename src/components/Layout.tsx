import React, { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';
import { Menu, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, rightPanel }) => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(384); // Default w-96 (24rem * 16px)
  const isResizingRef = useRef(false);
  const { projects, activeProjectId } = useApp();

  const activeProject = projects.find(p => p.id === activeProjectId);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 200 && newWidth < window.innerWidth * 0.6) {
      setRightPanelWidth(newWidth);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-colors duration-200">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div
          className={`transition-all duration-300 ease-in-out border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${leftPanelOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'
            }`}
        >
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/80 dark:bg-zinc-900 relative transition-colors duration-200">
          {/* Header / Toolbar */}
          <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur shrink-0 transition-colors duration-200">
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="p-2 bg-transparent border-none outline-none hover:bg-emerald-500/10 rounded-lg transition-colors text-emerald-900/40 dark:text-emerald-500/40 hover:text-emerald-900 dark:hover:text-emerald-400"
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="flex flex-col justify-center flex-1 mx-4 overflow-hidden">
              {activeProject ? (
                <>
                  <h1 className="font-bold text-2xl leading-none truncate w-full text-left mb-0.5 text-zinc-900 dark:text-zinc-100">{activeProject.name}</h1>
                  {activeProject.description && (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate w-full text-left leading-none">{activeProject.description}</span>
                  )}
                </>
              ) : (
                <div className="font-semibold text-lg text-zinc-400 dark:text-zinc-600">No Project Selected</div>
              )}
            </div>

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={`p-2 bg-transparent border-none outline-none rounded-lg transition-colors ${rightPanelOpen
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-emerald-900/40 dark:text-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-900 dark:hover:text-emerald-400'
                }`}
              title="Toggle Calendar"
            >
              <Calendar size={20} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </div>

        {/* Right Panel */}
        <div
          className="transition-all duration-300 ease-in-out border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col relative"
          style={{ width: rightPanelOpen ? rightPanelWidth : 0, opacity: rightPanelOpen ? 1 : 0, overflow: 'hidden' }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/50 z-50 transition-colors"
            onMouseDown={startResizing}
          />
          {rightPanel}
        </div>
      </div>
    </div>
  );
};

export default Layout;


