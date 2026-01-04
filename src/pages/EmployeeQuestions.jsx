import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Plus, Send, UserCircle, Shield } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeQuestions() {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [category, setCategory] = useState("General");
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [response, setResponse] = useState("");
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const { data: questions = [] } = useQuery({
        queryKey: ['employeeQuestions'],
        queryFn: () => base44.entities.EmployeeQuestion.list('-created_date', 100),
    });

    const createQuestionMutation = useMutation({
        mutationFn: (questionData) => base44.entities.EmployeeQuestion.create(questionData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeQuestions'] });
            setShowAddDialog(false);
            setNewQuestion("");
            setIsAnonymous(true);
            setCategory("General");
        },
    });

    const updateQuestionMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.EmployeeQuestion.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeQuestions'] });
            setSelectedQuestion(null);
            setResponse("");
        },
    });

    const handleSubmitQuestion = () => {
        if (!newQuestion.trim()) return;
        createQuestionMutation.mutate({
            question: newQuestion,
            is_anonymous: isAnonymous,
            category: category,
            status: "open"
        });
    };

    const handleSubmitResponse = () => {
        if (!response.trim() || !selectedQuestion) return;
        updateQuestionMutation.mutate({
            id: selectedQuestion.id,
            data: {
                response: response,
                response_by: user?.email,
                status: "answered"
            }
        });
    };

    const categoryColors = {
        "General": "bg-gray-100 text-gray-800",
        "HR": "bg-blue-100 text-blue-800",
        "Operations": "bg-purple-100 text-purple-800",
        "Clinical": "bg-green-100 text-green-800",
        "Suggestion": "bg-yellow-100 text-yellow-800"
    };

    const statusColors = {
        "open": "bg-orange-100 text-orange-800",
        "answered": "bg-blue-100 text-blue-800",
        "resolved": "bg-green-100 text-green-800"
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Questions & Concerns</h1>
                    <p className="text-gray-600">Ask questions anonymously or share suggestions with the team</p>
                </div>
                <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Ask Question
                </Button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {questions.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No questions yet. Be the first to ask!</p>
                        </CardContent>
                    </Card>
                ) : (
                    questions.map((question) => (
                        <Card key={question.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge className={categoryColors[question.category]}>
                                                {question.category}
                                            </Badge>
                                            <Badge className={statusColors[question.status]}>
                                                {question.status}
                                            </Badge>
                                            {question.is_anonymous ? (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    Anonymous
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <UserCircle className="w-3 h-3" />
                                                    {question.created_by}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(question.created_date), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <p className="text-gray-900 whitespace-pre-wrap">{question.question}</p>
                                    </div>
                                </div>
                            </CardHeader>

                            {question.response && (
                                <CardContent className="border-t bg-blue-50/50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Send className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-blue-900 mb-1">
                                                Response {question.response_by && `by ${question.response_by}`}
                                            </p>
                                            <p className="text-gray-700 whitespace-pre-wrap">{question.response}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            )}

                            {!question.response && (user?.role === 'admin' || user?.role === 'manager') && (
                                <CardContent className="border-t">
                                    <Button
                                        onClick={() => setSelectedQuestion(question)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Respond
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Add Question Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Ask a Question or Share a Concern</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="Operations">Operations</SelectItem>
                                    <SelectItem value="Clinical">Clinical</SelectItem>
                                    <SelectItem value="Suggestion">Suggestion</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Your Question</label>
                            <Textarea
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Type your question or concern here..."
                                rows={5}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                id="anonymous"
                                className="w-4 h-4"
                            />
                            <label htmlFor="anonymous" className="text-sm">
                                Post anonymously (recommended)
                            </label>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitQuestion}
                            disabled={!newQuestion.trim() || createQuestionMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Submit Question
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Response Dialog */}
            <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Respond to Question</DialogTitle>
                    </DialogHeader>
                    {selectedQuestion && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Question:</p>
                                <p className="text-gray-900">{selectedQuestion.question}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Your Response</label>
                                <Textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={5}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelectedQuestion(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitResponse}
                            disabled={!response.trim() || updateQuestionMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Submit Response
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}