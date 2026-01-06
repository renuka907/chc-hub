import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2, Mic, MicOff, Printer, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function AgentChat({ agentName }) {
    const [message, setMessage] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const [noResponse, setNoResponse] = useState(false);
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
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setNoResponse(false);
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

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || !conversationId || isProcessing) return;

        const userMessage = message.trim();
        setMessage("");
        setIsProcessing(true);
        setNoResponse(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsProcessing(false);
            setNoResponse(true);
        }, 25000);

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

    const handleSaveChat = () => {
        if (!messages.length) return;

        const chatHistory = messages.map(msg => {
            const timestamp = msg.created_date 
                ? format(new Date(msg.created_date), 'MMM d, yyyy h:mm a')
                : '';
            const role = msg.role === 'user' ? 'You' : 'Peach';
            return `[${timestamp}] ${role}:\n${msg.content}\n`;
        }).join('\n---\n\n');

        const fullText = `Peach Chat History\nContemporary Health Center\nSaved: ${new Date().toLocaleString()}\n\n${'='.repeat(60)}\n\n${chatHistory}`;

        const blob = new Blob([fullText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peach-chat-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    };

    const handleNewChat = async () => {
        try {
            setIsProcessing(false);
            localStorage.removeItem(`agent_conv_${agentName}`);
            const conv = await base44.agents.createConversation({
                agent_name: agentName,
                metadata: {
                    name: "Messaging Chat",
                    description: "Quick assistant chat from messaging"
                }
            });
            setConversationId(conv.id);
            setMessages(conv.messages || []);
            localStorage.setItem(`agent_conv_${agentName}`, conv.id);
        } catch (error) {
            console.error("Failed to start new chat:", error);
        }
    };

    const handlePrint = (content) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Peach Response</title>
                <style>
                    body {
                        font-family: 'Times New Roman', serif;
                        padding: 40px;
                        max-width: 8.5in;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #7c3aed;
                        border-bottom: 2px solid #7c3aed;
                        padding-bottom: 10px;
                    }
                    .content {
                        line-height: 1.6;
                        white-space: pre-wrap;
                        font-size: 12pt;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ccc;
                        text-align: center;
                        color: #666;
                        font-size: 10pt;
                    }
                    @media print {
                        body { padding: 0.5in; }
                    }
                </style>
            </head>
            <body>
                <h1>Peach Assistant Response</h1>
                <p style="color: #666; font-size: 10pt;">Generated: ${new Date().toLocaleString()}</p>
                <div class="content">${content}</div>
                <div class="footer">
                    Contemporary Health Center | CHC Hub
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
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

    return (
        <div className="h-[550px] flex flex-col">
            {/* Agent Header */}
            <div className="border-b p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Peach</h3>
                            <p className="text-xs text-gray-600">
                                Ask about FAQs, medical info, inventory, or set reminders
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNewChat}
                            className="gap-2"
                            disabled={isProcessing}
                        >
                            <RefreshCw className="w-4 h-4" />
                            New Chat
                        </Button>
                        {messages.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveChat}
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Save Chat
                            </Button>
                        )}
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
                                                Peach
                                            </span>
                                            {messageTime && <span className="text-xs text-gray-500">{messageTime}</span>}
                                        </div>
                                    )}
                                    {isUser && messageTime && (
                                        <span className="text-xs text-gray-500 mb-1">{messageTime}</span>
                                    )}
                                    <div className="flex items-start gap-2">
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
                                        {!isUser && msg.content && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePrint(msg.content)}
                                                className="h-8 w-8 opacity-0 hover:opacity-100 transition-opacity"
                                                title="Print this response"
                                            >
                                                <Printer className="w-4 h-4 text-gray-600" />
                                            </Button>
                                        )}
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
                    {noResponse && (
                        <div className="flex justify-start">
                            <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-2xl px-4 py-2 text-sm">
                                No reply yet. Try New Chat and send again.
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
                        type="button"
                        onClick={toggleVoiceInput}
                        variant="outline"
                        className={isRecording ? "bg-red-50 border-red-300" : ""}
                        disabled={isProcessing || !conversationId}
                    >
                        {isRecording ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4" />}
                    </Button>
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