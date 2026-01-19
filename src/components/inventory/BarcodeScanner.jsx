import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, X } from "lucide-react";

export default function BarcodeScanner({ open, onOpenChange, onBarcodeScanned }) {
    const [scannedCode, setScannedCode] = useState("");
    const [manualInput, setManualInput] = useState("");
    const [isManualMode, setIsManualMode] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);

    useEffect(() => {
        if (!open || isManualMode) return;

        const initScanner = async () => {
            try {
                setError(null);
                const html5QrcodeScanner = new Html5QrcodeScanner(
                    "qr-reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    false
                );

                html5QrcodeScanner.render(
                    (decodedText) => {
                        setScannedCode(decodedText);
                        onBarcodeScanned(decodedText);
                        html5QrcodeScanner.clear();
                        onOpenChange(false);
                    },
                    (error) => {
                        // Ignore scanning errors during normal operation
                    }
                );

                html5QrcodeRef.current = html5QrcodeScanner;
            } catch (err) {
                setError(err.message || "Failed to access camera. Please check permissions.");
            }
        };

        initScanner();

        return () => {
            if (html5QrcodeRef.current) {
                html5QrcodeRef.current.clear().catch(() => {});
            }
        };
    }, [open, isManualMode, onBarcodeScanned, onOpenChange]);

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            onBarcodeScanned(manualInput.trim());
            setManualInput("");
            onOpenChange(false);
        }
    };

    const handleClose = () => {
        if (html5QrcodeRef.current) {
            html5QrcodeRef.current.clear().catch(() => {});
        }
        setScannedCode("");
        setManualInput("");
        setError(null);
        setIsManualMode(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Barcode</DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-900">{error}</p>
                            <p className="text-sm text-red-700 mt-1">You can enter the barcode manually below instead.</p>
                        </div>
                    </div>
                )}

                {!isManualMode ? (
                    <div>
                        <div id="qr-reader" className="rounded-lg overflow-hidden" />
                        <p className="text-center text-sm text-gray-600 mt-4">Point your camera at a barcode or QR code</p>
                        <Button
                            variant="outline"
                            onClick={() => setIsManualMode(true)}
                            className="w-full mt-4"
                        >
                            Enter Manually
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Barcode Number
                            </label>
                            <Input
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                placeholder="Enter barcode or SKU..."
                                autoFocus
                                onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsManualMode(false);
                                setError(null);
                            }}
                            className="w-full"
                        >
                            Use Camera Instead
                        </Button>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    {isManualMode && (
                        <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                            Search
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}