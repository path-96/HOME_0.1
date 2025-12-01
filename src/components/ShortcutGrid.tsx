import React, { useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shortcut } from '../types';
import { File, Folder, Globe, Trash2, Plus, Link as LinkIcon, HardDrive, Edit2 } from 'lucide-react';
import Modal from './Modal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableShortcutItem = ({
    shortcut,
    openShortcut,
    removeShortcut,
    openEditModal
}: {
    shortcut: Shortcut;
    openShortcut: (s: Shortcut) => void;
    removeShortcut: (id: string) => void;
    openEditModal: (s: Shortcut) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: shortcut.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:shadow-zinc-900/10"
            onClick={() => openShortcut(shortcut)}
        >
            <div className="w-12 h-12 flex items-center justify-center pointer-events-none">
                {shortcut.icon ? (
                    <img src={shortcut.icon} alt={shortcut.name} className="w-full h-full object-contain" />
                ) : (
                    shortcut.type === 'folder' ? <Folder size={40} className="text-zinc-400" /> :
                        shortcut.type === 'url' ? <Globe size={40} className="text-zinc-500" /> :
                            <File size={40} className="text-zinc-400 dark:text-zinc-600" />
                )}
            </div>

            <span className="text-sm text-center font-medium text-zinc-900 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white truncate w-full px-1 pointer-events-none">
                {shortcut.name}
            </span>

            <button
                onClick={(e) => { e.stopPropagation(); removeShortcut(shortcut.id); }}
                className="absolute top-2 right-2 p-1.5 bg-zinc-100 dark:bg-zinc-900/80 rounded-full text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-white"
                title="Remove Shortcut"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
            >
                <Trash2 size={12} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); openEditModal(shortcut); }}
                className="absolute top-2 left-2 p-1.5 bg-zinc-100 dark:bg-zinc-900/80 rounded-full text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                title="Edit Shortcut"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
            >
                <Edit2 size={12} />
            </button>
        </div>
    );
};

const ShortcutGrid: React.FC = () => {
    const { shortcuts, activeProjectId, addShortcut, updateShortcut, removeShortcut, reorderShortcuts, projects, t } = useApp();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shortcutType, setShortcutType] = useState<'file' | 'folder' | 'url'>('file');
    const [targetPath, setTargetPath] = useState('');
    const [shortcutName, setShortcutName] = useState('');
    const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);

    const activeProject = projects.find(p => p.id === activeProjectId);
    const activeShortcuts = shortcuts.filter(s => s.projectId === activeProjectId);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id && activeProjectId) {
            const oldIndex = activeShortcuts.findIndex((s) => s.id === active.id);
            const newIndex = activeShortcuts.findIndex((s) => s.id === over.id);

            const newOrder = arrayMove(activeShortcuts, oldIndex, newIndex);
            reorderShortcuts(activeProjectId, newOrder);
        }
    };

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
                {t('selectProjectToViewShortcuts')}
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
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                    <p className="mb-2">{t('dragDropFiles')}</p>
                    <p className="text-sm">{t('orCreateShortcut')}</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> {t('addShortcut')}
                    </button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={activeShortcuts.map(s => s.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {activeShortcuts.map(shortcut => (
                                <SortableShortcutItem
                                    key={shortcut.id}
                                    shortcut={shortcut}
                                    openShortcut={openShortcut}
                                    removeShortcut={removeShortcut}
                                    openEditModal={openEditModal}
                                />
                            ))}

                            {/* Add New Shortcut Button */}
                            <div
                                className="group bg-zinc-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[140px]"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-600 flex items-center justify-center transition-colors">
                                    <Plus size={24} className="text-zinc-500 dark:text-zinc-400 group-hover:text-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">{t('addShortcut')}</span>
                            </div>
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingShortcutId ? t('editShortcut') : t('addNewShortcut')}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleAddShortcut}
                            disabled={!targetPath || !shortcutName}
                            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingShortcutId ? t('saveChanges') : t('addShortcut')}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Type Selection */}
                    <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                        <button
                            onClick={() => setShortcutType('file')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${shortcutType === 'file' ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            <File size={16} /> {t('file')}
                        </button>
                        <button
                            onClick={() => setShortcutType('folder')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${shortcutType === 'folder' ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            <Folder size={16} /> {t('folder')}
                        </button>
                        <button
                            onClick={() => setShortcutType('url')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${shortcutType === 'url' ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            <Globe size={16} /> {t('link')}
                        </button>
                    </div>

                    {/* Path Input */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-400 mb-1">
                            {shortcutType === 'url' ? t('url') : shortcutType === 'folder' ? t('folderPath') : t('filePath')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={targetPath}
                                onChange={e => setTargetPath(e.target.value)}
                                className="flex-1 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-zinc-500 border border-zinc-200 dark:border-zinc-600 focus:border-zinc-500 transition-all"
                                placeholder={shortcutType === 'url' ? 'https://example.com' : 'Select path...'}
                            />
                            {shortcutType !== 'url' && (
                                <button
                                    onClick={handleBrowse}
                                    className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 rounded text-zinc-900 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                                >
                                    {t('browse')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-400 mb-1">{t('name')}</label>
                        <input
                            type="text"
                            value={shortcutName}
                            onChange={e => setShortcutName(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-zinc-500 border border-zinc-200 dark:border-zinc-600 focus:border-zinc-500 transition-all"
                            placeholder={t('shortcutName')}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ShortcutGrid;
