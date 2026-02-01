import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export default function PermissionsFilter({ searchTerm, onSearchChange, onClear }) {
    return (
        <div className="flex gap-2">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search modules or permissions (e.g., 'edit', 'procedures')..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>
            {searchTerm && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}