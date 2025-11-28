import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Folder, Plus, Trash2, Edit2, Pin, Settings as SettingsIcon, Search, ArrowDownAZ, ArrowUpAZ, File, Globe, Link as LinkIcon } from 'lucide-react';
import Modal from './Modal';
import SettingsModal from './SettingsModal';
import { Shortcut } from '../types';

const Sidebar: React.FC = () => {
    const { projects, activeProjectId, setActiveProject, addProject, deleteProject, updateProject, globalShortcuts, addGlobalShortcut, updateGlobalShortcut, removeGlobalShortcut } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');

    // Project Form State
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [projectIp, setProjectIp] = useState('');
    const [projectGateway, setProjectGateway] = useState('');

    // Shortcut Modal State
    const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
    const [shortcutType, setShortcutType] = useState<'file' | 'folder' | 'url'>('file');
    const [targetPath, setTargetPath] = useState('');
    const [shortcutName, setShortcutName] = useState('');
    const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);

    const openCreateModal = () => {
        setModalMode('create');
        setProjectName('');
        setProjectDesc('');
        setProjectIp('');
        setProjectGateway('');
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, project: any) => {
        e.stopPropagation();
        setModalMode('edit');
        setEditingId(project.id);
        setProjectName(project.name);
        setProjectDesc(project.description || '');
        setProjectIp(project.ip || '');
        setProjectGateway(project.gateway || '');
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!projectName.trim()) return;

        if (modalMode === 'create') {
            addProject(projectName.trim(), projectDesc.trim(), projectIp.trim(), projectGateway.trim());
        } else if (modalMode === 'edit' && editingId) {
            updateProject(editingId, {
                name: projectName.trim(),
                description: projectDesc.trim(),
                ip: projectIp.trim(),
                gateway: projectGateway.trim()
            });
        }
        setIsModalOpen(false);
    };

    const togglePin = (e: React.MouseEvent, project: any) => {
        e.stopPropagation();
        updateProject(project.id, { isPinned: !project.isPinned });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            deleteProject(id);
        }
    };

    // Shortcut Logic
    const handleBrowse = async () => {
        try {
            const channel = shortcutType === 'folder' ? 'select-folder' : 'select-file';
            // @ts-ignore
            const path = await window.ipcRenderer.invoke(channel);
            if (path) {
                setTargetPath(path);
                if (!shortcutName) {
                    const name = path.split('\\').pop() || path;
                    setShortcutName(name);
                }
            }
        } catch (error) {
            console.error('Browse failed', error);
        }
    };

    const handleSaveShortcut = async () => {
        if (!targetPath || !shortcutName) return;

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
            updateGlobalShortcut(editingShortcutId, {
                name: shortcutName,
                path: targetPath,
                type: shortcutType,
                icon
            });
        } else {
            addGlobalShortcut({
                projectId: 'global', // Not used but required by type
                name: shortcutName,
                path: targetPath,
                type: shortcutType,
                icon
            });
        }
        closeShortcutModal();
    };

    const openShortcutModal = (shortcut?: Shortcut) => {
        if (shortcut) {
            setEditingShortcutId(shortcut.id);
            setShortcutName(shortcut.name);
            setTargetPath(shortcut.path);
            setShortcutType(shortcut.type);
        } else {
            setEditingShortcutId(null);
            setShortcutName('');
            setTargetPath('');
            setShortcutType('file');
        }
        setIsShortcutModalOpen(true);
    };

    const closeShortcutModal = () => {
        setIsShortcutModalOpen(false);
        setEditingShortcutId(null);
        setTargetPath('');
        setShortcutName('');
        setShortcutType('file');
    };

    const launchShortcut = async (shortcut: Shortcut) => {
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

    // Sort projects: Pinned first, then by name (A-Z or Z-A)
    const sortedProjects = [...projects]
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (a.isPinned === b.isPinned) {
                return sortOrder === 'az'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            return a.isPinned ? -1 : 1;
        });

    return (
        <div className="flex flex-col h-full p-4 bg-green-50/50 dark:bg-zinc-900 text-green-950 dark:text-zinc-300 transition-colors duration-200">
            {/* Global Shortcuts */}
            <div className="mb-6 grid grid-cols-3 gap-2">
                {[0, 1, 2].map(index => {
                    const shortcut = globalShortcuts[index];
                    return (
                        <div
                            key={index}
                            className={`aspect-square rounded-lg border border-green-200 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer transition-all relative group
                                ${shortcut
                                    ? 'bg-white dark:bg-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500'
                                    : 'bg-transparent hover:bg-green-100/50 dark:hover:bg-zinc-800/50 border-dashed'
                                }`}
                            onClick={() => shortcut ? launchShortcut(shortcut) : openShortcutModal()}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (shortcut) openShortcutModal(shortcut);
                            }}
                            title={shortcut ? `${shortcut.name}\nRight-click to edit` : 'Add Global Shortcut'}
                        >
                            {shortcut ? (
                                <>
                                    <div className="w-5 h-5 mb-1 flex items-center justify-center">
                                        {shortcut.icon ? (
                                            <img src={shortcut.icon} alt={shortcut.name} className="w-full h-full object-contain" />
                                        ) : (
                                            shortcut.type === 'folder' ? <Folder size={16} className="text-orange-400" /> :
                                                shortcut.type === 'url' ? <Globe size={16} className="text-emerald-500" /> :
                                                    <File size={16} className="text-green-400 dark:text-zinc-600" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-center w-full truncate px-1 opacity-70">{shortcut.name}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeGlobalShortcut(shortcut.id); }}
                                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-100 dark:bg-red-900/80 rounded-full text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:hover:bg-red-800"
                                        title="Remove"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </>
                            ) : (
                                <Plus size={16} className="text-green-400 dark:text-zinc-600" />
                            )}
                        </div>
                    );
                })}
            </div>

            <h2 className="text-xl font-bold mb-4 text-emerald-700 dark:text-emerald-500 flex items-center gap-2">
                <Folder size={20} /> Projects
            </h2>

            {/* Search and Sort */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-700/50 dark:text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-green-200 dark:border-zinc-700 rounded-lg outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-green-900 dark:text-zinc-200 placeholder-green-700/40 dark:placeholder-zinc-600 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setSortOrder(prev => prev === 'az' ? 'za' : 'az')}
                    className="p-1.5 bg-white dark:bg-zinc-800 border border-green-200 dark:border-zinc-700 rounded-lg text-green-700 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
                    title={`Sort ${sortOrder === 'az' ? 'Z-A' : 'A-Z'}`}
                >
                    {sortOrder === 'az' ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {sortedProjects.map(project => (
                    <div
                        key={project.id}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border ${activeProjectId === project.id
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'hover:bg-green-100/50 dark:hover:bg-zinc-800 border-transparent hover:border-green-200 dark:hover:border-zinc-700 text-green-900 dark:text-zinc-400'
                            }`}
                        onClick={() => setActiveProject(project.id)}
                    >
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                            <div className="flex items-center gap-2">
                                {project.isPinned && <Pin size={12} className="text-orange-500 fill-orange-500" />}
                                <span className="truncate font-medium">{project.name}</span>
                            </div>
                            {project.description && (
                                <span className="text-xs text-green-800/70 dark:text-zinc-500 truncate">{project.description}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => togglePin(e, project)}
                                className={`p-1.5 rounded hover:bg-green-200/50 dark:hover:bg-zinc-700 ${project.isPinned ? 'text-orange-500' : 'text-green-700 dark:text-zinc-500 hover:text-green-950 dark:hover:text-zinc-200'}`}
                                title={project.isPinned ? "Unpin" : "Pin"}
                            >
                                <Pin size={14} />
                            </button>
                            <button
                                onClick={(e) => openEditModal(e, project)}
                                className="p-1.5 hover:bg-green-200/50 dark:hover:bg-zinc-700 rounded text-green-700 dark:text-zinc-500 hover:text-green-950 dark:hover:text-zinc-200"
                                title="Edit"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={(e) => handleDelete(e, project.id)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-green-700 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={openCreateModal}
                className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
                <Plus size={18} /> New Project
            </button>

            <div className="mt-auto pt-4 border-t border-green-200 dark:border-zinc-800">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full py-2.5 px-3 bg-transparent border-none outline-none text-emerald-900/60 dark:text-emerald-500/60 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-2 group"
                >
                    <SettingsIcon size={18} className="group-hover:rotate-45 transition-transform duration-300" />
                    <span className="font-medium">Settings</span>
                </button>
            </div>

            {/* Project Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'create' ? 'Create New Project' : 'Edit Project'}
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-green-800 dark:text-zinc-400 hover:text-green-950 dark:hover:text-zinc-100 hover:bg-green-100 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                        >
                            {modalMode === 'create' ? 'Create' : 'Save Changes'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-zinc-300 mb-1">Project Name</label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-700 text-green-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-emerald-500 border border-green-200 dark:border-zinc-600 focus:border-emerald-500 transition-all"
                            placeholder="e.g., Work, Personal"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-green-900 dark:text-zinc-300 mb-1">Description (Optional)</label>
                        <textarea
                            value={projectDesc}
                            onChange={e => setProjectDesc(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-700 text-green-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-emerald-500 border border-green-200 dark:border-zinc-600 focus:border-emerald-500 transition-all h-24 resize-none"
                            placeholder="Brief details about this project..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-green-900 dark:text-zinc-300 mb-1">IP Address (Optional)</label>
                            <input
                                type="text"
                                value={projectIp}
                                onChange={e => setProjectIp(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-700 text-green-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-emerald-500 border border-green-200 dark:border-zinc-600 focus:border-emerald-500 transition-all"
                                placeholder="192.168.1.x"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-green-900 dark:text-zinc-300 mb-1">Gateway (Optional)</label>
                            <input
                                type="text"
                                value={projectGateway}
                                onChange={e => setProjectGateway(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-700 text-green-950 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-emerald-500 border border-green-200 dark:border-zinc-600 focus:border-emerald-500 transition-all"
                                placeholder="192.168.1.1"
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Global Shortcut Modal */}
            <Modal
                isOpen={isShortcutModalOpen}
                onClose={closeShortcutModal}
                title={editingShortcutId ? "Edit Global Shortcut" : "Add Global Shortcut"}
                footer={
                    <>
                        <button
                            onClick={closeShortcutModal}
                            className="px-4 py-2 text-sm font-medium text-green-800 dark:text-zinc-300 hover:text-green-950 dark:hover:text-white hover:bg-green-100 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveShortcut}
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

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default Sidebar;
