import React, { useState, useRef, useEffect, useCallback } from "react";
import { ScanLine } from "lucide-react";

export default function ScannerInput({ onScan, placeholder = "Scan barcode or type and press Enter...", autoFocus = true }) {
    const [value, setValue] = useState("");
    const [flash, setFlash] = useState(null); // 'green' | 'red' | null
    const [isListening, setIsListening] = useState(true);
    const inputRef = useRef(null);
    const keystrokeTimesRef = useRef([]);
    const bufferRef = useRef("");

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const triggerFlash = useCallback((color) => {
        setFlash(color);
        setTimeout(() => setFlash(null), 600);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const val = value.trim();
            if (val) {
                onScan(val);
                triggerFlash("green");
                setValue("");
                keystrokeTimesRef.current = [];
                bufferRef.current = "";
            }
            return;
        }

        // Track keystroke timing for scanner detection
        const now = Date.now();
        keystrokeTimesRef.current.push(now);
        
        // Keep only last 50 timestamps
        if (keystrokeTimesRef.current.length > 50) {
            keystrokeTimesRef.current = keystrokeTimesRef.current.slice(-50);
        }
    }, [value, onScan, triggerFlash]);

    const flashClasses = flash === "green" 
        ? "ring-2 ring-green-400 bg-green-50 border-green-400" 
        : flash === "red" 
        ? "ring-2 ring-red-400 bg-red-50 border-red-400" 
        : "border-gray-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-400";

    return (
        <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${flashClasses}`}>
            <div className={`pl-3 flex items-center ${isListening ? 'animate-pulse' : ''}`}>
                <ScanLine className={`w-5 h-5 ${isListening ? 'text-purple-500' : 'text-gray-400'}`} />
            </div>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsListening(true)}
                onBlur={() => setIsListening(false)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
            />
            {value && (
                <button 
                    onClick={() => { setValue(""); inputRef.current?.focus(); }}
                    className="pr-3 text-gray-400 hover:text-gray-600"
                >
                    ×
                </button>
            )}
        </div>
    );
}
