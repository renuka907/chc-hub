import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function MedicationCalculator() {
    const [amountNeeded, setAmountNeeded] = useState("");
    const [vialStrength, setVialStrength] = useState("");
    const [unitsPerMl, setUnitsPerMl] = useState("100");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const handleCalculate = () => {
        setError("");
        setResult(null);

        const amount = parseFloat(amountNeeded);
        const strength = parseFloat(vialStrength);
        const units = unitsPerMl ? parseFloat(unitsPerMl) : null;

        if (!amountNeeded || !vialStrength) {
            setError("Please fill in amount needed and vial strength");
            return;
        }

        if (isNaN(amount) || isNaN(strength)) {
            setError("Please enter valid numbers");
            return;
        }

        if (amount <= 0 || strength <= 0) {
            setError("Values must be greater than 0");
            return;
        }

        if (units !== null && (isNaN(units) || units <= 0)) {
            setError("Units per ml must be a valid number greater than 0");
            return;
        }

        const volumeToDrawMl = amount / strength;
        const volumeToDrawCc = volumeToDrawMl;
        const insulinUnits = units ? Math.round(volumeToDrawMl * units) : null;

        setResult({
            ml: volumeToDrawMl.toFixed(3),
            cc: volumeToDrawCc.toFixed(3),
            units: insulinUnits,
            amountNeeded: amount,
            vialStrength: strength
        });
    };

    const handleReset = () => {
        setAmountNeeded("");
        setVialStrength("");
        setUnitsPerMl("");
        setResult(null);
        setError("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCalculate();
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication Dosage Calculator</h1>
                <p className="text-gray-600">Calculate volume to draw based on amount needed and vial strength</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {/* Amount Needed */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Amount Needed (mg)
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g., 100"
                                value={amountNeeded}
                                onChange={(e) => setAmountNeeded(e.target.value)}
                                onKeyPress={handleKeyPress}
                                step="0.1"
                                min="0"
                                className="text-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter the dose in milligrams</p>
                        </div>

                        {/* Vial Strength */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Vial Strength (mg/ml)
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g., 200"
                                value={vialStrength}
                                onChange={(e) => setVialStrength(e.target.value)}
                                onKeyPress={handleKeyPress}
                                step="0.1"
                                min="0"
                                className="text-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter the concentration (e.g., 200mg/ml)</p>
                        </div>

                        {/* Units per ml (Optional) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Units per ml (Optional)
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g., 100 for U-100 insulin"
                                value={unitsPerMl}
                                onChange={(e) => setUnitsPerMl(e.target.value)}
                                onKeyPress={handleKeyPress}
                                step="0.1"
                                min="0"
                                className="text-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave blank to skip insulin units calculation. Common: U-100 (100 units/ml)</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700">{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleCalculate}
                                className="bg-blue-600 hover:bg-blue-700 flex-1"
                            >
                                Calculate
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="outline"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Calculation Summary</p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">{result.amountNeeded}mg</span> ÷ <span className="font-semibold">{result.vialStrength}mg/ml</span> = Volume to draw
                                    </p>
                                </div>

                                <div className={`grid gap-4 ${result.units ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Volume (ml)</p>
                                        <p className="text-3xl font-bold text-green-700">{result.ml}</p>
                                        <p className="text-xs text-gray-600 mt-1">milliliters</p>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Volume (cc)</p>
                                        <p className="text-3xl font-bold text-green-700">{result.cc}</p>
                                        <p className="text-xs text-gray-600 mt-1">cubic centimeters</p>
                                    </div>

                                    {result.units && (
                                        <div className="bg-white rounded-lg p-4 border border-green-200">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Insulin Units</p>
                                            <p className="text-3xl font-bold text-green-700">{result.units}</p>
                                            <p className="text-xs text-gray-600 mt-1">on insulin syringe</p>
                                        </div>
                                    )}
                                </div>

                                <Alert className="border-blue-200 bg-blue-50">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-700 text-sm">
                                        Draw up <span className="font-bold">{result.ml} ml ({result.cc} cc)</span> from the vial
                                        {result.units && <span> • <span className="font-bold">{result.units} units</span> on insulin syringe</span>}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            {/* Info Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">How to Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                    <div>
                        <p className="font-semibold text-gray-900 mb-1">Step 1: Enter Amount Needed</p>
                        <p>Enter the dose you need to administer in milligrams (mg)</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 mb-1">Step 2: Enter Vial Strength</p>
                        <p>Enter the concentration of the medication in the vial (e.g., 200mg/ml means 200 milligrams per 1 milliliter)</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 mb-1">Step 3: Calculate</p>
                        <p>Click Calculate to see how much volume to draw up. The result shows both ml and cc (which are equivalent)</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}