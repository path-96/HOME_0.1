import React, { useState, useRef } from 'react';
import { X, Settings as SettingsIcon, Database, Download, Upload, AlertTriangle, Network } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, toggleTheme, projects, shortcuts, globalShortcuts, calendarMemos, importData, globalNetworkSettings, updateGlobalNetworkSettings, availableInterfaces, refreshInterfaces, t } = useApp();
    const [activeTab, setActiveTab] = useState<'general' | 'data' | 'network'>('general');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local state for network settings
    const [tempIp, setTempIp] = useState(globalNetworkSettings.ip);
    const [tempGateway, setTempGateway] = useState(globalNetworkSettings.gateway);
    const [tempInterface, setTempInterface] = useState(globalNetworkSettings.interfaceName || 'Ethernet');

    // Update local state when global settings change (e.g. on initial load)
    React.useEffect(() => {
        setTempIp(globalNetworkSettings.ip);
        setTempGateway(globalNetworkSettings.gateway);
        setTempInterface(globalNetworkSettings.interfaceName || 'Ethernet');
    }, [globalNetworkSettings]);

    React.useEffect(() => {
        if (isOpen && activeTab === 'network') {
            refreshInterfaces();
        }
    }, [isOpen, activeTab]);

    const handleSaveNetworkSettings = async () => {
        updateGlobalNetworkSettings({
            ip: tempIp,
            gateway: tempGateway,
            interfaceName: tempInterface
        });

        try {
            // @ts-ignore
            const result = await window.ipcRenderer.invoke('set-network-settings', {
                ip: tempIp,
                gateway: tempGateway,
                interfaceName: tempInterface
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
    };

    if (!isOpen) return null;

    const handleExport = () => {
        const data = {
            projects,
            shortcuts,
            globalShortcuts,
            calendarMemos,
            exportDate: new Date().toISOString(),
            version: '1.1'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `home_app_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (confirm(t('importWarning'))) {
                    importData(data);
                    alert(t('importSuccess'));
                    onClose();
                }
            } catch (error) {
                console.error('Import failed', error);
                alert(t('importFailed'));
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl w-[600px] h-[500px] flex flex-col shadow-2xl text-zinc-900 dark:text-zinc-100">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <SettingsIcon size={20} />
                        {t('settings')}
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-2">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${activeTab === 'general'
                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <SettingsIcon size={16} />
                            {t('general')}
                        </button>
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${activeTab === 'data'
                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <Database size={16} />
                            {t('data')}
                        </button>
                        <button
                            onClick={() => setActiveTab('network')}
                            className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${activeTab === 'network'
                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            <Network size={16} />
                            {t('network')}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-8">
                                {/* Appearance Section */}
                                <div>
                                    <h3 className="font-medium mb-4">{t('appearance')}</h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{t('theme')}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t('chooseTheme')}</p>
                                            </div>
                                            <div className="flex bg-zinc-200 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-300 dark:border-zinc-700">
                                                <button
                                                    onClick={toggleTheme}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'light'
                                                        ? 'bg-white text-zinc-900 shadow-sm'
                                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                                        }`}
                                                >
                                                    {t('light')}
                                                </button>
                                                <button
                                                    onClick={toggleTheme}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'dark'
                                                        ? 'bg-zinc-700 text-white shadow-sm'
                                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                                        }`}
                                                >
                                                    {t('dark')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="font-medium mb-4">{t('dataManagement')}</h3>

                                    <div className="space-y-4">
                                        {/* Export */}
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Download size={18} className="text-zinc-500" />
                                                    <span className="font-medium">{t('exportData')}</span>
                                                </div>
                                                <button
                                                    onClick={handleExport}
                                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    {t('exportJson')}
                                                </button>
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {t('exportDesc')}
                                            </p>
                                        </div>

                                        {/* Import */}
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Upload size={18} className="text-zinc-500" />
                                                    <span className="font-medium">{t('importData')}</span>
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    {t('importJson')}
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleImport}
                                                    accept=".json"
                                                    className="hidden"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                                                {t('importDesc')}
                                            </p>
                                            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-600 dark:text-yellow-200/80 text-xs">
                                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                                <span>{t('importWarning')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'network' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="font-medium mb-4">{t('globalNetworkSettings')}</h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 space-y-4">
                                        <div>
                                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('networkInterface')}</label>
                                            <select
                                                value={tempInterface}
                                                onChange={(e) => setTempInterface(e.target.value)}
                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                                            >
                                                {availableInterfaces.map(iface => (
                                                    <option key={iface} value={iface}>{iface}</option>
                                                ))}
                                                {availableInterfaces.length === 0 && <option value="Ethernet">Ethernet (Default)</option>}
                                            </select>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{t('selectAdapter')}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('defaultIp')}</label>
                                            <input
                                                type="text"
                                                value={tempIp}
                                                onChange={(e) => setTempIp(e.target.value)}
                                                placeholder="e.g., 192.168.1.1"
                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('defaultGateway')}</label>
                                            <input
                                                type="text"
                                                value={tempGateway}
                                                onChange={(e) => setTempGateway(e.target.value)}
                                                placeholder="e.g., 192.168.1.254"
                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                                {t('networkNote')}
                                            </p>
                                            <button
                                                onClick={handleSaveNetworkSettings}
                                                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-colors"
                                            >
                                                {t('changeNetworkSetting')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
