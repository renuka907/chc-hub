import React from "react";

export default function SyringeVisualization({ result }) {
    // Determine which syringe type to use
    const determineSyringeType = () => {
        if (result.units !== null && result.units !== undefined) {
            // Insulin syringe
            if (result.units <= 30) return "insulin30";
            return "insulin100";
        }

        const volumeMl = parseFloat(result.ml);
        if (volumeMl <= 1) return "tb1";
        if (volumeMl <= 3) return "syringe3";
        if (volumeMl <= 5) return "syringe5";
        return "syringe5";
    };

    const syringeType = determineSyringeType();
    const volumeMl = parseFloat(result.ml);
    const units = result.units;

    const renderInsulin30Syringe = () => {
        const percentage = (units / 30) * 100;
        const majorMarks = [0, 5, 10, 15, 20, 25, 30];
        const minorMarks = [];
        for (let i = 0; i <= 30; i += 1) {
            if (!majorMarks.includes(i)) minorMarks.push(i);
        }
        return (
            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">30 Unit Insulin Syringe</p>
                <div className="relative h-24 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full border-2 border-blue-400">
                    {minorMarks.map((mark) => {
                        const markPercentage = (mark / 30) * 100;
                        return (
                            <div key={`minor-${mark}`} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-0.5 bg-gray-400" style={{ height: "6px" }} />
                            </div>
                        );
                    })}
                    {majorMarks.map((mark) => {
                        const markPercentage = (mark / 30) * 100;
                        return (
                            <div key={mark} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-1 bg-gray-800" style={{ height: "16px" }} />
                                <span className="text-xs font-semibold text-gray-700 mt-1">{mark}</span>
                            </div>
                        );
                    })}
                    <div
                        className="absolute top-1/2 h-10 bg-red-500 rounded transition-all"
                        style={{
                            left: `${percentage}%`,
                            transform: "translateX(-50%) translateY(-50%)",
                            width: "4px"
                        }}
                    />
                </div>
                <p className="text-sm text-gray-600">Draw to <span className="font-bold text-red-600">{units} units</span></p>
            </div>
        );
    };

    const renderInsulin100Syringe = () => {
        const percentage = (units / 100) * 100;
        const majorMarks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const minorMarks = [];
        for (let i = 0; i <= 100; i += 5) {
            if (!majorMarks.includes(i)) minorMarks.push(i);
        }
        return (
            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">100 Unit Insulin Syringe</p>
                <div className="relative h-24 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full border-2 border-blue-400">
                    {minorMarks.map((mark) => {
                        const markPercentage = (mark / 100) * 100;
                        return (
                            <div key={`minor-${mark}`} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-0.5 bg-gray-400" style={{ height: "8px" }} />
                            </div>
                        );
                    })}
                    {majorMarks.map((mark) => {
                        const markPercentage = (mark / 100) * 100;
                        return (
                            <div key={mark} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-1 bg-gray-800" style={{ height: "16px" }} />
                                <span className="text-xs font-semibold text-gray-700 mt-1">{mark}</span>
                            </div>
                        );
                    })}
                    <div
                        className="absolute top-1/2 h-10 bg-red-500 rounded transition-all"
                        style={{
                            left: `${percentage}%`,
                            transform: "translateX(-50%) translateY(-50%)",
                            width: "4px"
                        }}
                    />
                </div>
                <p className="text-sm text-gray-600">Draw to <span className="font-bold text-red-600">{units} units</span></p>
            </div>
        );
    };

    const renderTB1Syringe = () => {
        const percentage = (volumeMl / 1) * 100;
        const majorMarks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        const minorMarks = [];
        for (let i = 0; i <= 100; i += 2) {
            const mark = i / 100;
            if (!majorMarks.find(m => Math.abs(m - mark) < 0.01)) minorMarks.push(mark);
        }
        return (
            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">1 ml TB Syringe</p>
                <div className="relative h-24 bg-gradient-to-r from-amber-50 to-amber-100 rounded-full border-2 border-amber-400">
                    {minorMarks.map((mark) => {
                        const markPercentage = (mark / 1) * 100;
                        return (
                            <div key={`minor-${mark.toFixed(2)}`} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-0.5 bg-gray-400" style={{ height: "6px" }} />
                            </div>
                        );
                    })}
                    {majorMarks.map((mark) => {
                        const markPercentage = (mark / 1) * 100;
                        return (
                            <div key={mark.toFixed(1)} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-1 bg-gray-800" style={{ height: "16px" }} />
                                <span className="text-xs font-semibold text-gray-700 mt-1">{mark.toFixed(1)}</span>
                            </div>
                        );
                    })}
                    <div
                        className="absolute top-1/2 h-10 bg-red-500 rounded transition-all"
                        style={{
                            left: `${percentage}%`,
                            transform: "translateX(-50%) translateY(-50%)",
                            width: "4px"
                        }}
                    />
                </div>
                <p className="text-sm text-gray-600">Draw to <span className="font-bold text-red-600">{volumeMl.toFixed(2)} ml</span></p>
            </div>
        );
    };

    const renderSyringe3ml = () => {
        const percentage = (volumeMl / 3) * 100;
        const majorMarks = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
        const minorMarks = [];
        for (let i = 0; i <= 30; i += 1) {
            const mark = i / 10;
            if (!majorMarks.find(m => Math.abs(m - mark) < 0.01)) minorMarks.push(mark);
        }
        return (
            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">3 ml Syringe</p>
                <div className="relative h-24 bg-gradient-to-r from-green-50 to-green-100 rounded-full border-2 border-green-400">
                    {minorMarks.map((mark) => {
                        const markPercentage = (mark / 3) * 100;
                        return (
                            <div key={`minor-${mark.toFixed(2)}`} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-0.5 bg-gray-400" style={{ height: "6px" }} />
                            </div>
                        );
                    })}
                    {majorMarks.map((mark) => {
                        const markPercentage = (mark / 3) * 100;
                        return (
                            <div key={mark} className="absolute top-0 flex flex-col items-center z-10" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-1 bg-gray-800" style={{ height: "16px" }} />
                                <span className="text-xs font-semibold text-gray-700 mt-1">{mark.toFixed(1)}</span>
                            </div>
                        );
                    })}
                    <div
                        className="absolute top-1/2 h-10 bg-red-500 rounded transition-all"
                        style={{
                            left: `${percentage}%`,
                            transform: "translateX(-50%) translateY(-50%)",
                            width: "4px"
                        }}
                    />
                </div>
                <p className="text-sm text-gray-600">Draw to <span className="font-bold text-red-600">{volumeMl.toFixed(2)} ml</span></p>
            </div>
        );
    };

    const renderSyringe5ml = () => {
        const percentage = (volumeMl / 5) * 100;
        const marks = [0, 1, 2, 3, 4, 5];
        return (
            <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">5 ml Syringe</p>
                <div className="relative h-24 bg-gradient-to-r from-purple-50 to-purple-100 rounded-full border-2 border-purple-400">
                    {marks.map((mark) => {
                        const markPercentage = (mark / 5) * 100;
                        return (
                            <div key={mark} className="absolute top-0 flex flex-col items-center" style={{ left: `${markPercentage}%`, transform: "translateX(-50%)" }}>
                                <div className="w-1 bg-gray-800" style={{ height: "16px" }} />
                                <span className="text-xs font-semibold text-gray-700 mt-1">{mark}</span>
                            </div>
                        );
                    })}
                    <div
                        className="absolute top-1/2 h-10 bg-red-500 rounded transition-all"
                        style={{
                            left: `${percentage}%`,
                            transform: "translateX(-50%) translateY(-50%)",
                            width: "4px"
                        }}
                    />
                </div>
                <p className="text-sm text-gray-600">Draw to <span className="font-bold text-red-600">{volumeMl.toFixed(2)} ml</span></p>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Recommended Syringe</p>
            {syringeType === "insulin30" && renderInsulin30Syringe()}
            {syringeType === "insulin100" && renderInsulin100Syringe()}
            {syringeType === "tb1" && renderTB1Syringe()}
            {syringeType === "syringe3" && renderSyringe3ml()}
            {syringeType === "syringe5" && renderSyringe5ml()}
        </div>
    );
}