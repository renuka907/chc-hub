import React from "react";
import { Shield } from "lucide-react";

export default function InsuranceCoverage() {
    return (
        <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
            {/* Header bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b bg-white shrink-0">
                <div className="p-2 rounded-lg bg-blue-50">
                    <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-base font-bold text-gray-900">Insurance Coverage Lookup</h1>
                    <p className="text-xs text-gray-500">Check drug formulary tiers, prior auth requirements & cost estimates — powered by InsureWith.ai</p>
                </div>
            </div>

            {/* Full-page embed */}
            <iframe
                src="https://insurewith.ai/"
                title="InsureWith.ai — Drug Insurance Coverage"
                className="flex-1 w-full border-0"
                allow="clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
        </div>
    );
}
