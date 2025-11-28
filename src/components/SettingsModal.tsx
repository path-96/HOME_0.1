import React, { useState, useRef } from 'react';
import { X, Settings as SettingsIcon, Database, Download, Upload, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { useApp } from '../context/AppContext';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, toggleTheme, projects, shortcuts, globalShortcuts, calendarMemos, importData } = useApp();
    const [activeTab, setActiveTab] = useState<'general' | 'data'>('general');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                if (confirm('This will overwrite your current data. Are you sure you want to proceed?')) {
                    importData(data);
                    alert('Data imported successfully!');
                    onClose();
                }
            } catch (error) {
                console.error('Import failed', error);
                alert('Failed to import data. Invalid file format.');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-[600px] h-[500px] flex flex-col shadow-2xl text-zinc-100">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <SettingsIcon size={20} />
                        Settings
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-gray-800 bg-gray-900/50 p-2">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${activeTab === 'general'
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <SettingsIcon size={16} />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${activeTab === 'data'
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <Database size={16} />
                            Data
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-8">
                                {/* Appearance Section */}
                                <div>
                                    <h3 className="text-white font-medium mb-4">Appearance</h3>
                                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-white font-medium">Theme</p>
                                                <p className="text-xs text-gray-400 mt-1">Choose your preferred appearance</p>
                                            </div>
                                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                                                <button
                                                    onClick={toggleTheme}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'light'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    Light
                                                </button>
                                                <button
                                                    onClick={toggleTheme}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'dark'
                                                        ? 'bg-gray-700 text-white shadow-sm'
                                                        : 'text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    Dark
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
                                    <h3 className="text-white font-medium mb-4">Data Management</h3>

                                    <div className="space-y-4">
                                        {/* Export */}
                                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Download size={18} className="text-emerald-400" />
                                                    <span className="font-medium text-white">Export Data</span>
                                                </div>
                                                <button
                                                    onClick={handleExport}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Export JSON
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Download a backup of all your projects, shortcuts, and notes.
                                            </p>
                                        </div>

                                        {/* Import */}
                                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Upload size={18} className="text-blue-400" />
                                                    <span className="font-medium text-white">Import Data</span>
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Import JSON
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleImport}
                                                    accept=".json"
                                                    className="hidden"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">
                                                Restore your data from a backup file.
                                            </p>
                                            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200/80 text-xs">
                                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                                <span>Warning: Importing data will overwrite all your current projects and settings. This action cannot be undone.</span>
                                            </div>
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
