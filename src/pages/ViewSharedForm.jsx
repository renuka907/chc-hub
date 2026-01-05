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
    // Parse token from hash-based URL (e.g., /#/ViewSharedForm?token=xyz)
    const hashParts = window.location.hash.split('?');
    const queryString = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const token = urlParams.get('token');
    const [passwordInput, setPasswordInput] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState("");

    const { data: sharedLink, isLoading: linkLoading, error: linkError } = useQuery({
        queryKey: ['sharedLink', token],
        queryFn: async () => {
            const allLinks = await base44.entities.SharedFormLink.list();
            const found = allLinks.find(link => link.share_token === token);
            console.log('Looking for token:', token);
            console.log('All links:', allLinks);
            console.log('Found link:', found);
            return found;
        },
        enabled: !!token,
        retry: false
    });

    const { data: formContent, isLoading: contentLoading, error: contentError } = useQuery({
        queryKey: ['sharedFormContent', sharedLink?.entity_type, sharedLink?.entity_id],
        queryFn: async () => {
            if (!sharedLink) return null;
            console.log('Fetching content for:', sharedLink.entity_type, sharedLink.entity_id);
            if (sharedLink.entity_type === "ConsentForm") {
                const forms = await base44.entities.ConsentForm.list();
                const found = forms.find(f => f.id === sharedLink.entity_id);
                console.log('ConsentForm found:', found);
                return found;
            } else if (sharedLink.entity_type === "AftercareInstruction") {
                const instructions = await base44.entities.AftercareInstruction.list();
                const found = instructions.find(i => i.id === sharedLink.entity_id);
                console.log('AftercareInstruction found:', found);
                return found;
            } else if (sharedLink.entity_type === "Quote") {
                const quotes = await base44.entities.Quote.list();
                const found = quotes.find(q => q.id === sharedLink.entity_id);
                console.log('Quote found:', found);
                return found;
            }
        },
        enabled: !!sharedLink && (!sharedLink.password || isAuthenticated),
        retry: false
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
        enabled: !!sharedLink && sharedLink.entity_type === "Quote"
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
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading share link...</p>
                </div>
            </div>
        );
    }

    if (linkError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Link</h2>
                        <p className="text-gray-600 mb-4">There was an error loading the share link. Please check the console for details.</p>
                        <pre className="text-xs text-left bg-gray-100 p-2 rounded">{JSON.stringify(linkError, null, 2)}</pre>
                    </CardContent>
                </Card>
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
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading content...</p>
                </div>
            </div>
        );
    }

    if (contentError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Content</h2>
                        <p className="text-gray-600 mb-4">There was an error loading the content. Please check the console for details.</p>
                        <pre className="text-xs text-left bg-gray-100 p-2 rounded">{JSON.stringify(contentError, null, 2)}</pre>
                    </CardContent>
                </Card>
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
                                    {sharedLink.entity_type === "ConsentForm" ? formContent.form_name : 
                                     sharedLink.entity_type === "Quote" ? `Quote ${formContent.quote_number}` : 
                                     formContent.procedure_name}
                                </h1>
                                <p className="text-gray-600 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {sharedLink.entity_type === "ConsentForm" ? "Consent Form" : 
                                     sharedLink.entity_type === "Quote" ? "Price Quote" : 
                                     "Aftercare Instructions"}
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
                ) : sharedLink.entity_type === "Quote" ? (
                    <PrintableDocument title="Price Quote" showLogo={true}>
                        {(() => {
                            const items = JSON.parse(formContent.items || '[]');
                            const location = locations.find(l => l.id === formContent.clinic_location_id);
                            return (
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6 pb-6 border-b">
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Quote Number</div>
                                            <div className="font-bold text-lg">{formContent.quote_number}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Date</div>
                                            <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                                        </div>
                                        {formContent.patient_name && (
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">Patient Name</div>
                                                <div className="font-semibold">{formContent.patient_name}</div>
                                            </div>
                                        )}
                                        {location && (
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">Clinic Location</div>
                                                <div className="font-semibold">{location.name}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-lg mb-4">Items</h3>
                                        <table className="w-full">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold">Item</th>
                                                    <th className="text-center p-3 font-semibold">Qty</th>
                                                    <th className="text-right p-3 font-semibold">Price</th>
                                                    <th className="text-right p-3 font-semibold">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, index) => (
                                                    <tr key={index} className="border-b">
                                                        <td className="p-3">
                                                            <div className="font-medium">{item.name}</div>
                                                            {item.tier_name && (
                                                                <div className="text-sm text-gray-600">{item.tier_name}</div>
                                                            )}
                                                        </td>
                                                        <td className="text-center p-3">{item.quantity}</td>
                                                        <td className="text-right p-3">${item.price.toFixed(2)}</td>
                                                        <td className="text-right p-3 font-semibold">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {formContent.show_totals !== false && (
                                        <div className="flex justify-end">
                                            <div className="w-64 space-y-2">
                                                <div className="flex justify-between pb-2">
                                                    <span>Subtotal:</span>
                                                    <span className="font-semibold">${formContent.subtotal.toFixed(2)}</span>
                                                </div>
                                                {formContent.discount_amount > 0 && (
                                                    <div className="flex justify-between pb-2 text-green-600">
                                                        <span>Discount:</span>
                                                        <span className="font-semibold">-${formContent.discount_amount.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pb-2">
                                                    <span>Tax ({location?.tax_rate}%):</span>
                                                    <span className="font-semibold">${formContent.tax_amount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xl font-bold text-blue-900 pt-2 border-t-2">
                                                    <span>Total:</span>
                                                    <span>${formContent.total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formContent.notes && (
                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <div className="font-semibold mb-2">Notes:</div>
                                            <div className="text-gray-700 whitespace-pre-wrap">{formContent.notes}</div>
                                        </div>
                                    )}

                                    <div className="text-sm text-gray-500 border-t pt-4 mt-8">
                                        <p>This quote is valid for 30 days from the date of issue.</p>
                                        <p className="mt-2">Payment is due at the time of service unless other arrangements have been made.</p>
                                    </div>

                                    {formContent.image_url && (
                                        <div className="mt-6">
                                            <img src={formContent.image_url} alt="Quote image" className="w-full max-h-96 object-contain rounded-lg border" />
                                        </div>
                                    )}

                                    {formContent.document_url && (
                                        <div className="mt-6 bg-slate-50 border p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-6 h-6 text-slate-600" />
                                                    <div>
                                                        <p className="font-semibold text-slate-900">Attached Document</p>
                                                        <p className="text-sm text-slate-600">View or download the full document</p>
                                                    </div>
                                                </div>
                                                <a 
                                                    href={formContent.document_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Open PDF
                                                </a>
                                            </div>
                                            <iframe 
                                                src={formContent.document_url}
                                                className="w-full h-[600px] border-2 border-slate-300 rounded-lg"
                                                title="Document Preview"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
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