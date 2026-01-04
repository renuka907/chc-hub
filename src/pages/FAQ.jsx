import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, Send, HelpCircle, Plus, Pencil, Trash2, Search } from "lucide-react";
import FAQForm from "../components/FAQForm";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FAQ() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [question, setQuestion] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFaqForm, setShowFaqForm] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [deletingFaq, setDeletingFaq] = useState(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: faqs = [] } = useQuery({
        queryKey: ['faqs'],
        queryFn: () => base44.entities.FAQ.list('order', 100),
    });

    const deleteFaqMutation = useMutation({
        mutationFn: (id) => base44.entities.FAQ.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            setDeletingFaq(null);
        },
    });

    const sendEmailMutation = useMutation({
        mutationFn: async (data) => {
            await base44.integrations.Core.SendEmail({
                to: "renuka@contemporaryhealthcenter.com",
                subject: `New Question from ${data.name}`,
                body: `Name: ${data.name}\nEmail: ${data.email}\n\nQuestion:\n${data.question}`
            });
        },
        onSuccess: () => {
            setName("");
            setEmail("");
            setQuestion("");
            alert("Your question has been sent! We'll get back to you soon.");
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !question.trim()) {
            alert("Please fill in all fields");
            return;
        }
        sendEmailMutation.mutate({ name, email, question });
    };

    const categoryColors = {
        "General": "bg-gray-100 text-gray-800",
        "HR": "bg-blue-100 text-blue-800",
        "Operations": "bg-purple-100 text-purple-800",
        "Clinical": "bg-green-100 text-green-800",
        "Benefits": "bg-yellow-100 text-yellow-800"
    };

    const normalizeText = (text) => {
        return text.toLowerCase().replace(/[\s\-\.]/g, '');
    };

    const filteredFaqs = faqs.filter(faq => {
        const categoryMatch = selectedCategory === "all" || faq.category === selectedCategory;
        const searchMatch = !searchQuery || 
            normalizeText(faq.question).includes(normalizeText(searchQuery)) ||
            normalizeText(faq.answer).includes(normalizeText(searchQuery));
        return categoryMatch && searchMatch;
    });

    const categories = ["all", ...new Set(faqs.map(f => f.category))];

    const isAdmin = user?.role === 'admin' || user?.role === 'manager';

    const handleEdit = (faq) => {
        setEditingFaq(faq);
        setShowFaqForm(true);
    };

    const handleDelete = () => {
        if (deletingFaq) {
            deleteFaqMutation.mutate(deletingFaq.id);
        }
    };

    const handleFormSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        setShowFaqForm(false);
        setEditingFaq(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
                    <p className="text-gray-600">Find answers to common questions or ask your own</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => { setEditingFaq(null); setShowFaqForm(true); }} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add FAQ
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search FAQs..."
                    className="pl-10"
                />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        onClick={() => setSelectedCategory(cat)}
                        size="sm"
                    >
                        {cat === "all" ? "All" : cat}
                    </Button>
                ))}
            </div>

            {/* FAQs Accordion */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        Questions & Answers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredFaqs.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No FAQs found in this category</p>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {filteredFaqs.map((faq, index) => (
                                <AccordionItem key={faq.id} value={`item-${index}`}>
                                    <AccordionTrigger className="text-left">
                                        <div className="flex items-start gap-3 flex-1">
                                            <Badge className={categoryColors[faq.category]}>
                                                {faq.category}
                                            </Badge>
                                            <span className="flex-1">{faq.question}</span>
                                            {isAdmin && (
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(faq)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setDeletingFaq(faq)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pl-12 pt-2 text-gray-700 whitespace-pre-wrap">
                                            {faq.answer}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            {/* Ask a Question Form */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Can't Find Your Answer? Ask Us!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Your Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Your Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Your Question</label>
                            <Textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Type your question here..."
                                rows={4}
                                required
                            />
                        </div>
                        <Button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={sendEmailMutation.isPending}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {sendEmailMutation.isPending ? "Sending..." : "Send Question"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <FAQForm
                open={showFaqForm}
                onOpenChange={setShowFaqForm}
                onSuccess={handleFormSuccess}
                editFaq={editingFaq}
            />

            <AlertDialog open={!!deletingFaq} onOpenChange={() => setDeletingFaq(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this FAQ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}