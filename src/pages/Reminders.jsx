import React, { useState, useEffect } from "react";
import { entities, getCurrentUser } from "@/api/supabaseHelpers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ReminderEditDialog from "../components/reminders/ReminderEditDialog";
import { Bell, Plus, Clock, CheckCircle2, AlertCircle, Calendar, Trash2, Search, MoreVertical, Eye, EyeOff, Pencil, AlarmClock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const priorityDot = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-blue-400" };

export default function Reminders() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [filter, setFilter] = useState("active"); // active, completed, all
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [deleteTarget, setDeleteTarget] = useState(null); // null | id | "bulk"
    const queryClient = useQueryClient();

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => getCurrentUser(),
    });

    const { data: reminders = [], isLoading } = useQuery({
        queryKey: ['reminders', currentUser?.email],
        queryFn: async () => {
            const user = await getCurrentUser();
            if (!user?.email) return [];
            const all = await entities.Reminder.list('-due_date', 500);
            return all.filter(r => r.created_by === user.email || r.assigned_to === user.email || (!r.created_by && !r.assigned_to));
        },
        enabled: !!currentUser,
    });

    const api = async (method, body) => {
        const resp = await fetch('/api/reminders', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!resp.ok) throw new Error('Failed');
        return resp.json();
    };

    const invalidateAll = () => { queryClient.invalidateQueries({ queryKey: ['reminders'] }); queryClient.invalidateQueries({ queryKey: ['reminderCount'] }); };

    const completeMut = useMutation({
        mutationFn: ({ id, completed }) => api('PATCH', { id, completed }),
        onSuccess: () => invalidateAll(),
    });

    const deleteMut = useMutation({
        mutationFn: (id) => api('DELETE', { id }),
        onSuccess: () => { invalidateAll(); setDeleteTarget(null); },
    });

    const bulkDeleteMut = useMutation({
        mutationFn: async () => { for (const id of selectedIds) await api('DELETE', { id }); },
        onSuccess: () => { invalidateAll(); setSelectedIds(new Set()); setDeleteTarget(null); },
    });

    const bulkCompleteMut = useMutation({
        mutationFn: async () => { for (const id of selectedIds) { const r = reminders.find(x => x.id === id); await api('PATCH', { id, completed: !r?.completed }); } },
        onSuccess: () => { invalidateAll(); setSelectedIds(new Set()); },
    });

    const snooze = async (reminder, hours) => {
        if (hours === null) {
            await api('PATCH', { id: reminder.id, show_after: null });
            toast.info('Reminder un-snoozed');
        } else {
            const showAfter = new Date(Date.now() + hours * 3600000).toISOString();
            await api('PATCH', { id: reminder.id, show_after: showAfter });
            toast.success(`Snoozed for ${hours}h`);
        }
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
    };

    const toggleSelect = (id) => setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const isOverdue = (d) => d && new Date(d) < new Date();
    const isSnoozed = (r) => r.show_after && new Date(r.show_after) > new Date();

    // Filter & search
    const now = new Date();
    const filtered = reminders.filter(r => {
        if (filter === "active" && r.completed) return false;
        if (filter === "completed" && !r.completed) return false;
        if (searchQuery && !r.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !r.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Group
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate()+7);

    const groups = { overdue: [], today: [], tomorrow: [], thisWeek: [], later: [], noDue: [], snoozed: [], completed: [] };
    filtered.forEach(r => {
        if (r.completed) { groups.completed.push(r); return; }
        if (isSnoozed(r)) { groups.snoozed.push(r); return; }
        if (!r.due_date) { groups.noDue.push(r); return; }
        const d = new Date(r.due_date); d.setHours(0,0,0,0);
        if (d < today) groups.overdue.push(r);
        else if (d.getTime() === today.getTime()) groups.today.push(r);
        else if (d.getTime() === tomorrow.getTime()) groups.tomorrow.push(r);
        else if (d < weekEnd) groups.thisWeek.push(r);
        else groups.later.push(r);
    });

    const activeCount = reminders.filter(r => !r.completed).length;
    const overdueCount = reminders.filter(r => !r.completed && isOverdue(r.due_date)).length;
    const completedCount = reminders.filter(r => r.completed).length;

    const ReminderRow = ({ r }) => (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${r.completed ? 'opacity-50' : 'hover:bg-gray-50'} ${!r.completed && isOverdue(r.due_date) ? 'bg-red-50' : ''}`}>
            {/* Complete circle */}
            <button onClick={() => completeMut.mutate({ id: r.id, completed: !r.completed })} className="flex-shrink-0">
                {r.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors" />
                )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[r.priority] || 'bg-gray-300'}`} />
                    <span className={`font-medium truncate ${r.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {r.title}
                    </span>
                    {!r.completed && isOverdue(r.due_date) && <Badge variant="destructive" className="text-xs px-1.5 py-0">Overdue</Badge>}
                    {isSnoozed(r) && <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-600 border-amber-300"><EyeOff className="w-3 h-3 mr-1" />Snoozed</Badge>}
                    {r.recurrence_type && r.recurrence_type !== "none" && <Badge variant="outline" className="text-xs px-1.5 py-0">🔁 {r.recurrence_type}</Badge>}
                </div>
                {r.description && <p className="text-xs text-gray-500 truncate mt-0.5 ml-4">{r.description}</p>}
            </div>

            {/* Due date */}
            <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                {r.due_date ? format(new Date(r.due_date), "MMM d, h:mm a") : "No date"}
            </div>

            {/* Actions menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-md hover:bg-gray-200 flex-shrink-0">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => toggleSelect(r.id)}>
                        <Checkbox checked={selectedIds.has(r.id)} className="w-4 h-4 mr-2 pointer-events-none" /> {selectedIds.has(r.id) ? "Deselect" : "Select"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => completeMut.mutate({ id: r.id, completed: !r.completed })}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> {r.completed ? "Reopen" : "Complete"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setEditingReminder(r); setShowCreateDialog(true); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isSnoozed(r) ? (
                        <DropdownMenuItem onClick={() => snooze(r, null)}>
                            <Eye className="w-4 h-4 mr-2" /> Un-snooze
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem onClick={() => snooze(r, 1)}><AlarmClock className="w-4 h-4 mr-2" /> Snooze 1 hour</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => snooze(r, 4)}><AlarmClock className="w-4 h-4 mr-2" /> Snooze 4 hours</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => snooze(r, 24)}><AlarmClock className="w-4 h-4 mr-2" /> Snooze 1 day</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => snooze(r, 48)}><AlarmClock className="w-4 h-4 mr-2" /> Snooze 2 days</DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(r.id)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    const Section = ({ label, color, items, icon: Icon }) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-2">
                    {Icon && <Icon className={`w-4 h-4 ${color}`} />}
                    <h3 className={`text-sm font-semibold ${color}`}>{label}</h3>
                    <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border divide-y divide-gray-100">
                    {items.map(r => <ReminderRow key={r.id} r={r} />)}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" /></div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 shadow-lg text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="w-7 h-7" />
                        <div>
                            <h1 className="text-2xl font-bold">Reminders</h1>
                            <p className="text-purple-200 text-sm">{activeCount} active · {overdueCount > 0 ? `${overdueCount} overdue · ` : ''}{completedCount} done</p>
                        </div>
                    </div>
                    <Button onClick={() => { setEditingReminder(null); setShowCreateDialog(true); }} className="bg-white text-purple-700 hover:bg-purple-50 font-semibold">
                        <Plus className="w-4 h-4 mr-1.5" /> New
                    </Button>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2 items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {[
                        { key: "active", label: "Active" },
                        { key: "completed", label: "Done" },
                        { key: "all", label: "All" },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f.key ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
                    <span className="text-sm font-medium text-purple-700">{selectedIds.size} selected</span>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => bulkCompleteMut.mutate()} className="h-7 text-xs">✓ Complete</Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteTarget("bulk")} className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50">Delete</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-7 text-xs">Clear</Button>
                </div>
            )}

            {/* Reminders */}
            {filtered.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">{filter === "all" ? "No reminders yet" : `No ${filter} reminders`}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Section label="Overdue" color="text-red-600" items={groups.overdue} icon={AlertCircle} />
                    <Section label="Today" color="text-blue-600" items={groups.today} icon={Calendar} />
                    <Section label="Tomorrow" color="text-purple-600" items={groups.tomorrow} icon={Clock} />
                    <Section label="This Week" color="text-green-600" items={groups.thisWeek} icon={Calendar} />
                    <Section label="Later" color="text-gray-600" items={groups.later} icon={Calendar} />
                    <Section label="No Due Date" color="text-gray-400" items={groups.noDue} icon={Bell} />
                    <Section label="Snoozed" color="text-amber-500" items={groups.snoozed} icon={EyeOff} />
                    <Section label="Completed" color="text-green-500" items={groups.completed} icon={CheckCircle2} />
                </>
            )}

            <ReminderEditDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} reminder={editingReminder} onSaved={() => { queryClient.invalidateQueries({ queryKey: ['reminders'] }); setShowCreateDialog(false); setEditingReminder(null); }} />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleteTarget === "bulk" ? `${selectedIds.size} reminders` : "reminder"}?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { deleteTarget === "bulk" ? bulkDeleteMut.mutate() : deleteMut.mutate(deleteTarget); }}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
