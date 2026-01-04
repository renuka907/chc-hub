import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PenLine, Calendar, CheckSquare, Type, User, Hash } from "lucide-react";

export default function FormFieldInsert({ onInsert }) {
    const fields = [
        { type: 'patient-info', label: 'Patient Info', icon: User, html: `<div style="margin: 20px 0;">
<div class="field-row"><span class="field-label">Patient's Name:</span><span class="field-input">&nbsp;</span></div>
<div class="field-row"><span class="field-label">Previous Name:</span><span class="field-input">&nbsp;</span></div>
<div class="field-row" style="display: flex; gap: 40px;">
    <div style="flex: 1; display: flex;"><span class="field-label">Date of Birth:</span><span class="field-input">&nbsp;</span></div>
    <div style="flex: 1; display: flex;"><span class="field-label">Social Security Number:</span><span class="field-input">&nbsp;</span></div>
</div>
</div>` },
        { type: 'text-line', label: 'Text Line', icon: Type, html: '<div class="field-row" style="margin: 10px 0;"><span class="field-label">Label:</span><span class="field-input">&nbsp;</span></div>' },
        { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, html: '<p style="margin: 8px 0;"><input type="checkbox" /> <span>Option text here</span></p>' },
        { type: 'checkbox-line', label: 'Checkbox+Line', icon: CheckSquare, html: '<p style="margin: 8px 0;"><input type="checkbox" /> <span>Text:</span> <span class="field-input" style="display: inline-block; min-width: 400px;">&nbsp;</span></p>' },
        { type: 'signature', label: 'Signature', icon: PenLine, html: '<div class="field-row" style="margin: 20px 0; display: flex; gap: 40px;"><div style="flex: 1;"><span class="field-label">PATIENT SIGNATURE:</span><span class="field-input">&nbsp;</span></div><div style="flex: 1;"><span class="field-label">DATE SIGNED:</span><span class="field-input">&nbsp;</span></div></div>' },
        { type: 'provider-info', label: 'Provider Info', icon: User, html: `<div style="margin: 15px 0;">
<div class="field-row"><span class="field-label">Name:</span><span class="field-input">&nbsp;</span></div>
<div style="text-align: center; font-size: 9pt; font-style: italic; margin: 2px 0;">Physician, Hospital or Practice Name</div>
<div class="field-row" style="display: flex; gap: 40px;">
    <div style="flex: 1; display: flex;"><span class="field-label">Phone:</span><span class="field-input">&nbsp;</span></div>
    <div style="flex: 1; display: flex;"><span class="field-label">Fax:</span><span class="field-input">&nbsp;</span></div>
</div>
</div>` },
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