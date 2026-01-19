import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import ReminderEditDialog from "../components/reminders/ReminderEditDialog";
import { Bell, Plus, Clock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Reminders() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const queryClient = useQueryClient();

    const { data: reminders = [], isLoading } = useQuery({
        queryKey: ['reminders'],
        queryFn: () => base44.entities.Reminder.list('-due_date', 100),
    });

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const toggleCompleteMutation = useMutation({
        mutationFn: ({ id, completed }) => 
            base44.entities.Reminder.update(id, { completed }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        }
    });

    const handleToggleComplete = (reminder) => {
        toggleCompleteMutation.mutate({
            id: reminder.id,
            completed: !reminder.completed
        });
    };

    const filteredReminders = reminders.filter(reminder => {
        if (filterStatus === "completed") return reminder.completed;
        if (filterStatus === "active") return !reminder.completed;
        return true;
    });

    const priorityColors = {
        low: "bg-blue-100 text-blue-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-red-100 text-red-800"
    };

    const getPriorityIcon = (priority) => {
        if (priority === "high") return <AlertCircle className="w-4 h-4" />;
        return <Clock className="w-4 h-4" />;
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Bell className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Reminders</h1>
                            <p className="text-gray-600">Track tasks and upcoming deadlines</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => {
                            setEditingReminder(null);
                            setShowCreateDialog(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Reminder
                    </Button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    onClick={() => setFilterStatus("all")}
                    className={filterStatus === "all" ? "bg-purple-600" : ""}
                >
                    All ({reminders.length})
                </Button>
                <Button
                    variant={filterStatus === "active" ? "default" : "outline"}
                    onClick={() => setFilterStatus("active")}
                    className={filterStatus === "active" ? "bg-purple-600" : ""}
                >
                    Active ({reminders.filter(r => !r.completed).length})
                </Button>
                <Button
                    variant={filterStatus === "completed" ? "default" : "outline"}
                    onClick={() => setFilterStatus("completed")}
                    className={filterStatus === "completed" ? "bg-purple-600" : ""}
                >
                    Completed ({reminders.filter(r => r.completed).length})
                </Button>
            </div>

            {/* Reminders List */}
            <div className="space-y-3">
                {filteredReminders.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No reminders found</p>
                            <p className="text-gray-400 text-sm mt-2">
                                {filterStatus === "all" 
                                    ? "Create your first reminder to get started"
                                    : `No ${filterStatus} reminders`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredReminders.map(reminder => (
                        <Card 
                            key={reminder.id}
                            className={`transition-all hover:shadow-lg ${
                                reminder.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
                            } ${isOverdue(reminder.due_date) && !reminder.completed ? 'border-red-300 border-2' : ''}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        checked={reminder.completed}
                                        onCheckedChange={() => handleToggleComplete(reminder)}
                                        className="mt-1"
                                    />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className={`font-semibold text-gray-900 ${
                                                reminder.completed ? 'line-through text-gray-500' : ''
                                            }`}>
                                                {reminder.title}
                                            </h3>
                                            <Badge className={priorityColors[reminder.priority]}>
                                                {getPriorityIcon(reminder.priority)}
                                                <span className="ml-1">{reminder.priority}</span>
                                            </Badge>
                                            {isOverdue(reminder.due_date) && !reminder.completed && (
                                                <Badge variant="destructive">Overdue</Badge>
                                            )}
                                        </div>
                                        
                                        {reminder.description && (
                                            <p className={`text-sm mb-2 ${
                                                reminder.completed ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                {reminder.description}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            {reminder.due_date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(reminder.due_date), "MMM d, yyyy h:mm a")}
                                                </div>
                                            )}
                                            {reminder.assigned_to && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs">Assigned to:</span>
                                                    <span className="font-medium">{reminder.assigned_to}</span>
                                                </div>
                                            )}
                                            {reminder.recurrence_type && reminder.recurrence_type !== "none" && (
                                                <Badge variant="outline" className="text-xs">
                                                    Recurring: {reminder.recurrence_type}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingReminder(reminder);
                                            setShowCreateDialog(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <ReminderEditDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                reminder={editingReminder}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['reminders'] });
                    setShowCreateDialog(false);
                    setEditingReminder(null);
                }}
            />
        </div>
    );
}