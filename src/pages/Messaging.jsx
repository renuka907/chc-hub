import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Users, Bot, CheckCircle2, Circle, Trash2, Mic, MicOff, Edit } from "lucide-react";
import { format } from "date-fns";
import AgentChat from "../components/messaging/AgentChat";
import ReminderEditDialog from "../components/reminders/ReminderEditDialog";

export default function Messaging() {
    const [message, setMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['messages'],
        queryFn: () => base44.entities.Message.list('-created_date', 100),
        refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['allUsers'],
        queryFn: () => base44.entities.User.list(),
    });

    const { data: reminders = [] } = useQuery({
        queryKey: ['reminders'],
        queryFn: () => base44.entities.Reminder.list('-created_date', 50),
        refetchInterval: 5000,
    });

    const toggleReminderMutation = useMutation({
        mutationFn: async ({ id, completed }) => {
            await base44.entities.Reminder.update(id, { completed });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });

    const deleteReminderMutation = useMutation({
        mutationFn: async (id) => {
            await base44.entities.Reminder.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (messageData) => {
            await base44.entities.Message.create(messageData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            setMessage("");
        },
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || !user) return;

        sendMessageMutation.mutate({
            message: message.trim(),
            sender_name: user.full_name || user.email,
            sender_email: user.email,
            is_system: false
        });
    };

    const toggleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser');
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setMessage(transcript);
            };

            recognition.onerror = () => {
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
            setIsRecording(true);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const reversedMessages = [...messages].reverse();

    const onlineUsers = allUsers.length;

    const activeReminders = reminders.filter(r => !r.completed);
    const completedReminders = reminders.filter(r => r.completed);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Messaging</h1>
                    <p className="text-gray-600">Real-time communication with your team</p>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <Badge variant="outline" className="border-green-600 text-green-700">
                        {onlineUsers} Team Members
                    </Badge>
                </div>
            </div>

            {/* Reminders Box */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        Reminders
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activeReminders.length === 0 && completedReminders.length === 0 ? (
                        <p className="text-gray-500 text-sm">No reminders yet. Ask Peach to create one!</p>
                    ) : (
                        <div className="space-y-4">
                            {activeReminders.map((reminder) => (
                                <div key={reminder.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:bg-gray-50">
                                    <Checkbox
                                        checked={false}
                                        onCheckedChange={() => toggleReminderMutation.mutate({ id: reminder.id, completed: true })}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{reminder.title}</div>
                                        {reminder.description && (
                                            <div className="text-sm text-gray-600 mt-1">{reminder.description}</div>
                                        )}
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {reminder.due_date && (
                                                <Badge variant="outline" className="text-xs">
                                                    {format(new Date(reminder.due_date), 'MMM d, h:mm a')}
                                                </Badge>
                                            )}
                                            {reminder.assigned_to && (
                                                <Badge variant="outline" className="text-xs">
                                                    Assigned: {reminder.assigned_to}
                                                </Badge>
                                            )}
                                            {reminder.recurrence_type && reminder.recurrence_type !== 'none' && (
                                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                                    {`${reminder.recurrence_type}${reminder.recurrence_interval && reminder.recurrence_interval > 1 ? ` x${reminder.recurrence_interval}` : ''}`}
                                                </Badge>
                                            )}
                                            {reminder.priority && reminder.priority !== 'medium' && (
                                                <Badge className={reminder.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                                                    {reminder.priority}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingReminder(reminder)}
                                    >
                                        <Edit className="w-4 h-4 text-gray-400" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteReminderMutation.mutate(reminder.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>
                            ))}
                            {completedReminders.length > 0 && (
                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-500 mb-3">Completed</p>
                                    {completedReminders.map((reminder) => (
                                        <div key={reminder.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg opacity-60">
                                            <Checkbox
                                                checked={true}
                                                onCheckedChange={() => toggleReminderMutation.mutate({ id: reminder.id, completed: false })}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-600 line-through">{reminder.title}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteReminderMutation.mutate(reminder.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-gray-400" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Chat Container with Tabs */}
            <Tabs defaultValue="assistant" className="space-y-4">
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 gap-4">
                    <TabsTrigger value="assistant" className="text-base">
                        <Bot className="w-4 h-4 mr-2" />
                        Peach
                    </TabsTrigger>
                    <TabsTrigger value="team" className="text-base">
                        <Users className="w-4 h-4 mr-2" />
                        Team Chat
                    </TabsTrigger>
                </TabsList>

                {/* Team Chat Tab */}
                <TabsContent value="team">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg">Team Chat</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 flex flex-col">
                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {reversedMessages.map((msg) => {
                                        const isOwnMessage = user && msg.sender_email === user.email;
                                        const messageTime = format(new Date(msg.created_date), 'h:mm a');
                                        
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-gray-700">
                                                            {isOwnMessage ? 'You' : msg.sender_name}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{messageTime}</span>
                                                    </div>
                                                    <div
                                                        className={`rounded-2xl px-4 py-2 ${
                                                            isOwnMessage
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-900'
                                                        }`}
                                                    >
                                                        <p className="text-sm whitespace-pre-wrap break-words">
                                                            {msg.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="border-t p-4">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <Input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1"
                                        disabled={sendMessageMutation.isPending}
                                    />
                                    <Button
                                        type="button"
                                        onClick={toggleVoiceInput}
                                        variant="outline"
                                        className={isRecording ? "bg-red-50 border-red-300" : ""}
                                    >
                                        {isRecording ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!message.trim() || sendMessageMutation.isPending}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Clinic Assistant Tab */}
                <TabsContent value="assistant">
                    <Card>
                        <CardContent className="p-0">
                            <AgentChat agentName="clinic_assistant" />
                        </CardContent>
                    </Card>
                </TabsContent>
                </Tabs>

                <ReminderEditDialog
                open={!!editingReminder}
                onOpenChange={(open) => {
                if (!open) setEditingReminder(null);
                }}
                reminder={editingReminder}
                users={allUsers}
                onSaved={() => {
                setEditingReminder(null);
                queryClient.invalidateQueries({ queryKey: ['reminders'] });
                }}
                />
                </div>
                );
}