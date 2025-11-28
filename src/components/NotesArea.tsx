import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Save, FileText, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import NotesModal from './NotesModal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TurndownService from 'turndown';
import showdown from 'showdown';

interface NotesAreaProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

const NotesArea: React.FC<NotesAreaProps> = ({ isCollapsed = false, onToggleCollapse }) => {
    const { projects, activeProjectId, updateProjectNotes } = useApp();
    const activeProject = projects.find(p => p.id === activeProjectId);
    const [editorContent, setEditorContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const quillRef = useRef<any>(null);
    const lastProjectIdRef = useRef<string | null>(null);

    // Converters
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
    });
    const converter = new showdown.Converter();

    // Load initial content and sync updates
    useEffect(() => {
        if (activeProject) {
            const html = converter.makeHtml(activeProject.notes || '');

            const isProjectChange = activeProject.id !== lastProjectIdRef.current;
            const hasFocus = quillRef.current?.getEditor()?.hasFocus();

            // Only update if project changed OR if not focused (to prevent cursor jumps while typing)
            if (isProjectChange || !hasFocus) {
                setEditorContent(html);
                lastProjectIdRef.current = activeProject.id;
            }
        }
    }, [activeProject?.id, activeProject?.notes]);

    // Handle change
    const handleChange = (content: string, delta: any, source: string, editor: any) => {
        setEditorContent(content);

        // Only trigger update if change came from user to avoid loops
        if (source === 'user' && activeProject) {
            const markdown = turndownService.turndown(content);
            // Debounce update
            const timer = setTimeout(() => {
                if (markdown !== activeProject.notes) {
                    updateProjectNotes(activeProject.id, markdown);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    };

    const handleExport = async () => {
        if (!activeProject) return;
        try {
            // @ts-ignore
            await window.ipcRenderer.invoke('save-markdown', {
                content: activeProject.notes || '',
                defaultPath: `${activeProject.name}_notes.md`
            });
        } catch (err) {
            console.error('Failed to export notes', err);
        }
    };

    if (!activeProject) return null;

    const modules = {
        toolbar: false // Hide toolbar for mini view
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900 transition-all duration-300">
            <div
                className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={onToggleCollapse}
            >
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm select-none">
                    {onToggleCollapse && (
                        isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                    <FileText size={16} className="text-emerald-600 dark:text-emerald-500" />
                    {activeProject.name} - Notes
                </h2>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="View Large"
                    >
                        <Maximize2 size={16} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="Export"
                    >
                        <Save size={16} />
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="flex-1 overflow-hidden relative flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    <style>{`
                        .mini-editor .ql-container { font-size: 14px; font-family: inherit; border: none !important; }
                        .mini-editor .ql-editor { 
                            padding: 1rem; 
                            padding-top: 1.5rem; /* Align first line */
                            height: 100%; 
                            overflow-y: auto; 
                            counter-reset: paragraph;
                            background-image: 
                                linear-gradient(to right, transparent 35px, #e4e4e7 35px, #e4e4e7 36px, transparent 36px),
                                repeating-linear-gradient(transparent, transparent 31px, #e4e4e7 31px, #e4e4e7 32px);
                            background-attachment: local;
                            line-height: 32px;
                            background-position: 0 1.5rem; /* Align lines to bottom of text row (matches padding-top) */
                        }
                        .dark .mini-editor .ql-editor {
                            background-image: 
                                linear-gradient(to right, transparent 35px, #27272a 35px, #27272a 36px, transparent 36px),
                                repeating-linear-gradient(transparent, transparent 31px, #27272a 31px, #27272a 32px);
                        }
                        .mini-editor .ql-editor p,
                        .mini-editor .ql-editor h1,
                        .mini-editor .ql-editor h2,
                        .mini-editor .ql-editor h3,
                        .mini-editor .ql-editor h4,
                        .mini-editor .ql-editor h5,
                        .mini-editor .ql-editor h6,
                        .mini-editor .ql-editor li,
                        .mini-editor .ql-editor blockquote,
                        .mini-editor .ql-editor pre { 
                            position: relative; 
                            counter-increment: paragraph; 
                            padding-left: 1.5rem; 
                            margin-bottom: 0; 
                        }
                        .mini-editor .ql-editor p::before,
                        .mini-editor .ql-editor h1::before,
                        .mini-editor .ql-editor h2::before,
                        .mini-editor .ql-editor h3::before,
                        .mini-editor .ql-editor h4::before,
                        .mini-editor .ql-editor h5::before,
                        .mini-editor .ql-editor h6::before,
                        .mini-editor .ql-editor li::before,
                        .mini-editor .ql-editor blockquote::before,
                        .mini-editor .ql-editor pre::before {
                            content: counter(paragraph);
                            position: absolute;
                            left: 0;
                            top: 0;
                            color: #a1a1aa;
                            font-size: 0.7rem;
                            font-family: monospace;
                            opacity: 0.5;
                            width: 1rem;
                            text-align: right;
                            pointer-events: none;
                            line-height: 32px;
                        }
                        .dark .ql-editor { color: #e4e4e7; }
                    `}</style>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={editorContent}
                        onChange={handleChange}
                        modules={modules}
                        className="h-full flex flex-col mini-editor"
                    />
                </div>
            )}

            <NotesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default NotesArea;
