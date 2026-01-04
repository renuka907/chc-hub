import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Tag, X } from "lucide-react";

export default function BulkActionsBar({ selectedCount, onDelete, onTag, onClear }) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <span className="font-medium">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="h-6 w-px bg-gray-600" />
            <Button
                variant="ghost"
                size="sm"
                onClick={onTag}
                className="text-white hover:bg-gray-800"
            >
                <Tag className="w-4 h-4 mr-2" />
                Add Tags
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-400 hover:bg-red-950 hover:text-red-300"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
            </Button>
            <div className="h-6 w-px bg-gray-600" />
            <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-gray-400 hover:bg-gray-800"
            >
                <X className="w-4 h-4" />
            </Button>
        </div>
    );
}