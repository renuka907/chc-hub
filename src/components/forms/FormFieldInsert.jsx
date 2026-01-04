import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PenLine, Calendar, CheckSquare, Type, User, Hash } from "lucide-react";

export default function FormFieldInsert({ onInsert }) {
    const fields = [
        { type: 'signature', label: 'Signature Line', icon: PenLine, html: '<p><br/></p><p style="border-bottom: 2px solid black; width: 300px; display: inline-block;"></p><p style="font-size: 11pt; margin-top: 5px;"><strong>Signature:</strong> _____________________ <strong>Date:</strong> _____________________</p>' },
        { type: 'date', label: 'Date Field', icon: Calendar, html: '<p><strong>Date:</strong> _____________________</p>' },
        { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, html: '<p>☐ <span style="margin-left: 10px;">Option text here</span></p>' },
        { type: 'text', label: 'Text Field', icon: Type, html: '<p>_________________________________________</p>' },
        { type: 'name', label: 'Name Field', icon: User, html: '<p><strong>Patient Name:</strong> _________________________________________</p>' },
        { type: 'number', label: 'Number Field', icon: Hash, html: '<p><strong>Phone:</strong> (___) ___-____</p>' },
    ];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-purple-300 hover:bg-purple-50">
                    <PenLine className="w-4 h-4 mr-2" />
                    Insert Form Field
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm mb-3">Insert Form Field</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {fields.map((field) => {
                            const Icon = field.icon;
                            return (
                                <Button
                                    key={field.type}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onInsert(field.html)}
                                    className="justify-start hover:bg-purple-50 hover:border-purple-300"
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {field.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}