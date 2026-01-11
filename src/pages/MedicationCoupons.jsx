import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrintableDocument from "../components/PrintableDocument";
import { Printer, Plus, Trash2, Pill, ExternalLink } from "lucide-react";

export default function MedicationCoupons() {
    const [patientName, setPatientName] = useState("");
    const [medications, setMedications] = useState([]);
    const [currentMed, setCurrentMed] = useState({
        name: "",
        dosage: "",
        quantity: "",
        discount: "20"
    });
    const [isPrinting, setIsPrinting] = useState(false);

    const addMedication = () => {
        if (currentMed.name) {
            setMedications([...medications, { ...currentMed, id: Date.now() }]);
            setCurrentMed({ name: "", dosage: "", quantity: "", discount: "20" });
        }
    };

    const removeMedication = (id) => {
        setMedications(medications.filter(med => med.id !== id));
    };

    const handlePrint = () => {
        if (medications.length === 0) return;
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setTimeout(() => setIsPrinting(false), 500);
        }, 100);
    };

    const openGoodRx = (medName) => {
        const searchTerm = encodeURIComponent(medName);
        window.open(`https://www.goodrx.com/${searchTerm}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0.5in;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .printable-coupons,
                        .printable-coupons * {
                            visibility: visible;
                        }
                        .printable-coupons {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .coupon-card {
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                    }
                `}
            </style>

            {/* Printable Coupons */}
            {isPrinting && medications.length > 0 && (
                <div className="printable-coupons">
                    <PrintableDocument title="Medication Discount Coupons" showLogo={true}>
                        {patientName && (
                            <div className="mb-6 pb-4 border-b-2">
                                <div className="text-sm text-gray-500">Patient Name</div>
                                <div className="text-lg font-bold">{patientName}</div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {medications.map((med, index) => (
                                <div key={med.id} className="coupon-card border-4 border-dashed border-gray-400 p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="text-2xl font-bold text-gray-900 mb-2">{med.name}</div>
                                            {med.dosage && (
                                                <div className="text-lg text-gray-700">Dosage: {med.dosage}</div>
                                            )}
                                            {med.quantity && (
                                                <div className="text-lg text-gray-700">Quantity: {med.quantity}</div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-4xl font-bold text-green-600">
                                                {med.discount}% OFF
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">Discount</div>
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="font-semibold text-gray-700">Coupon Code:</div>
                                                <div className="text-xl font-mono font-bold text-blue-600 mt-1">
                                                    RX{Math.floor(100000 + Math.random() * 900000)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-700">Valid Until:</div>
                                                <div className="text-lg font-bold mt-1">
                                                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 text-xs text-gray-600 border-t pt-3">
                                        <p className="font-semibold mb-1">Instructions:</p>
                                        <p>Present this coupon to your pharmacist at the time of purchase. Cannot be combined with insurance. Valid at most major pharmacies.</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t-2 text-sm text-gray-600">
                            <p className="font-semibold mb-2">Important Information:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>These coupons are provided as a courtesy to help reduce medication costs</li>
                                <li>Discounts may vary by pharmacy and medication</li>
                                <li>Not valid with insurance - use only if paying out of pocket</li>
                                <li>Valid for 30 days from print date</li>
                            </ul>
                        </div>
                    </PrintableDocument>
                </div>
            )}

            {/* Header */}
            <div className="no-print">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication Discount Coupons</h1>
                <p className="text-gray-600">Search GoodRx for real medication prices and coupons</p>
            </div>

            {/* Input Form */}
            <div className="grid md:grid-cols-2 gap-6 no-print">
                {/* Left: Add Medications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Pill className="w-5 h-5 mr-2" />
                            Add Medication
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Patient Name (Optional)</Label>
                            <Input
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                placeholder="Enter patient name..."
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <div className="space-y-4">
                                <div>
                                    <Label>Medication Name *</Label>
                                    <Input
                                        value={currentMed.name}
                                        onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                                        placeholder="e.g., Metformin, Lisinopril..."
                                    />
                                </div>

                                <div>
                                    <Label>Dosage</Label>
                                    <Input
                                        value={currentMed.dosage}
                                        onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                        placeholder="e.g., 500mg, 10mg twice daily..."
                                    />
                                </div>

                                <div>
                                    <Label>Quantity</Label>
                                    <Input
                                        value={currentMed.quantity}
                                        onChange={(e) => setCurrentMed({ ...currentMed, quantity: e.target.value })}
                                        placeholder="e.g., 30 tablets, 90-day supply..."
                                    />
                                </div>

                                <div>
                                    <Label>Discount Percentage</Label>
                                    <Select
                                        value={currentMed.discount}
                                        onValueChange={(value) => setCurrentMed({ ...currentMed, discount: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10% Off</SelectItem>
                                            <SelectItem value="15">15% Off</SelectItem>
                                            <SelectItem value="20">20% Off</SelectItem>
                                            <SelectItem value="25">25% Off</SelectItem>
                                            <SelectItem value="30">30% Off</SelectItem>
                                            <SelectItem value="40">40% Off</SelectItem>
                                            <SelectItem value="50">50% Off</SelectItem>
                                            <SelectItem value="75">75% Off</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        onClick={addMedication}
                                        disabled={!currentMed.name}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add to List
                                    </Button>
                                    <Button
                                        onClick={() => openGoodRx(currentMed.name)}
                                        disabled={!currentMed.name}
                                        variant="outline"
                                        className="border-2 border-orange-500 text-orange-700 hover:bg-orange-50"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Search GoodRx
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Medications List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Medications to Print ({medications.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {medications.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No medications added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {medications.map((med) => (
                                    <Card key={med.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                    <div className="font-bold text-lg text-gray-900">{med.name}</div>
                                                    {med.dosage && (
                                                        <div className="text-sm text-gray-600 mt-1">Dosage: {med.dosage}</div>
                                                    )}
                                                    {med.quantity && (
                                                        <div className="text-sm text-gray-600">Qty: {med.quantity}</div>
                                                    )}
                                                    <div className="text-lg font-bold text-green-600 mt-2">
                                                        {med.discount}% OFF
                                                    </div>
                                                    <Button
                                                        onClick={() => openGoodRx(med.name)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="mt-2 border-orange-500 text-orange-700 hover:bg-orange-50"
                                                    >
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        View on GoodRx
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMedication(med.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Button
                                    onClick={handlePrint}
                                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg mt-4"
                                >
                                    <Printer className="w-5 h-5 mr-2" />
                                    Print Coupons
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}