import React, { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';
import { Menu, Calendar, Network } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';

interface LayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, rightPanel }) => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(384); // Default w-96 (24rem * 16px)
  const isResizingRef = useRef(false);
  const { projects, activeProjectId, updateProject, globalNetworkSettings, availableInterfaces, refreshInterfaces, t } = useApp();

  // Network Modal State
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [networkIp, setNetworkIp] = useState('');
  const [networkGateway, setNetworkGateway] = useState('');
  const [networkInterface, setNetworkInterface] = useState('');

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

  const openNetworkModal = () => {
    if (activeProject) {
      setNetworkIp(activeProject.ip || '');
      setNetworkGateway(activeProject.gateway || '');
      setNetworkInterface(activeProject.interfaceName || globalNetworkSettings.interfaceName || 'Ethernet');
      refreshInterfaces();
      setIsNetworkModalOpen(true);
    }
  };

  const handleSaveNetwork = async () => {
    if (activeProject) {
      // Update local state
      updateProject(activeProject.id, {
        ip: networkIp,
        gateway: networkGateway,
        interfaceName: networkInterface
      });

      // Apply system settings
      try {
        // @ts-ignore
        const result = await window.ipcRenderer.invoke('set-network-settings', {
          ip: networkIp,
          gateway: networkGateway,
          interfaceName: networkInterface
        });

        if (result.success) {
          alert(t('networkSuccess'));
        } else {
          alert(`${t('networkFailed')}: ${result.error}\n${t('adminRequired')}`);
        }
      } catch (error) {
        console.error('Failed to set network settings:', error);
        alert(t('networkFailed'));
      }

      setIsNetworkModalOpen(false);
    }
  };

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
              className="p-2 bg-transparent border-none outline-none hover:bg-zinc-500/10 rounded-lg transition-colors text-zinc-900/40 dark:text-zinc-500/40 hover:text-zinc-900 dark:hover:text-zinc-400"
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
                <div className="font-semibold text-lg text-zinc-400 dark:text-zinc-600">{t('noProjectSelected')}</div>
              )}
            </div>

            {activeProject && (
              <button
                onClick={openNetworkModal}
                className="p-2 mr-2 bg-transparent border-none outline-none rounded-lg transition-colors text-zinc-900/40 dark:text-zinc-500/40 hover:bg-zinc-500/10 hover:text-zinc-900 dark:hover:text-zinc-400"
                title={t('projectNetworkSettings')}
              >
                <Network size={20} />
              </button>
            )}

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={`p-2 bg-transparent border-none outline-none rounded-lg transition-colors ${rightPanelOpen
                ? 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10'
                : 'text-zinc-900/40 dark:text-zinc-500/40 hover:bg-zinc-500/10 hover:text-zinc-900 dark:hover:text-zinc-400'
                }`}
              title={t('calendar')}
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
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-zinc-500/50 z-50 transition-colors"
            onMouseDown={startResizing}
          />
          {rightPanel}
        </div>
      </div>

      <Modal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        title={t('projectNetworkSettings')}
        footer={
          <>
            <button
              onClick={() => setIsNetworkModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveNetwork}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-600 hover:bg-zinc-700 rounded transition-colors"
            >
              {t('changeIp')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-1">{t('networkInterface')}</label>
            <select
              value={networkInterface}
              onChange={(e) => setNetworkInterface(e.target.value)}
              className="w-full bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-zinc-500 border border-zinc-200 dark:border-zinc-600 focus:border-zinc-500 transition-all"
            >
              {availableInterfaces.map(iface => (
                <option key={iface} value={iface}>{iface}</option>
              ))}
              {availableInterfaces.length === 0 && <option value="Ethernet">{t('ethernetDefault')}</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-1">{t('ipAddress')}</label>
            <input
              type="text"
              value={networkIp}
              onChange={e => setNetworkIp(e.target.value)}
              className="w-full bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-zinc-500 border border-zinc-200 dark:border-zinc-600 focus:border-zinc-500 transition-all"
              placeholder="e.g., 192.168.1.10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-1">{t('defaultGateway')}</label>
            <input
              type="text"
              value={networkGateway}
              onChange={e => setNetworkGateway(e.target.value)}
              className="w-full bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-zinc-500 border border-zinc-200 dark:border-zinc-600 focus:border-zinc-500 transition-all"
              placeholder="e.g., 192.168.1.1"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Layout;
