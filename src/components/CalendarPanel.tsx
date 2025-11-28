import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Components } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ExternalLink, Calendar as CalendarIcon, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CalendarModal from './CalendarModal';

const localizer = momentLocalizer(moment);

const CalendarPanel: React.FC = () => {
    const { calendarMemos, updateCalendarMemo } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [memoText, setMemoText] = useState('');
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

    const handleSelectSlot = (slotInfo: { start: Date; box?: { x: number; y: number; clientX: number; clientY: number } }) => {
        const dateStr = moment(slotInfo.start).format('YYYY-MM-DD');
        setSelectedDate(slotInfo.start);
        setMemoText(calendarMemos[dateStr] || '');
        setTooltip(null);
    };

    const handleSaveMemo = () => {
        if (selectedDate) {
            const dateStr = moment(selectedDate).format('YYYY-MM-DD');
            updateCalendarMemo(dateStr, memoText);
            setSelectedDate(null);
        }
    };

    const handleMouseEnter = (e: React.MouseEvent, memo: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            text: memo,
            x: rect.right + 10,
            y: rect.top
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const CustomDateHeader = ({ date, label }: { date: Date; label: string }) => {
        const dateStr = moment(date).format('YYYY-MM-DD');
        const memo = calendarMemos[dateStr];

        return (
            <div
                className="flex flex-col items-center relative w-full overflow-hidden"
                onMouseEnter={(e) => memo && handleMouseEnter(e, memo)}
                onMouseLeave={handleMouseLeave}
            >
                <span className="mb-0.5">{label}</span>
                {memo && (
                    <div className="w-full px-0.5">
                        <div className="text-[10px] leading-tight bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 rounded-[3px] px-1 py-0.5 truncate border border-emerald-200 dark:border-emerald-800/50 text-center font-normal">
                            {memo}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const components: Components = useMemo(() => ({
        month: {
            dateHeader: CustomDateHeader,
        },
    }), [calendarMemos]);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-green-200 dark:border-zinc-800 relative">
            <style>{`
                .rbc-calendar { color: inherit; }
                .rbc-toolbar button { color: inherit; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px; margin-left: 2px; margin-right: 2px; }
                .rbc-toolbar button:hover { background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.4); }
                .rbc-toolbar button.rbc-active { background-color: rgba(16, 185, 129, 0.2); box-shadow: none; border-color: rgba(16, 185, 129, 0.5); font-weight: 600; }
                .rbc-month-view { border: none; }
                .rbc-header { border-bottom: 1px solid rgba(16, 185, 129, 0.1); padding: 8px 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #047857; }
                .dark .rbc-header { color: #34d399; border-color: rgba(63, 63, 70, 0.5); }
                .rbc-day-bg { border-left: 1px solid rgba(16, 185, 129, 0.05); }
                .dark .rbc-day-bg { border-color: rgba(63, 63, 70, 0.3); }
                .rbc-off-range-bg { background-color: rgba(16, 185, 129, 0.02); }
                .dark .rbc-off-range-bg { background-color: rgba(0, 0, 0, 0.2); }
                .rbc-today { background-color: rgba(16, 185, 129, 0.1); }
                .dark .rbc-today { background-color: rgba(16, 185, 129, 0.15); }
                .rbc-date-cell { padding: 4px; font-size: 0.85rem; text-align: center; opacity: 0.8; }
                .rbc-toolbar-label { font-weight: bold; font-size: 1rem; color: #064e3b; text-transform: capitalize; }
                .dark .rbc-toolbar-label { color: #f4f4f5; }
                .rbc-btn-group button { color: #065f46; font-size: 0.8rem; padding: 4px 8px; }
                .dark .rbc-btn-group button { color: #a1a1aa; }
            `}</style>
            <div className="p-4 border-b border-green-200 dark:border-zinc-800 flex items-center justify-between bg-green-50/50 dark:bg-zinc-900">
                <h2 className="font-semibold text-green-950 dark:text-zinc-100 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-emerald-700 dark:text-emerald-500" /> Calendar
                </h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs flex items-center gap-1 text-emerald-700 dark:text-emerald-500 hover:text-emerald-900 dark:hover:text-emerald-400 font-medium px-2 py-1 rounded-md hover:bg-emerald-100/50 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-zinc-700"
                >
                    <ExternalLink size={12} /> View Full
                </button>
            </div>
            <div className="flex-1 p-2 [&_.rbc-toolbar]:flex-col [&_.rbc-toolbar]:gap-2 [&_.rbc-toolbar]:mb-2 [&_.rbc-btn-group]:w-full [&_.rbc-btn-group]:flex [&_.rbc-btn-group_button]:flex-1 text-green-950 dark:text-zinc-300 relative">
                <Calendar
                    localizer={localizer}
                    events={[]}
                    startAccessor="start"
                    endAccessor="end"
                    views={['month']}
                    defaultView='month'
                    toolbar={true}
                    className="h-full"
                    selectable
                    onSelectSlot={handleSelectSlot}
                    components={components}
                />

                {/* Custom Tooltip */}
                {tooltip && (
                    <div
                        className="fixed z-50 bg-zinc-800 text-white text-sm p-3 rounded shadow-lg max-w-[250px] break-words pointer-events-none"
                        style={{
                            left: Math.min(tooltip.x, window.innerWidth - 260),
                            top: Math.min(tooltip.y, window.innerHeight - 50)
                        }}
                    >
                        {tooltip.text}
                    </div>
                )}

                {/* Memo Popover */}
                {selectedDate && (
                    <div className="absolute inset-0 z-10 bg-black/10 backdrop-blur-[1px] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-green-200 dark:border-zinc-700 w-64 p-3 flex flex-col gap-2 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between border-b border-green-100 dark:border-zinc-700 pb-2">
                                <span className="text-sm font-semibold text-green-900 dark:text-zinc-200">
                                    {moment(selectedDate).format('MMM D, YYYY')}
                                </span>
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <textarea
                                value={memoText}
                                onChange={(e) => setMemoText(e.target.value)}
                                className="w-full h-24 text-sm p-2 bg-green-50/50 dark:bg-zinc-900/50 border border-green-100 dark:border-zinc-700 rounded resize-none outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-green-900 dark:text-zinc-200 placeholder-green-700/30 dark:placeholder-zinc-600"
                                placeholder="Add a note..."
                                autoFocus
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveMemo}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
                                >
                                    <Save size={12} /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <CalendarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default CalendarPanel;
