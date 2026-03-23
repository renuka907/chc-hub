import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat, getCurrentUser } from "@/api/supabaseHelpers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Users, Bot, Mic, MicOff, Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import AgentChat from "../components/messaging/AgentChat";

function useNotificationPermission() {
    const [permission, setPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    );
    
    const requestPermission = async () => {
        if (typeof Notification === 'undefined') return;
        const result = await Notification.requestPermission();
        setPermission(result);
    };
    
    return { permission, requestPermission };
}

export default function Messaging() {
    const [message, setMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const queryClient = useQueryClient();

    const { permission, requestPermission } = useNotificationPermission();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => getCurrentUser(),
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['messages'],
        queryFn: () => entities.Message.list('-created_at', 100),
        refetchInterval: 5000,
    });

    // Supabase Realtime subscription for instant updates + browser notifications
    useEffect(() => {
        const channel = supabase
            .channel('team-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                queryClient.invalidateQueries({ queryKey: ['messages'] });
                
                // Send browser notification if tab is not focused
                const msg = payload.new;
                if (
                    document.hidden && 
                    typeof Notification !== 'undefined' && 
                    Notification.permission === 'granted' &&
                    msg?.sender_email !== user?.email
                ) {
                    const n = new Notification('CHC Hub — Team Chat', {
                        body: `${msg.sender_name || 'Someone'}: ${msg.content || ''}`,
                        icon: '/favicon.ico',
                        tag: 'team-chat-' + msg.id,
                    });
                    n.onclick = () => { window.focus(); n.close(); };
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient, user?.email]);

    const { data: allUsers = [] } = useQuery({
        queryKey: ['allUsers'],
        queryFn: () => entities.User.list(),
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (messageData) => {
            await entities.Message.create(messageData);
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
            content: message.trim(),
            sender_name: user.full_name || user.email,
            sender_email: user.email,
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Messaging</h1>
                    <p className="text-gray-600">Real-time communication with your team</p>
                </div>
                <div className="flex items-center gap-3">
                    {typeof Notification !== 'undefined' && permission !== 'granted' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={requestPermission}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                            <Bell className="w-4 h-4 mr-1" />
                            Enable Notifications
                        </Button>
                    )}
                    {permission === 'granted' && (
                        <Badge variant="outline" className="border-green-600 text-green-700">
                            <Bell className="w-3 h-3 mr-1" /> Notifications On
                        </Badge>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <Badge variant="outline" className="border-green-600 text-green-700">
                            {onlineUsers} Team Members
                        </Badge>
                    </div>
                </div>
            </div>



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
                    {typeof Notification !== 'undefined' && permission === 'default' && (
                        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-amber-800">
                                    🔔 Want to get notified when teammates send a message?
                                </span>
                                <Button size="sm" onClick={requestPermission} className="bg-amber-500 hover:bg-amber-600 text-white">
                                    Turn On Notifications
                                </Button>
                            </div>
                            <p className="text-xs text-amber-600 mt-2">
                                📱 <strong>iPhone tip:</strong> For notifications on your phone, tap <strong>Share → Add to Home Screen</strong> first, then open CHC Hub from your home screen.
                            </p>
                        </div>
                    )}
                    {typeof Notification !== 'undefined' && permission === 'denied' && (
                        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <span className="text-sm text-red-700">
                                🔕 Notifications are blocked. To enable: go to your browser settings → find chchub.com → allow notifications.
                            </span>
                            <p className="text-xs text-red-500 mt-1">
                                📱 <strong>iPhone:</strong> Add this site to your Home Screen (Share → Add to Home Screen) to get push notifications.
                            </p>
                        </div>
                    )}
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
                                        const messageTime = format(new Date(msg.created_at || msg.created_date), 'h:mm a');
                                        
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
                                                            {msg.content || msg.message}
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
                </div>
                );
                }