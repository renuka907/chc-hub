import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, addDays, startOfDay, endOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CalendarView({ reminders, viewMode = "month", onViewChange }) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const queryClient = useQueryClient();

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        
        const reminder = JSON.parse(result.draggableId);
        const targetDate = new Date(result.destination.droppableId);
        
        try {
            const originalTime = new Date(reminder.due_date);
            const newDueDate = new Date(targetDate);
            newDueDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds());
            
            await base44.entities.Reminder.update(reminder.id, {
                due_date: newDueDate.toISOString(),
                next_trigger_at: newDueDate.toISOString()
            });
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            toast.success(`Reminder rescheduled to ${format(newDueDate, 'MMM d, yyyy')}`);
        } catch (error) {
            toast.error('Failed to reschedule reminder');
        }
    };

    const getRemindersForDate = (date) => {
        return reminders.filter(r => {
            if (!r.due_date) return false;
            const remDate = new Date(r.due_date);
            const checkDate = new Date(date);
            return isSameDay(remDate, checkDate) && !r.completed;
        });
    };

    const ReminderCell = ({ reminder }) => {
        const isOverdue = new Date(reminder.due_date) < new Date() && !reminder.completed;
        const priorityColor = {
            low: "bg-blue-100 text-blue-800",
            medium: "bg-yellow-100 text-yellow-800",
            high: "bg-red-100 text-red-800"
        }[reminder.priority] || "bg-gray-100 text-gray-800";

        return (
            <Draggable
                draggableId={JSON.stringify(reminder)}
                index={reminders.indexOf(reminder)}
            >
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-1 mb-1 rounded text-xs cursor-move transition-all ${
                            snapshot.isDragging 
                                ? "opacity-50 shadow-lg scale-105" 
                                : "opacity-100"
                        } ${priorityColor} truncate`}
                        title={reminder.title}
                    >
                        {reminder.title}
                    </div>
                )}
            </Draggable>
        );
    };

    const MonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        return (
            <div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-center font-semibold text-sm text-gray-600 p-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="space-y-1">
                    {weeks.map((week, idx) => (
                        <div key={idx} className="grid grid-cols-7 gap-1">
                            {week.map(day => (
                                <Droppable
                                    key={format(day, "yyyy-MM-dd")}
                                    droppableId={day.toISOString()}
                                >
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-24 p-2 rounded border-2 transition-all ${
                                                !isSameMonth(day, currentDate)
                                                    ? "bg-gray-50 border-gray-200"
                                                    : snapshot.isDraggingOver
                                                    ? "bg-blue-50 border-blue-300"
                                                    : "bg-white border-gray-200"
                                            }`}
                                        >
                                            <div className="text-xs font-semibold text-gray-600 mb-1">
                                                {format(day, "d")}
                                            </div>
                                            <div className="space-y-1">
                                                {getRemindersForDate(day).map((reminder, i) => (
                                                    <ReminderCell key={reminder.id} reminder={reminder} />
                                                ))}
                                            </div>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const WeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return (
            <div>
                <div className="grid grid-cols-7 gap-2">
                    {days.map(day => (
                        <Droppable
                            key={format(day, "yyyy-MM-dd")}
                            droppableId={day.toISOString()}
                        >
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-96 p-3 rounded border-2 transition-all ${
                                        snapshot.isDraggingOver
                                            ? "bg-blue-50 border-blue-300"
                                            : "bg-white border-gray-200"
                                    }`}
                                >
                                    <div className="font-semibold text-sm text-gray-700 mb-2">
                                        {format(day, "EEE")}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-3">
                                        {format(day, "MMM d")}
                                    </div>
                                    <div className="space-y-1">
                                        {getRemindersForDate(day).map(reminder => (
                                            <ReminderCell key={reminder.id} reminder={reminder} />
                                        ))}
                                    </div>
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </div>
        );
    };

    const DayView = () => {
        const dayReminders = getRemindersForDate(currentDate);

        return (
            <Droppable droppableId={currentDate.toISOString()}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-96 p-4 rounded border-2 transition-all ${
                            snapshot.isDraggingOver
                                ? "bg-blue-50 border-blue-300"
                                : "bg-white border-gray-200"
                        }`}
                    >
                        <div className="text-2xl font-bold text-gray-800 mb-2">
                            {format(currentDate, "EEEE")}
                        </div>
                        <div className="text-lg text-gray-500 mb-6">
                            {format(currentDate, "MMMM d, yyyy")}
                        </div>
                        <div className="space-y-2">
                            {dayReminders.length === 0 ? (
                                <p className="text-gray-400 italic">No reminders for this day</p>
                            ) : (
                                dayReminders.map(reminder => (
                                    <ReminderCell key={reminder.id} reminder={reminder} />
                                ))
                            )}
                        </div>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        );
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="bg-white rounded-lg border p-6">
                {/* Header Controls */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === "month" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onViewChange("month")}
                        >
                            Month
                        </Button>
                        <Button
                            variant={viewMode === "week" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onViewChange("week")}
                        >
                            Week
                        </Button>
                        <Button
                            variant={viewMode === "day" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onViewChange("day")}
                        >
                            Day
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentDate(addDays(currentDate, viewMode === "week" ? -7 : viewMode === "day" ? -1 : -30))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="min-w-48 text-center font-semibold text-gray-700">
                            {viewMode === "month" && format(currentDate, "MMMM yyyy")}
                            {viewMode === "week" && `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
                            {viewMode === "day" && format(currentDate, "MMMM d, yyyy")}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentDate(addDays(currentDate, viewMode === "week" ? 7 : viewMode === "day" ? 1 : 30))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentDate(new Date())}
                        >
                            Today
                        </Button>
                    </div>
                </div>

                {/* Calendar Content */}
                <div className="mt-6">
                    {viewMode === "month" && <MonthView />}
                    {viewMode === "week" && <WeekView />}
                    {viewMode === "day" && <DayView />}
                </div>
            </div>
        </DragDropContext>
    );
}