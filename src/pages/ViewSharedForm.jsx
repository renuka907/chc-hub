import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PrintableDocument from "../components/PrintableDocument";
import { openPrintWindow } from "../components/PrintHelper";
import { Lock, AlertCircle, Loader2, FileText, Printer } from "lucide-react";

export default function ViewSharedForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const [passwordInput, setPasswordInput] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState("");

    const { data: sharedLink, isLoading: linkLoading } = useQuery({
        queryKey: ['sharedLink', token],
        queryFn: async () => {
            const allLinks = await base44.entities.SharedFormLink.list();
            return allLinks.find(link => link.share_token === token);
        },
        enabled: !!token
    });

    const { data: formContent, isLoading: contentLoading } = useQuery({
        queryKey: ['sharedFormContent', sharedLink?.entity_type, sharedLink?.entity_id],
        queryFn: async () => {
            if (!sharedLink) return null;
            if (sharedLink.entity_type === "ConsentForm") {
                const forms = await base44.entities.ConsentForm.list();
                return forms.find(f => f.id === sharedLink.entity_id);
            } else {
                const instructions = await base44.entities.AftercareInstruction.list();
                return instructions.find(i => i.id === sharedLink.entity_id);
            }
        },
        enabled: !!sharedLink && (!sharedLink.password || isAuthenticated)
    });

    const incrementViewMutation = useMutation({
        mutationFn: async (linkId) => {
            const currentCount = sharedLink.view_count || 0;
            await base44.entities.SharedFormLink.update(linkId, {
                view_count: currentCount + 1
            });
        }
    });

    React.useEffect(() => {
        if (sharedLink && (!sharedLink.password || isAuthenticated) && !incrementViewMutation.data) {
            incrementViewMutation.mutate(sharedLink.id);
        }
    }, [sharedLink, isAuthenticated]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === sharedLink?.password) {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Incorrect password. Please try again.");
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                        <p className="text-gray-600">This share link is invalid or has been removed.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (linkLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!sharedLink || !sharedLink.is_active) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Not Available</h2>
                        <p className="text-gray-600">
                            This share link has been disabled or does not exist.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h2>
                        <p className="text-gray-600">
                            This share link expired on {new Date(sharedLink.expires_at).toLocaleString()}.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (sharedLink.password && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="text-center mb-6">
                            <Lock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Required</h2>
                            <p className="text-gray-600">This form is password protected.</p>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <Input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Enter password"
                                    className="text-center"
                                />
                            </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                                Unlock Form
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (contentLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!formContent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Form Not Found</h2>
                        <p className="text-gray-600">The shared form could not be found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <Card className="no-print">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    {sharedLink.entity_type === "ConsentForm" ? formContent.form_name : formContent.procedure_name}
                                </h1>
                                <p className="text-gray-600 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {sharedLink.entity_type === "ConsentForm" ? "Consent Form" : "Aftercare Instructions"}
                                </p>
                            </div>
                            <Button onClick={openPrintWindow} className="bg-blue-600 hover:bg-blue-700">
                                <Printer className="w-4 h-4 mr-2" />
                                Print / PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Content */}
                {sharedLink.entity_type === "ConsentForm" ? (
                    <PrintableDocument title="" showLogo={true}>
                        <div 
                            className="text-black"
                            style={{
                                fontSize: '11pt',
                                fontFamily: 'Times New Roman, serif',
                                lineHeight: '1.4',
                                textAlign: 'left'
                            }}
                            dangerouslySetInnerHTML={{ __html: formContent.content }}
                        />
                    </PrintableDocument>
                ) : (
                    <PrintableDocument title={formContent.procedure_name} showLogo={true}>
                        <div className="space-y-6">
                            {formContent.instructions && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                                    <div dangerouslySetInnerHTML={{ __html: formContent.instructions }} />
                                </div>
                            )}
                            {formContent.warning_signs && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Warning Signs</h3>
                                    <div dangerouslySetInnerHTML={{ __html: formContent.warning_signs }} />
                                </div>
                            )}
                            {formContent.follow_up && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Follow-up</h3>
                                    <div dangerouslySetInnerHTML={{ __html: formContent.follow_up }} />
                                </div>
                            )}
                        </div>
                    </PrintableDocument>
                )}
            </div>
        </div>
    );
}