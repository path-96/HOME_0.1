import React, { useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shortcut } from '../types';
import { File, Folder, Globe, Trash2, Plus, Link as LinkIcon, HardDrive, Edit2 } from 'lucide-react';
import Modal from './Modal';

const ShortcutGrid: React.FC = () => {
    const { shortcuts, activeProjectId, addShortcut, updateShortcut, removeShortcut, projects } = useApp();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shortcutType, setShortcutType] = useState<'file' | 'folder' | 'url'>('file');
    const [targetPath, setTargetPath] = useState('');
    const [shortcutName, setShortcutName] = useState('');
    const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);

    const activeProject = projects.find(p => p.id === activeProjectId);
    const activeShortcuts = shortcuts.filter(s => s.projectId === activeProjectId);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!activeProjectId) return;

        const files = Array.from(e.dataTransfer.files);

        for (const file of files) {
            let filePath = '';
            try {
                // @ts-ignore
                const { webUtils } = window.require('electron');
                filePath = webUtils.getPathForFile(file);
            } catch (e) {
                console.error('Failed to get path via webUtils', e);
                // @ts-ignore
                if (file.path) filePath = file.path;
            }

            if (!filePath) continue;

            const name = file.name;
            let icon = '';
            try {
                // @ts-ignore
                icon = await window.ipcRenderer.invoke('get-file-icon', filePath);
            } catch (err) {
                console.error('Failed to get icon', err);
            }

            addShortcut({
                projectId: activeProjectId,
                name,
                path: filePath,
                type: 'file', // Default to file for drag/drop for now
                icon
            });
        }
    }, [activeProjectId, addShortcut]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const openShortcut = async (shortcut: Shortcut) => {
        try {
            if (shortcut.type === 'url') {
                // @ts-ignore
                await window.ipcRenderer.invoke('open-external', shortcut.path);
            } else {
                // @ts-ignore
                await window.ipcRenderer.invoke('open-path', shortcut.path);
            }
        } catch (err) {
            console.error('Failed to open shortcut', err);
        }
    };

    const handleBrowse = async () => {
        try {
            const channel = shortcutType === 'folder' ? 'select-folder' : 'select-file';
            // @ts-ignore
            const path = await window.ipcRenderer.invoke(channel);
            if (path) {
                setTargetPath(path);
                // Auto-populate name if empty
                if (!shortcutName) {
                    const name = path.split('\\').pop() || path;
                    setShortcutName(name);
                }
            }
        } catch (error) {
            console.error('Browse failed', error);
        }
    };

    const handleAddShortcut = async () => {
        if (!activeProjectId || !targetPath || !shortcutName) return;

        let icon = '';
        if (shortcutType === 'file') {
            try {
                // @ts-ignore
                icon = await window.ipcRenderer.invoke('get-file-icon', targetPath);
            } catch (err) {
                console.error('Failed to get icon', err);
            }
        }

        if (editingShortcutId) {
            updateShortcut(editingShortcutId, {
                name: shortcutName,
                path: targetPath,
                type: shortcutType,
                icon
            });
        } else {
            addShortcut({
                projectId: activeProjectId,
                name: shortcutName,
                path: targetPath,
                type: shortcutType,
                icon
            });
        }

        closeModal();
    };

    const openEditModal = (shortcut: Shortcut) => {
        setEditingShortcutId(shortcut.id);
        setShortcutName(shortcut.name);
        setTargetPath(shortcut.path);
        setShortcutType(shortcut.type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingShortcutId(null);
        setTargetPath('');
        setShortcutName('');
        setShortcutType('file');
    };

    if (!activeProjectId || !activeProject) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Select a project to view shortcuts
            </div>
        );
    }

    return (
        <div
            className="h-full w-full p-4 overflow-y-auto"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {activeShortcuts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-green-800/60 dark:text-zinc-500 border-2 border-dashed border-green-200 dark:border-zinc-700 rounded-xl">
                    <p className="mb-2">Drag and drop files here</p>
                    <p className="text-sm">or create a new shortcut</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> Add Shortcut
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {activeShortcuts.map(shortcut => (
                        <div
                            key={shortcut.id}
                            className="group relative bg-white dark:bg-zinc-900 p-4 rounded-xl border border-green-100 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-green-50/50 dark:hover:bg-zinc-800 transition-all cursor-pointer flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:shadow-emerald-900/10"
                            onClick={() => openShortcut(shortcut)}
                        >
                            <div className="w-12 h-12 flex items-center justify-center">
                                {shortcut.icon ? (
                                    <img src={shortcut.icon} alt={shortcut.name} className="w-full h-full object-contain" />
                                ) : (
                                    shortcut.type === 'folder' ? <Folder size={40} className="text-orange-400" /> :
                                        shortcut.type === 'url' ? <Globe size={40} className="text-emerald-500" /> :
                                            <File size={40} className="text-green-400 dark:text-zinc-600" />
                                )}
                            </div>

                            <span className="text-sm text-center font-medium text-green-950 dark:text-zinc-300 group-hover:text-emerald-900 dark:group-hover:text-white truncate w-full px-1">
                                {shortcut.name}
                            </span>

                            <button
                                onClick={(e) => { e.stopPropagation(); removeShortcut(shortcut.id); }}
                                className="absolute top-2 right-2 p-1.5 bg-green-100 dark:bg-zinc-900/80 rounded-full text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-white"
                                title="Remove Shortcut"
                            >
                                <Trash2 size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); openEditModal(shortcut); }}
                                className="absolute top-2 left-2 p-1.5 bg-green-100 dark:bg-zinc-900/80 rounded-full text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-700 dark:hover:text-white"
                                title="Edit Shortcut"
                            >
                                <Edit2 size={12} />
                            </button>
                        </div>
                    ))}

                    {/* Add New Shortcut Button */}
                    <div
                        className="group bg-green-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-dashed border-green-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[140px]"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-zinc-700 group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
                            <Plus size={24} className="text-green-700 dark:text-zinc-400 group-hover:text-white" />
                        </div>
                        <span className="text-sm font-medium text-green-800 dark:text-zinc-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Add Shortcut</span>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingShortcutId ? "Edit Shortcut" : "Add New Shortcut"}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-green-800 dark:text-zinc-300 hover:text-green-950 dark:hover:text-white hover:bg-green-100 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddShortcut}
                            disabled={!targetPath || !shortcutName}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingShortcutId ? "Save Changes" : "Add Shortcut"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Type Selection */}
                    <div className="flex gap-2 p-1 bg-green-100 dark:bg-zinc-700 rounded-lg">
                        <button
                            onClick={() => setShortcutType('file')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${shortcutType === 'file' ? 'bg-white dark:bg-zinc-600 text-green-950 dark:text-white shadow-sm' : 'text-green-800 dark:text-zinc-400 hover:text-green-950 dark:hover:text-white'
                                }`}
                        >
                            <File size={16} /> File
                        </button>
                        <button
                            onClick={() => setShortcutType('folder')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${shortcutType === 'folder' ? 'bg-white dark:bg-zinc-600 text-green-950 dark:text-white shadow-sm' : 'text-green-800 dark:text-zinc-400 hover:text-green-950 dark:hover:text-white'
                                }`}
                        >
                            <Folder size={16} /> Folder
                        </button>
                        <button
                            onClick={() => setShortcutType('url')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${shortcutType === 'url' ? 'bg-white dark:bg-zinc-600 text-green-950 dark:text-white shadow-sm' : 'text-green-800 dark:text-zinc-400 hover:text-green-950 dark:hover:text-white'
                                }`}
                        >
                            <Globe size={16} /> Link
                        </button>
                    </div>

                    {/* Path Input */}
                    <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-zinc-400 mb-1">
                            {shortcutType === 'url' ? 'URL' : shortcutType === 'folder' ? 'Folder Path' : 'File Path'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={targetPath}
                                onChange={e => setTargetPath(e.target.value)}
                                className="flex-1 bg-white dark:bg-zinc-700 text-green-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-emerald-500 border border-green-200 dark:border-zinc-600 focus:border-emerald-500 transition-all"
                                placeholder={shortcutType === 'url' ? 'https://example.com' : 'Select path...'}
                            />
                            {shortcutType !== 'url' && (
                                <button
                                    onClick={handleBrowse}
                                    className="px-3 py-2 bg-green-100 dark:bg-zinc-700 hover:bg-green-200 dark:hover:bg-zinc-600 border border-green-200 dark:border-zinc-600 rounded text-green-900 dark:text-zinc-300 hover:text-green-950 dark:hover:text-white transition-colors"
                                >
                                    Browse
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-zinc-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={shortcutName}
                            onChange={e => setShortcutName(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-700 text-green-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-emerald-500 border border-green-200 dark:border-zinc-600 focus:border-emerald-500 transition-all"
                            placeholder="Shortcut Name"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ShortcutGrid;
