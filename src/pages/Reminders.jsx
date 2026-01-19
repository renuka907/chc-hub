import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ReminderEditDialog from "../components/reminders/ReminderEditDialog";
import NotificationPreferencesDialog from "../components/reminders/NotificationPreferencesDialog";
import { Bell, Plus, Clock, CheckCircle2, AlertCircle, Calendar, Trash2, Search, X, Settings } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Reminders() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("due_date");
    const [selectedReminders, setSelectedReminders] = useState(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [dueReminders, setDueReminders] = useState([]);
    const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
    const queryClient = useQueryClient();

    const { data: reminders = [], isLoading } = useQuery({
        queryKey: ['reminders'],
        queryFn: () => base44.entities.Reminder.list('-due_date', 100),
    });

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: teamMembers = [] } = useQuery({
        queryKey: ['teamMembers'],
        queryFn: () => base44.entities.User.list(),
    });

    const toggleCompleteMutation = useMutation({
        mutationFn: ({ id, completed }) => 
            base44.entities.Reminder.update(id, { completed }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        }
    });

    const deleteReminderMutation = useMutation({
        mutationFn: (id) => base44.entities.Reminder.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            setItemToDelete(null);
            setShowDeleteDialog(false);
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async () => {
            for (const id of selectedReminders) {
                await base44.entities.Reminder.delete(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            setSelectedReminders(new Set());
            setShowDeleteDialog(false);
        }
    });

    const bulkCompleteMutation = useMutation({
        mutationFn: async () => {
            for (const id of selectedReminders) {
                const reminder = reminders.find(r => r.id === id);
                await base44.entities.Reminder.update(id, { completed: !reminder?.completed });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            setSelectedReminders(new Set());
        }
    });

    const handleToggleComplete = (reminder) => {
        toggleCompleteMutation.mutate({
            id: reminder.id,
            completed: !reminder.completed
        });
    };

    const toggleReminderSelection = (id) => {
        const newSelection = new Set(selectedReminders);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedReminders(newSelection);
    };

    const filteredReminders = reminders
        .filter(reminder => {
            const matchesStatus = filterStatus === "all" || 
                (filterStatus === "completed" ? reminder.completed : !reminder.completed);
            const matchesSearch = reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reminder.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === "due_date") {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            }
            if (sortBy === "priority") {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
            }
            if (sortBy === "created") {
                return new Date(b.created_date) - new Date(a.created_date);
            }
            return 0;
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

    // Check for due reminders and show notifications
    useEffect(() => {
        if (reminders.length === 0) return;

        const now = new Date();
        const soon = new Date(now.getTime() + 15 * 60000); // 15 minutes from now

        const upcoming = reminders.filter(reminder => {
            if (reminder.completed) return false;
            if (!reminder.due_date) return false;
            const dueTime = new Date(reminder.due_date);
            return dueTime <= soon && dueTime > now;
        });

        const overdue = reminders.filter(reminder => {
            if (reminder.completed) return false;
            return isOverdue(reminder.due_date);
        });

        setDueReminders([...overdue, ...upcoming]);

        // Show toast notifications for newly due reminders
        overdue.forEach(reminder => {
            const key = `overdue-${reminder.id}`;
            if (!sessionStorage.getItem(key)) {
                toast.error(`⏰ Overdue: ${reminder.title}`, { duration: 5000 });
                sessionStorage.setItem(key, 'shown');
            }
        });

        upcoming.forEach(reminder => {
            const key = `upcoming-${reminder.id}`;
            if (!sessionStorage.getItem(key)) {
                toast.info(`📢 Coming up soon: ${reminder.title}`, { duration: 4000 });
                sessionStorage.setItem(key, 'shown');
            }
        });
    }, [reminders]);

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
                    <div className="flex gap-2">
                        <Button 
                            variant="outline"
                            onClick={() => setShowNotificationPrefs(true)}
                            className="border-purple-300"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Notification Settings
                        </Button>
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
            </div>

            {/* Search and Filters */}
            <Card className="bg-white">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2 flex-col md:flex-row">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search reminders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="due_date">Due Date</SelectItem>
                                <SelectItem value="priority">Priority</SelectItem>
                                <SelectItem value="created">Recently Added</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={filterStatus === "all" ? "default" : "outline"}
                            onClick={() => setFilterStatus("all")}
                            className={filterStatus === "all" ? "bg-purple-600" : ""}
                            size="sm"
                        >
                            All ({reminders.length})
                        </Button>
                        <Button
                            variant={filterStatus === "active" ? "default" : "outline"}
                            onClick={() => setFilterStatus("active")}
                            className={filterStatus === "active" ? "bg-purple-600" : ""}
                            size="sm"
                        >
                            Active ({reminders.filter(r => !r.completed).length})
                        </Button>
                        <Button
                            variant={filterStatus === "completed" ? "default" : "outline"}
                            onClick={() => setFilterStatus("completed")}
                            className={filterStatus === "completed" ? "bg-purple-600" : ""}
                            size="sm"
                        >
                            Completed ({reminders.filter(r => r.completed).length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Due Reminders Alert */}
            {dueReminders.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-red-900 mb-2">You have {dueReminders.length} due reminder{dueReminders.length !== 1 ? "s" : ""}</h3>
                                    <div className="space-y-1">
                                        {dueReminders.slice(0, 3).map(reminder => (
                                            <div key={reminder.id} className="text-sm text-red-800">
                                                • <strong>{reminder.title}</strong>
                                                {reminder.due_date && (
                                                    <span className="ml-2 text-red-700">
                                                        {isOverdue(reminder.due_date) ? "Overdue" : "Due soon"}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {dueReminders.length > 3 && (
                                            <div className="text-sm text-red-800">
                                                +{dueReminders.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setFilterStatus("active");
                                    setSearchQuery("");
                                }}
                                className="text-red-700 border-red-300 hover:bg-red-100"
                            >
                                View All
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk Actions Bar */}
            {selectedReminders.size > 0 && (
                <Card className="border-purple-300 bg-purple-50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            {selectedReminders.size} selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => bulkCompleteMutation.mutate()}
                            >
                                Mark as Complete
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                    setShowDeleteDialog(true);
                                    setItemToDelete("bulk");
                                }}
                            >
                                Delete Selected
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedReminders(new Set())}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                        checked={selectedReminders.has(reminder.id)}
                                        onCheckedChange={() => toggleReminderSelection(reminder.id)}
                                        className="mt-1"
                                    />
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
                                    
                                    <div className="flex gap-2">
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setItemToDelete(reminder.id);
                                                setShowDeleteDialog(true);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
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
                users={teamMembers}
                onSaved={() => {
                    queryClient.invalidateQueries({ queryKey: ['reminders'] });
                    setShowCreateDialog(false);
                    setEditingReminder(null);
                }}
            />

            <NotificationPreferencesDialog
                open={showNotificationPrefs}
                onOpenChange={setShowNotificationPrefs}
            />

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reminder{itemToDelete === "bulk" ? "s" : ""}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {itemToDelete === "bulk"
                                ? `Are you sure you want to delete ${selectedReminders.size} reminder${selectedReminders.size !== 1 ? "s" : ""}? This action cannot be undone.`
                                : "Are you sure you want to delete this reminder? This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (itemToDelete === "bulk") {
                                    bulkDeleteMutation.mutate();
                                } else {
                                    deleteReminderMutation.mutate(itemToDelete);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}