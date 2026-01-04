import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AgentChat({ agentName }) {
    const [message, setMessage] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    // Load or create conversation on mount
    useEffect(() => {
        const loadOrCreateConversation = async () => {
            try {
                // Try to load saved conversation ID from localStorage
                const savedConvId = localStorage.getItem(`agent_conv_${agentName}`);
                
                if (savedConvId) {
                    // Load existing conversation
                    try {
                        const conv = await base44.agents.getConversation(savedConvId);
                        setConversationId(conv.id);
                        setMessages(conv.messages || []);
                        return;
                    } catch (error) {
                        console.log("Saved conversation not found, creating new one");
                    }
                }
                
                // Create new conversation if no saved one exists
                const conv = await base44.agents.createConversation({
                    agent_name: agentName,
                    metadata: {
                        name: "Messaging Chat",
                        description: "Quick assistant chat from messaging"
                    }
                });
                setConversationId(conv.id);
                setMessages(conv.messages || []);
                
                // Save conversation ID to localStorage
                localStorage.setItem(`agent_conv_${agentName}`, conv.id);
            } catch (error) {
                console.error("Failed to load/create conversation:", error);
            }
        };
        loadOrCreateConversation();
    }, [agentName]);

    // Subscribe to conversation updates
    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
            setMessages(data.messages || []);
            // Check if agent is still processing
            const lastMessage = data.messages?.[data.messages.length - 1];
            if (lastMessage?.role === 'assistant') {
                setIsProcessing(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || !conversationId || isProcessing) return;

        const userMessage = message.trim();
        setMessage("");
        setIsProcessing(true);

        try {
            const conv = await base44.agents.getConversation(conversationId);
            await base44.agents.addMessage(conv, {
                role: "user",
                content: userMessage
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-[550px] flex flex-col">
            {/* Agent Header */}
            <div className="border-b p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Clinic Assistant</h3>
                        <p className="text-xs text-gray-600">
                            Ask about FAQs, medical info, inventory, or set reminders
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        const messageTime = msg.created_date 
                            ? format(new Date(msg.created_date), 'h:mm a')
                            : '';
                        
                        return (
                            <div
                                key={index}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {!isUser && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <Bot className="w-4 h-4 text-purple-600" />
                                            <span className="text-xs font-medium text-gray-700">
                                                Clinic Assistant
                                            </span>
                                            {messageTime && <span className="text-xs text-gray-500">{messageTime}</span>}
                                        </div>
                                    )}
                                    {isUser && messageTime && (
                                        <span className="text-xs text-gray-500 mb-1">{messageTime}</span>
                                    )}
                                    <div
                                        className={`rounded-2xl px-4 py-2 ${
                                            isUser
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                <span className="text-sm text-gray-600">Assistant is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-white">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask about inventory, procedures, or request reminders..."
                        className="flex-1"
                        disabled={isProcessing || !conversationId}
                    />
                    <Button
                        type="submit"
                        disabled={!message.trim() || isProcessing || !conversationId}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}