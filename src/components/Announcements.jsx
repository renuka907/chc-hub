import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseHelpers";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, CheckCircle2, Users, ChevronDown, ChevronUp, Plus, X, Send, History } from "lucide-react";

function AckList({ announcementId }) {
    const { data: acks = [], isLoading } = useQuery({
        queryKey: ['acks', announcementId],
        queryFn: () => entities.AnnouncementAck.filter({ announcement_id: announcementId }, '-acknowledged_at'),
    });

    if (isLoading) return <p className="text-xs text-gray-400 mt-2">Loading...</p>;
    if (acks.length === 0) return <p className="text-xs text-gray-400 mt-2">No acknowledgments yet</p>;

    return (
        <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {acks.length} acknowledged
            </p>
            <div className="flex flex-wrap gap-1">
                {acks.map(a => (
                    <Badge key={a.id} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        ✅ {a.user_name || a.user_email}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

function CreateAnnouncementForm({ onClose }) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('normal');
    const queryClient = useQueryClient();

    const create = useMutation({
        mutationFn: (data) => entities.Announcement.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            onClose();
        }
    });

    return (
        <Card className="border-2 border-[#B8D4E8] shadow-lg mb-4">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Send className="w-4 h-4 text-[#6B9FCC]" /> New Announcement
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6B9FCC] focus:border-[#6B9FCC] outline-none"
                />
                <textarea
                    placeholder="Message..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6B9FCC] focus:border-[#6B9FCC] outline-none resize-none"
                />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Priority:</span>
                    {['normal', 'important', 'urgent'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPriority(p)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                priority === p
                                    ? p === 'urgent' ? 'bg-red-500 text-white'
                                    : p === 'important' ? 'bg-amber-500 text-white'
                                    : 'bg-[#6B9FCC] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end">
                    <Button
                        onClick={() => create.mutate({ title, message, priority, is_active: true })}
                        disabled={!title.trim() || !message.trim() || create.isPending}
                        className="bg-[#6B9FCC] hover:bg-[#5889B5] text-white"
                        size="sm"
                    >
                        {create.isPending ? 'Posting...' : 'Post Announcement'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Announcements() {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [expandedAck, setExpandedAck] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => entities.Announcement.filter({ is_active: true }, '-created_at', 5),
    });

    const { data: archivedAnnouncements = [], isLoading: isLoadingArchived } = useQuery({
        queryKey: ['announcements-archived'],
        queryFn: () => entities.Announcement.filter({ is_active: false }, '-created_at', 20),
        enabled: showArchived,
    });

    const { data: myAcks = [] } = useQuery({
        queryKey: ['myAcks', currentUser?.email],
        queryFn: () => entities.AnnouncementAck.filter({ user_email: currentUser?.email }),
        enabled: !!currentUser?.email,
    });

    const ack = useMutation({
        mutationFn: (announcementId) => entities.AnnouncementAck.create({
            announcement_id: announcementId,
            user_email: currentUser?.email,
            user_name: currentUser?.full_name || currentUser?.email,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myAcks'] });
            queryClient.invalidateQueries({ queryKey: ['acks'] });
        }
    });

    const deactivate = useMutation({
        mutationFn: (id) => entities.Announcement.update(id, { is_active: false }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
    });

    const myAckIds = new Set(myAcks.map(a => a.announcement_id));
    const unackCount = announcements.filter(a => !myAckIds.has(a.id)).length;

    // Auto-archive announcements older than 30 days (admin/manager only)
    useEffect(() => {
        if (!isAdminOrManager || announcements.length === 0) return;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        announcements.forEach(ann => {
            if (new Date(ann.created_at) < thirtyDaysAgo) {
                entities.Announcement.update(ann.id, { is_active: false }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['announcements'] });
                });
            }
        });
    }, [announcements, isAdminOrManager]);

    if (isLoading) return null;
    if (announcements.length === 0 && !isAdminOrManager) return null;

    const priorityStyles = {
        urgent: 'border-red-300 bg-red-50',
        important: 'border-amber-300 bg-amber-50',
        normal: 'border-[#B8D4E8] bg-white',
    };
    const priorityBadge = {
        urgent: 'bg-red-500 text-white',
        important: 'bg-amber-500 text-white',
        normal: 'bg-[#E8F0FA] text-[#3A6B8C]',
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#E8F0FA] rounded-lg flex items-center justify-center">
                        <Megaphone className="w-4 h-4 text-[#6B9FCC]" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
                    {unackCount > 0 && (
                        <Badge className="bg-[#6B9FCC] text-white text-xs">{unackCount}</Badge>
                    )}
                </div>
                {isAdminOrManager && (
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        size="sm"
                        className="bg-[#6B9FCC] hover:bg-[#5889B5] text-white"
                    >
                        <Plus className="w-4 h-4 mr-1" /> New
                    </Button>
                )}
            </div>

            {showForm && <CreateAnnouncementForm onClose={() => setShowForm(false)} />}

            {announcements.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No announcements right now ✨</p>
            )}

            {announcements.map(ann => {
                const acked = myAckIds.has(ann.id);
                const priority = ann.priority || 'normal';
                return (
                    <Card key={ann.id} className={`border ${priorityStyles[priority]} shadow-sm hover:shadow-md transition-shadow`} data-active="true">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-gray-900 text-sm">{ann.title}</h3>
                                        <Badge className={`text-[10px] ${priorityBadge[priority]}`}>
                                            {priority === 'urgent' ? '🚨 Urgent' : priority === 'important' ? '⚠️ Important' : '📢 Info'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{ann.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {acked ? (
                                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledged
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => ack.mutate(ann.id)}
                                            disabled={ack.isPending}
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                        >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {ack.isPending ? '...' : 'Acknowledge'}
                                        </Button>
                                    )}
                                    {isAdminOrManager && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setExpandedAck(expandedAck === ann.id ? null : ann.id)}
                                                className="text-xs text-[#6B9FCC] hover:text-[#3A6B8C] flex items-center gap-1"
                                            >
                                                <Users className="w-3 h-3" />
                                                {expandedAck === ann.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Remove this announcement?')) deactivate.mutate(ann.id); }}
                                                className="text-xs text-red-400 hover:text-red-600 ml-2"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isAdminOrManager && expandedAck === ann.id && <AckList announcementId={ann.id} />}
                        </CardContent>
                    </Card>
                );
            })}

            {/* View Past Announcements */}
            <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-xs text-[#6B9FCC] hover:text-[#3A6B8C] transition-colors mx-auto mt-2"
            >
                <History className="w-3.5 h-3.5" />
                {showArchived ? 'Hide past announcements' : 'View past announcements'}
                {showArchived ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showArchived && (
                <div className="space-y-2 mt-2">
                    {isLoadingArchived && <p className="text-xs text-gray-400 text-center py-2">Loading...</p>}
                    {!isLoadingArchived && archivedAnnouncements.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">No past announcements</p>
                    )}
                    {archivedAnnouncements.map(ann => {
                        const priority = ann.priority || 'normal';
                        return (
                            <Card key={ann.id} className="border border-gray-200 bg-gray-50 shadow-sm opacity-80">
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-gray-600 text-sm">{ann.title}</h3>
                                                <Badge className={`text-[10px] ${priorityBadge[priority]}`}>
                                                    {priority === 'urgent' ? '🚨 Urgent' : priority === 'important' ? '⚠️ Important' : '📢 Info'}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-300">Archived</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{ann.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {isAdminOrManager && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => setExpandedAck(expandedAck === ann.id ? null : ann.id)}
                                                    className="text-xs text-[#6B9FCC] hover:text-[#3A6B8C] flex items-center gap-1"
                                                >
                                                    <Users className="w-3 h-3" />
                                                    {expandedAck === ann.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {isAdminOrManager && expandedAck === ann.id && <AckList announcementId={ann.id} />}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
