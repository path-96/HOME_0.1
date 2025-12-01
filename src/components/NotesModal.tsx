import React, { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TurndownService from 'turndown';
import showdown from 'showdown';

interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose }) => {
    const { projects, activeProjectId, updateProjectNotes, t } = useApp();
    const activeProject = projects.find(p => p.id === activeProjectId);
    const [editorContent, setEditorContent] = useState('');
    const quillRef = useRef<any>(null);

    // Converters
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
    });
    const converter = new showdown.Converter();

    // Load initial content
    useEffect(() => {
        if (isOpen && activeProject) {
            const html = converter.makeHtml(activeProject.notes || '');
            setEditorContent(html);
        }
    }, [isOpen, activeProject?.id]);

    // Handle change
    const handleChange = (content: string) => {
        setEditorContent(content);

        if (activeProject) {
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

    const handleImport = async () => {
        if (!activeProject) return;
        try {
            // @ts-ignore
            const filePath = await window.ipcRenderer.invoke('select-note-file');
            if (filePath) {
                // @ts-ignore
                const content = await window.ipcRenderer.invoke('read-file', filePath);
                if (content) {
                    const html = converter.makeHtml(content);
                    setEditorContent(html);

                    // Update project notes immediately
                    const markdown = turndownService.turndown(html);
                    updateProjectNotes(activeProject.id, markdown);
                }
            }
        } catch (err) {
            console.error('Failed to import notes', err);
        }
    };

    if (!isOpen || !activeProject) return null;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'code-block'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet',
        'link', 'code-block'
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl w-[90vw] h-[90vh] flex flex-col shadow-2xl overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
                        {activeProject.name} - {t('notes')}
                    </h2>
                    <button
                        onClick={handleImport}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400 mr-1"
                        title={t('import')}
                    >
                        <Upload size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-900 flex flex-col">
                    <style>{`
                        .ql-container { font-size: 16px; font-family: inherit; border: none !important; }
                        .ql-toolbar { border: none !important; border-bottom: 1px solid #e4e4e7 !important; background: #fafafa; }
                        .dark .ql-toolbar { border-bottom: 1px solid #27272a !important; background: #18181b; }
                        .dark .ql-stroke { stroke: #a1a1aa !important; }
                        .dark .ql-fill { fill: #a1a1aa !important; }
                        .dark .ql-picker { color: #a1a1aa !important; }
                        .dark .ql-picker-options { background-color: #18181b !important; border-color: #27272a !important; }
                        .dark .ql-editor { color: #e4e4e7; }
                        .ql-editor { 
                            padding: 2rem; 
                            padding-top: 2.5rem; /* Align first line */
                            height: 100%; 
                            overflow-y: auto; 
                            counter-reset: paragraph;
                            background-image: 
                                linear-gradient(to right, transparent 27px, #e4e4e7 27px, #e4e4e7 28px, transparent 28px),
                                repeating-linear-gradient(transparent, transparent 31px, #e4e4e7 31px, #e4e4e7 32px);
                            background-attachment: local;
                            line-height: 32px;
                            background-position: 0 2.5rem; /* Align lines to bottom of text row (matches padding-top) */
                        }
                        .dark .ql-editor {
                            background-image: 
                                linear-gradient(to right, transparent 27px, #27272a 27px, #27272a 28px, transparent 28px),
                                repeating-linear-gradient(transparent, transparent 31px, #27272a 31px, #27272a 32px);
                        }
                        .ql-editor p,
                        .ql-editor h1,
                        .ql-editor h2,
                        .ql-editor h3,
                        .ql-editor h4,
                        .ql-editor h5,
                        .ql-editor h6,
                        .ql-editor li,
                        .ql-editor blockquote,
                        .ql-editor pre { 
                            position: relative; 
                            counter-increment: paragraph; 
                            margin-bottom: 0; 
                        }
                        .ql-editor p::before,
                        .ql-editor h1::before,
                        .ql-editor h2::before,
                        .ql-editor h3::before,
                        .ql-editor h4::before,
                        .ql-editor h5::before,
                        .ql-editor h6::before,
                        .ql-editor li::before,
                        .ql-editor blockquote::before,
                        .ql-editor pre::before {
                            content: counter(paragraph);
                            position: absolute;
                            left: -1.5rem;
                            top: 0;
                            color: #a1a1aa;
                            font-size: 0.75rem;
                            font-family: monospace;
                            opacity: 0.5;
                            width: 1rem;
                            text-align: right;
                            pointer-events: none;
                            line-height: 32px;
                        }
                    `}</style>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={editorContent}
                        onChange={handleChange}
                        modules={modules}
                        formats={formats}
                        className="h-full flex flex-col"
                    />
                </div>
            </div>
        </div>
    );
};

export default NotesModal;
