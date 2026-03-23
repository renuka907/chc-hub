import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Link2, Search, Check, Package, AlertCircle } from 'lucide-react';

export default function CameraScanner({ open, onOpenChange, inventoryItems = [], onItemFound, onLinkBarcode }) {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [matchedItem, setMatchedItem] = useState(null);
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setScannedCode(null);
      setMatchedItem(null);
      setShowLinkSearch(false);
      setLinkSearch('');
      setError(null);
      // Small delay to let dialog render
      setTimeout(() => startScanning(), 500);
    } else {
      stopScanning();
    }
    return () => stopScanning();
  }, [open]);

  const startScanning = async () => {
    try {
      setError(null);
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('camera-scanner-region');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // Success
          handleScanResult(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {} // Ignore scan failures (continuous scanning)
      );
      setScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setError(typeof err === 'string' ? err : err?.message || 'Could not access camera. Please allow camera permissions.');
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = (code) => {
    setScannedCode(code);
    // Try to find matching item by SKU
    const match = inventoryItems.find(
      item => item.sku === code || (item.sku && item.sku.trim() === code.trim())
    );
    if (match) {
      setMatchedItem(match);
      if (onItemFound) onItemFound(match);
    } else {
      setMatchedItem(null);
    }
  };

  const handleRescan = () => {
    setScannedCode(null);
    setMatchedItem(null);
    setShowLinkSearch(false);
    setLinkSearch('');
    setTimeout(() => startScanning(), 300);
  };

  const handleLinkItem = (item) => {
    if (onLinkBarcode && scannedCode) {
      onLinkBarcode(item, scannedCode);
      setMatchedItem(item);
      setShowLinkSearch(false);
    }
  };

  const filteredLinkItems = inventoryItems.filter(item => {
    if (!linkSearch.trim()) return false;
    const q = linkSearch.toLowerCase();
    return (
      (item.item_name || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q)
    );
  });

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            Camera Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4">
          {/* Camera View */}
          {!scannedCode && (
            <div>
              <div
                id="camera-scanner-region"
                className="rounded-lg overflow-hidden bg-black"
                style={{ minHeight: '250px' }}
              />
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-700">{error}</p>
                    <Button size="sm" variant="outline" onClick={startScanning} className="mt-2 text-xs">
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
              {scanning && !error && (
                <p className="text-center text-sm text-gray-500 mt-3 animate-pulse">
                  Point camera at a barcode...
                </p>
              )}
            </div>
          )}

          {/* Scan Result */}
          {scannedCode && (
            <div className="space-y-3">
              {/* Scanned Code Display */}
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-xs text-gray-500 mb-1">Scanned Barcode</p>
                <p className="font-mono font-bold text-lg">{scannedCode}</p>
              </div>

              {/* Matched Item */}
              {matchedItem ? (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Item Found!</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{matchedItem.item_name}</p>
                      <div className="flex gap-2 mt-1">
                        {matchedItem.sku && <Badge variant="outline" className="text-xs">SKU: {matchedItem.sku}</Badge>}
                        <Badge variant="outline" className="text-xs">Qty: {matchedItem.quantity || 0}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* No Match */}
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">No matching item found</span>
                    </div>
                    <p className="text-xs text-amber-700">This barcode isn't linked to any inventory item yet.</p>
                  </div>

                  {/* Link to Existing Item */}
                  {!showLinkSearch ? (
                    <Button
                      onClick={() => setShowLinkSearch(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Link to Existing Item
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={linkSearch}
                          onChange={e => setLinkSearch(e.target.value)}
                          placeholder="Search inventory items..."
                          className="pl-9"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredLinkItems.length > 0 ? (
                          filteredLinkItems.slice(0, 20).map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleLinkItem(item)}
                              className="w-full text-left p-2 rounded-lg hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors"
                            >
                              <p className="text-sm font-medium">{item.item_name}</p>
                              <div className="flex gap-2 mt-0.5">
                                {item.sku && <span className="text-xs text-gray-400">SKU: {item.sku}</span>}
                                <span className="text-xs text-gray-400">Qty: {item.quantity || 0}</span>
                              </div>
                            </button>
                          ))
                        ) : linkSearch.trim() ? (
                          <p className="text-xs text-gray-400 text-center py-3">No items match "{linkSearch}"</p>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-3">Type to search...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleRescan} variant="outline" className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Again
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
