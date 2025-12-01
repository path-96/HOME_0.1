import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, Shortcut } from '../types';

interface AppContextType {
    projects: Project[];
    activeProjectId: string | null;
    shortcuts: Shortcut[];
    addProject: (name: string, description?: string, ip?: string, gateway?: string) => void;
    deleteProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    setActiveProject: (id: string) => void;
    updateProjectNotes: (id: string, notes: string) => void;
    addShortcut: (shortcut: Omit<Shortcut, 'id'>) => void;
    updateShortcut: (id: string, updates: Partial<Shortcut>) => void;
    removeShortcut: (id: string) => void;
    reorderShortcuts: (projectId: string, newOrderedShortcuts: Shortcut[]) => void;
    globalShortcuts: Shortcut[];
    addGlobalShortcut: (shortcut: Omit<Shortcut, 'id'>) => void;
    updateGlobalShortcut: (id: string, updates: Partial<Shortcut>) => void;
    removeGlobalShortcut: (id: string) => void;
    calendarMemos: Record<string, string>;
    updateCalendarMemo: (date: string, memo: string) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    importData: (data: any) => void;
    globalNetworkSettings: { ip: string; gateway: string; interfaceName?: string };
    updateGlobalNetworkSettings: (settings: { ip: string; gateway: string; interfaceName?: string }) => void;
    availableInterfaces: string[];
    refreshInterfaces: () => Promise<void>;
    googleAuth: { isAuthenticated: boolean; tokens: any; user: any };
    login: () => Promise<void>;
    logout: () => void;
    language: 'en' | 'ja';
    toggleLanguage: () => void;
    t: (key: any) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [globalShortcuts, setGlobalShortcuts] = useState<Shortcut[]>([]);
    const [calendarMemos, setCalendarMemos] = useState<Record<string, string>>({});
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [globalNetworkSettings, setGlobalNetworkSettings] = useState<{ ip: string; gateway: string; interfaceName?: string }>({ ip: '', gateway: '', interfaceName: 'Ethernet' });
    const [availableInterfaces, setAvailableInterfaces] = useState<string[]>([]);
    const [googleAuth, setGoogleAuth] = useState({ isAuthenticated: false, tokens: null, user: null });

    const login = async () => {
        // Placeholder for login logic
        console.log("Login not implemented");
    };

    const logout = () => {
        setGoogleAuth({ isAuthenticated: false, tokens: null, user: null });
    };

    // Load data from localStorage
    useEffect(() => {
        const savedProjects = localStorage.getItem('projects');
        const savedShortcuts = localStorage.getItem('shortcuts');
        const savedGlobalShortcuts = localStorage.getItem('globalShortcuts');
        const savedMemos = localStorage.getItem('calendarMemos');
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        const savedNetworkSettings = localStorage.getItem('globalNetworkSettings');

        if (savedProjects) {
            const parsedProjects = JSON.parse(savedProjects);
            setProjects(parsedProjects);
            if (parsedProjects.length > 0) {
                setActiveProjectId(parsedProjects[0].id);
            }
        } else {
            setProjects([]);
            setActiveProjectId(null);
        }

        if (savedShortcuts) {
            setShortcuts(JSON.parse(savedShortcuts));
        }

        if (savedGlobalShortcuts) {
            setGlobalShortcuts(JSON.parse(savedGlobalShortcuts));
        }

        if (savedMemos) {
            setCalendarMemos(JSON.parse(savedMemos));
        }

        if (savedTheme) {
            setTheme(savedTheme);
        }

        if (savedNetworkSettings) {
            setGlobalNetworkSettings(JSON.parse(savedNetworkSettings));
        }
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('projects', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    }, [shortcuts]);

    useEffect(() => {
        localStorage.setItem('globalShortcuts', JSON.stringify(globalShortcuts));
    }, [globalShortcuts]);

    useEffect(() => {
        localStorage.setItem('calendarMemos', JSON.stringify(calendarMemos));
    }, [calendarMemos]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        // Apply theme class to body
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('globalNetworkSettings', JSON.stringify(globalNetworkSettings));
    }, [globalNetworkSettings]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const addProject = (name: string, description?: string, ip?: string, gateway?: string) => {
        const newProject: Project = {
            id: uuidv4(),
            name,
            description: description || '',
            isPinned: false,
            notes: '',
            ip: ip || '',
            gateway: gateway || ''
        };
        setProjects([...projects, newProject]);
        setActiveProjectId(newProject.id);
    };

    const deleteProject = (id: string) => {
        const newProjects = projects.filter(p => p.id !== id);
        setProjects(newProjects);
        if (activeProjectId === id && newProjects.length > 0) {
            setActiveProjectId(newProjects[0].id);
        } else if (newProjects.length === 0) {
            setActiveProjectId(null);
        }
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const setActiveProject = (id: string) => {
        setActiveProjectId(id);
    };

    const updateProjectNotes = (id: string, notes: string) => {
        setProjects(projects.map(p => p.id === id ? { ...p, notes } : p));
    };

    const addShortcut = (shortcut: Omit<Shortcut, 'id'>) => {
        const newShortcut = { ...shortcut, id: uuidv4() };
        setShortcuts([...shortcuts, newShortcut]);
    };

    const updateShortcut = (id: string, updates: Partial<Shortcut>) => {
        setShortcuts(shortcuts.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeShortcut = (id: string) => {
        setShortcuts(shortcuts.filter(s => s.id !== id));
    };

    const reorderShortcuts = (projectId: string, newOrderedShortcuts: Shortcut[]) => {
        // Keep shortcuts from other projects
        const otherShortcuts = shortcuts.filter(s => s.projectId !== projectId);
        // Combine with new ordered shortcuts
        setShortcuts([...otherShortcuts, ...newOrderedShortcuts]);
    };

    const addGlobalShortcut = (shortcut: Omit<Shortcut, 'id'>) => {
        const newShortcut = { ...shortcut, id: uuidv4() };
        setGlobalShortcuts([...globalShortcuts, newShortcut]);
    };

    const updateGlobalShortcut = (id: string, updates: Partial<Shortcut>) => {
        setGlobalShortcuts(globalShortcuts.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeGlobalShortcut = (id: string) => {
        setGlobalShortcuts(globalShortcuts.filter(s => s.id !== id));
    };

    const updateCalendarMemo = (date: string, memo: string) => {
        setCalendarMemos(prev => ({
            ...prev,
            [date]: memo
        }));
    };

    const updateGlobalNetworkSettings = (settings: { ip: string; gateway: string; interfaceName?: string }) => {
        setGlobalNetworkSettings(settings);
    };

    const refreshInterfaces = async () => {
        try {
            // @ts-ignore
            const interfaces = await window.ipcRenderer.invoke('get-network-interfaces');
            setAvailableInterfaces(interfaces);
        } catch (error) {
            console.error('Failed to fetch network interfaces:', error);
        }
    };

    useEffect(() => {
        refreshInterfaces();
    }, []);

    const importData = (data: any) => {
        if (data.projects) setProjects(data.projects);
        if (data.shortcuts) setShortcuts(data.shortcuts);
        if (data.globalShortcuts) setGlobalShortcuts(data.globalShortcuts);
        if (data.calendarMemos) setCalendarMemos(data.calendarMemos);
        if (data.globalNetworkSettings) setGlobalNetworkSettings(data.globalNetworkSettings);
        if (data.projects && data.projects.length > 0) {
            setActiveProjectId(data.projects[0].id);
        }
    };

    const [language, setLanguage] = useState<'en' | 'ja'>('en');

    // Translations
    const translations = {
        en: {
            projects: 'Projects',
            newProject: 'New Project',
            settings: 'Settings',
            general: 'General',
            data: 'Data',
            network: 'Network',
            appearance: 'Appearance',
            theme: 'Theme',
            chooseTheme: 'Choose your preferred appearance',
            light: 'Light',
            dark: 'Dark',
            dataManagement: 'Data Management',
            exportData: 'Export Data',
            exportJson: 'Export JSON',
            exportDesc: 'Download a backup of all your projects, shortcuts, and notes.',
            importData: 'Import Data',
            importJson: 'Import JSON',
            importDesc: 'Restore your data from a backup file.',
            importWarning: 'Warning: Importing data will overwrite all your current projects and settings. This action cannot be undone.',
            globalNetworkSettings: 'Global Network Settings',
            networkInterface: 'Network Interface',
            selectAdapter: 'Select the network adapter to configure.',
            defaultIp: 'Default IP Address',
            defaultGateway: 'Default Gateway',
            networkNote: 'These settings will be used as defaults but can be overridden per project.',
            changeNetworkSetting: 'Change Network Setting',
            projectNetworkSettings: 'Project Network Settings',
            ipAddress: 'IP Address',
            gateway: 'Gateway',
            changeIp: 'Change IP',
            cancel: 'Cancel',
            saveChanges: 'Save Changes',
            create: 'Create',
            createNewProject: 'Create New Project',
            editProject: 'Edit Project',
            projectName: 'Project Name',
            description: 'Description (Optional)',
            addGlobalShortcut: 'Add Global Shortcut',
            editGlobalShortcut: 'Edit Global Shortcut',
            addShortcut: 'Add Shortcut',
            file: 'File',
            folder: 'Folder',
            link: 'Link',
            filePath: 'File Path',
            folderPath: 'Folder Path',
            url: 'URL',
            browse: 'Browse',
            name: 'Name',
            shortcutName: 'Shortcut Name',
            deleteProjectConfirm: 'Are you sure you want to delete this project?',
            importSuccess: 'Data imported successfully!',
            importFailed: 'Failed to import data. Invalid file format.',
            networkSuccess: 'Network settings applied successfully!',
            networkFailed: 'Failed to apply network settings',
            adminRequired: 'Make sure you are running as Administrator.',
            // Layout
            noProjectSelected: 'No Project Selected',
            ethernetDefault: 'Ethernet (Default)',
            // Calendar
            calendar: 'Calendar',
            viewFull: 'View Full',
            addNote: 'Add a note...',
            save: 'Save',
            // Shortcut Grid
            selectProjectToViewShortcuts: 'Select a project to view shortcuts',
            dragDropFiles: 'Drag and drop files here',
            orCreateShortcut: 'or create a new shortcut',
            // Notes
            notes: 'Notes',
            viewLarge: 'View Large',
            export: 'Export',
            import: 'Import'
        },
        ja: {
            projects: 'プロジェクト',
            newProject: '新規プロジェクト',
            settings: '設定',
            general: '一般',
            data: 'データ',
            network: 'ネットワーク',
            appearance: '外観',
            theme: 'テーマ',
            chooseTheme: 'お好みの外観を選択してください',
            light: 'ライト',
            dark: 'ダーク',
            dataManagement: 'データ管理',
            exportData: 'データのエクスポート',
            exportJson: 'JSONをエクスポート',
            exportDesc: 'すべてのプロジェクト、ショートカット、メモのバックアップをダウンロードします。',
            importData: 'データのインポート',
            importJson: 'JSONをインポート',
            importDesc: 'バックアップファイルからデータを復元します。',
            importWarning: '警告: データをインポートすると、現在のすべてのプロジェクトと設定が上書きされます。この操作は元に戻せません。',
            globalNetworkSettings: 'グローバルネットワーク設定',
            networkInterface: 'ネットワークインターフェース',
            selectAdapter: '設定するネットワークアダプターを選択してください。',
            defaultIp: 'デフォルトIPアドレス',
            defaultGateway: 'デフォルトゲートウェイ',
            networkNote: 'これらの設定はデフォルトとして使用されますが、プロジェクトごとに上書きできます。',
            changeNetworkSetting: 'ネットワーク設定を変更',
            projectNetworkSettings: 'プロジェクトネットワーク設定',
            ipAddress: 'IPアドレス',
            gateway: 'ゲートウェイ',
            changeIp: 'IPを変更',
            cancel: 'キャンセル',
            saveChanges: '変更を保存',
            create: '作成',
            createNewProject: '新規プロジェクト作成',
            editProject: 'プロジェクト編集',
            projectName: 'プロジェクト名',
            description: '説明 (オプション)',
            addGlobalShortcut: 'グローバルショートカット追加',
            editGlobalShortcut: 'グローバルショートカット編集',
            addShortcut: 'ショートカット追加',
            file: 'ファイル',
            folder: 'フォルダ',
            link: 'リンク',
            filePath: 'ファイルパス',
            folderPath: 'フォルダパス',
            url: 'URL',
            browse: '参照',
            name: '名前',
            shortcutName: 'ショートカット名',
            deleteProjectConfirm: 'このプロジェクトを削除してもよろしいですか？',
            importSuccess: 'データが正常にインポートされました！',
            importFailed: 'データのインポートに失敗しました。ファイル形式が無効です。',
            networkSuccess: 'ネットワーク設定が正常に適用されました！',
            networkFailed: 'ネットワーク設定の適用に失敗しました',
            adminRequired: '管理者として実行していることを確認してください。',
            // Layout
            noProjectSelected: 'プロジェクトが選択されていません',
            ethernetDefault: 'イーサネット (デフォルト)',
            // Calendar
            calendar: 'カレンダー',
            viewFull: '全画面表示',
            addNote: 'メモを追加...',
            save: '保存',
            // Shortcut Grid
            selectProjectToViewShortcuts: 'ショートカットを表示するにはプロジェクトを選択してください',
            dragDropFiles: 'ここにファイルをドラッグ＆ドロップ',
            orCreateShortcut: 'または新しいショートカットを作成',
            // Notes
            notes: 'メモ',
            viewLarge: '拡大表示',
            export: 'エクスポート',
            addNewShortcut: '新規ショートカット追加',
            editShortcut: 'ショートカット編集',
            import: 'インポート'
        }
    };

    const t = (key: keyof typeof translations['en']) => {
        return translations[language][key] || key;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ja' : 'en');
    };

    // Load language from localStorage
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') as 'en' | 'ja';
        if (savedLanguage) {
            setLanguage(savedLanguage);
        }
    }, []);

    // Save language to localStorage
    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    return (
        <AppContext.Provider value={{
            projects,
            activeProjectId,
            shortcuts,
            addProject,
            deleteProject,
            updateProject,
            setActiveProject,
            updateProjectNotes,
            addShortcut,
            updateShortcut,
            removeShortcut,
            reorderShortcuts,
            globalShortcuts,
            addGlobalShortcut,
            updateGlobalShortcut,
            removeGlobalShortcut,
            calendarMemos,
            updateCalendarMemo,
            theme,
            toggleTheme,
            importData,
            globalNetworkSettings,
            updateGlobalNetworkSettings,
            availableInterfaces,
            refreshInterfaces,
            googleAuth,
            login,
            logout,
            language,
            toggleLanguage,
            t
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
