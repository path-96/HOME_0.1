import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useApp } from '../context/AppContext';
import { Settings } from 'lucide-react';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
}

const CalendarView: React.FC = () => {
    const { googleAuth } = useApp();
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const fetchEvents = async (tokens: any) => {
        try {
            // @ts-ignore
            const googleEvents = await window.ipcRenderer.invoke('get-calendar-events', tokens);
            const formattedEvents = googleEvents.map((event: any) => ({
                id: event.id,
                title: event.summary,
                start: new Date(event.start.dateTime || event.start.date),
                end: new Date(event.end.dateTime || event.end.date),
                allDay: !event.start.dateTime,
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    useEffect(() => {
        if (googleAuth.isAuthenticated && googleAuth.tokens) {
            fetchEvents(googleAuth.tokens);
        } else {
            setEvents([]);
        }
    }, [googleAuth.isAuthenticated, googleAuth.tokens]);

    if (!googleAuth.isAuthenticated) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                <h2 className="text-xl font-bold mb-4">Google Calendar</h2>
                <p className="text-gray-400 mb-6 text-center text-sm">
                    Connect your account in Settings to view your schedule.
                </p>
                <div className="flex items-center gap-2 text-gray-500 bg-gray-800 px-4 py-2 rounded-lg">
                    <Settings size={16} />
                    <span>Go to Settings &gt; Accounts</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-gray-900 text-white p-2">
            <style>{`
        .rbc-calendar { color: #e5e7eb; }
        .rbc-toolbar button { color: #e5e7eb; border-color: #374151; }
        .rbc-toolbar button:hover { bg-color: #374151; }
        .rbc-toolbar button.rbc-active { background-color: #3b82f6; color: white; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: #374151; }
        .rbc-header { border-bottom-color: #374151; }
        .rbc-day-bg + .rbc-day-bg { border-left-color: #374151; }
        .rbc-off-range-bg { background-color: #1f2937; }
        .rbc-today { background-color: #374151; }
        .rbc-event { background-color: #3b82f6; }
      `}</style>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="agenda"
            />
        </div>
    );
};

export default CalendarView;
