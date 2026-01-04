import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users } from "lucide-react";
import { format } from "date-fns";

export default function Messaging() {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);
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
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <Badge variant="outline" className="border-green-600 text-green-700">
                        {onlineUsers} Team Members
                    </Badge>
                </div>
            </div>

            {/* Chat Container */}
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
        </div>
    );
}