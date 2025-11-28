import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, Shortcut } from '../types';

interface AppContextType {
    projects: Project[];
    activeProjectId: string | null;
    shortcuts: Shortcut[];
    addProject: (name: string, description?: string) => void;
    deleteProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    setActiveProject: (id: string) => void;
    updateProjectNotes: (id: string, notes: string) => void;
    addShortcut: (shortcut: Omit<Shortcut, 'id'>) => void;
    updateShortcut: (id: string, updates: Partial<Shortcut>) => void;
    removeShortcut: (id: string) => void;
    globalShortcuts: Shortcut[];
    addGlobalShortcut: (shortcut: Omit<Shortcut, 'id'>) => void;
    updateGlobalShortcut: (id: string, updates: Partial<Shortcut>) => void;
    removeGlobalShortcut: (id: string) => void;
    calendarMemos: Record<string, string>;
    updateCalendarMemo: (date: string, memo: string) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    importData: (data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [globalShortcuts, setGlobalShortcuts] = useState<Shortcut[]>([]);
    const [calendarMemos, setCalendarMemos] = useState<Record<string, string>>({});
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Load data from localStorage
    useEffect(() => {
        const savedProjects = localStorage.getItem('projects');
        const savedShortcuts = localStorage.getItem('shortcuts');
        const savedGlobalShortcuts = localStorage.getItem('globalShortcuts');
        const savedMemos = localStorage.getItem('calendarMemos');
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';

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

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const addProject = (name: string, description?: string) => {
        const newProject: Project = {
            id: uuidv4(),
            name,
            description: description || '',
            isPinned: false,
            notes: ''
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

    const importData = (data: any) => {
        if (data.projects) setProjects(data.projects);
        if (data.shortcuts) setShortcuts(data.shortcuts);
        if (data.globalShortcuts) setGlobalShortcuts(data.globalShortcuts);
        if (data.calendarMemos) setCalendarMemos(data.calendarMemos);
        if (data.projects && data.projects.length > 0) {
            setActiveProjectId(data.projects[0].id);
        }
    };

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
            globalShortcuts,
            addGlobalShortcut,
            updateGlobalShortcut,
            removeGlobalShortcut,
            calendarMemos,
            updateCalendarMemo,
            theme,
            toggleTheme,
            importData
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
