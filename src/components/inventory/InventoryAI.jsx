import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sparkles, Send, Loader2, Package, AlertTriangle, TrendingUp } from "lucide-react";

export default function InventoryAI({ inventoryItems, locations }) {
    const [question, setQuestion] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleAsk = async () => {
        if (!question.trim()) return;

        const userMessage = { role: "user", content: question };
        setMessages(prev => [...prev, userMessage]);
        setQuestion("");
        setIsLoading(true);

        try {
            // Filter items by selected location
            const filteredItems = selectedLocation === "all" 
                ? inventoryItems 
                : inventoryItems.filter(item => item.location_id === selectedLocation);

            // Prepare inventory context
            const inventoryContext = filteredItems.map(item => ({
                name: item.item_name,
                type: item.item_type,
                quantity: item.quantity,
                unit: item.unit,
                low_stock_threshold: item.low_stock_threshold,
                reorder_quantity: item.reorder_quantity,
                cost_per_unit: item.cost_per_unit,
                location: locations.find(l => l.id === item.location_id)?.name || "N/A",
                storage_location: item.storage_location,
                supplier: item.supplier,
                expiry_date: item.expiry_date,
                is_low_stock: item.quantity <= item.low_stock_threshold
            }));

            const locationName = selectedLocation === "all" ? "all locations" : (locations.find(l => l.id === selectedLocation)?.name || "selected location");

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an inventory management AI assistant. Answer questions about inventory levels, locations, reorder needs, and provide recommendations.

Current Location Filter: ${locationName}

Current Inventory Data:
${JSON.stringify(inventoryContext, null, 2)}

User Question: ${question}

CRITICAL INSTRUCTION - YOU MUST FOLLOW THIS:
- For EVERY SINGLE item you mention in your response, ALWAYS include the clinic/building location in parentheses immediately after the item name
- Format: "Item Name (Clinic/Building Name)"
- Examples: "Antiseptic Wipes (Downtown Clinic)", "Surgical Masks (Westside Medical Center)"
- Include the clinic location for ALL items: stock levels, reorders, expiring items, low stock items, recommendations, EVERYTHING
- Never mention an item without its clinic location
- Format your response clearly with bullet points or numbers when appropriate.`,
                add_context_from_internet: false
            });

            setMessages(prev => [...prev, { role: "assistant", content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: "Sorry, I couldn't process that request. Please try again." 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSuggestions = async () => {
        setIsLoading(true);
        try {
            const filteredItems = selectedLocation === "all" 
                ? inventoryItems 
                : inventoryItems.filter(item => item.location_id === selectedLocation);

            const lowStock = filteredItems.filter(item => 
                item.quantity <= item.low_stock_threshold && item.status === 'active'
            );

            const expiringSoon = filteredItems.filter(item => {
                if (!item.expiry_date) return false;
                const days = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                return days >= 0 && days <= 30;
            });

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an inventory management expert. Analyze this inventory data and provide actionable recommendations:

Low Stock Items (${lowStock.length}):
${JSON.stringify(lowStock.map(item => ({
    name: item.item_name,
    clinic: locations.find(l => l.id === item.location_id)?.name || "Unknown",
    current: item.quantity,
    threshold: item.low_stock_threshold,
    reorder_qty: item.reorder_quantity,
    supplier: item.supplier
})), null, 2)}

Expiring Soon (${expiringSoon.length}):
${JSON.stringify(expiringSoon.map(item => ({
    name: item.item_name,
    clinic: locations.find(l => l.id === item.location_id)?.name || "Unknown",
    expiry: item.expiry_date,
    quantity: item.quantity
})), null, 2)}

CRITICAL INSTRUCTION - YOU MUST FOLLOW THIS FOR ALL ITEMS:
- EVERY item you mention MUST include its clinic/building location in parentheses immediately after the name
- Format: "Item Name (Clinic/Building Name)"
- Examples: "Antiseptic Wipes (Downtown Clinic)", "Surgical Masks (Westside Medical Center)"
- This applies to ALL items in your response: low stock items, expiring items, reorder suggestions, recommendations, EVERYTHING
- NEVER mention an item without its clinic location

Provide:
1. **Priority Reorder List**: Items that need immediate attention with suggested quantities
2. **Expiry Alerts**: Actions to take for items expiring soon
3. **Cost Optimization**: Any opportunities to reduce costs or improve ordering
4. **General Recommendations**: Overall inventory health insights

Be specific and actionable.`,
                add_context_from_internet: false
            });

            setMessages([{ role: "assistant", content: response }]);
        } catch (error) {
            setMessages([{ 
                role: "assistant", 
                content: "Sorry, I couldn't generate suggestions. Please try again." 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQuestions = [
        "What items are low on stock?",
        "Which items are expiring soon?",
        "What should I reorder today?",
        "Show me all medication inventory",
        "What's the total value of supplies?"
    ];

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Inventory AI Assistant
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
                {/* Quick Actions */}
                <div className="p-4 border-b bg-gray-50 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Location</label>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={generateSuggestions}
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <TrendingUp className="w-4 h-4 mr-2" />
                        )}
                        Generate Smart Recommendations
                    </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                        <div className="space-y-4">
                            <div className="text-center py-8">
                                <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                                <p className="text-gray-600 mb-2">Ask me anything about your inventory</p>
                                <p className="text-sm text-gray-500">Try these questions:</p>
                            </div>
                            <div className="space-y-2">
                                {quickQuestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setQuestion(q)}
                                        className="w-full text-left p-3 rounded-lg bg-white border hover:border-purple-300 hover:bg-purple-50 transition-all text-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex gap-2">
                        <Input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask about inventory levels, locations, reorders..."
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={!question.trim() || isLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}