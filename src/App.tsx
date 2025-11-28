
import React from 'react';
import Layout from './components/Layout';
import ShortcutGrid from './components/ShortcutGrid';
import NotesArea from './components/NotesArea';
import CalendarPanel from './components/CalendarPanel';

function App() {
  const [isNotesCollapsed, setIsNotesCollapsed] = React.useState(false);
  const [notesHeight, setNotesHeight] = React.useState(300);
  const isResizingRef = React.useRef(false);

  const startResizing = React.useCallback(() => {
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newHeight = window.innerHeight - e.clientY;
    // Min height 100px, Max height 80% of window
    if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
      setNotesHeight(newHeight);
    }
  }, []);

  return (
    <Layout
      rightPanel={<CalendarPanel />}
    >
      <div className="flex-1 overflow-auto p-6">
        <ShortcutGrid />
      </div>

      {/* Resize Handle */}
      {!isNotesCollapsed && (
        <div
          className="h-1.5 hover:h-2 -mt-1 z-10 cursor-row-resize bg-transparent hover:bg-emerald-500/20 transition-all duration-150 w-full shrink-0"
          onMouseDown={startResizing}
        />
      )}

      <div
        className={`border-t border-green-200 dark:border-zinc-800 shrink-0 transition-all duration-300 ease-in-out`}
        style={{ height: isNotesCollapsed ? 'auto' : `${notesHeight}px` }}
      >
        <NotesArea
          isCollapsed={isNotesCollapsed}
          onToggleCollapse={() => setIsNotesCollapsed(!isNotesCollapsed)}
        />
      </div>
    </Layout>
  );
}

export default App;