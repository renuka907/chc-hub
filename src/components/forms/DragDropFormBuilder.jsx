import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Plus, Trash2, Type, CheckSquare, Calendar, FileSignature, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FIELD_TYPES = [
    { type: 'heading', label: 'Heading', icon: Type },
    { type: 'text', label: 'Text Block', icon: Type },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'signature', label: 'Signature Line', icon: FileSignature },
    { type: 'date', label: 'Date Field', icon: Calendar },
    { type: 'list', label: 'Bullet List', icon: List },
];

export default function DragDropFormBuilder({ initialFields = [], onChange }) {
    const [fields, setFields] = useState(initialFields.length > 0 ? initialFields : [
        { id: '1', type: 'heading', content: 'Patient Consent Form', level: 1 }
    ]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        
        const items = Array.from(fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setFields(items);
        onChange?.(items);
    };

    const addField = (type) => {
        const newField = {
            id: Date.now().toString(),
            type,
            content: getDefaultContent(type)
        };
        const updated = [...fields, newField];
        setFields(updated);
        onChange?.(updated);
    };

    const updateField = (id, updates) => {
        const updated = fields.map(f => f.id === id ? { ...f, ...updates } : f);
        setFields(updated);
        onChange?.(updated);
    };

    const deleteField = (id) => {
        const updated = fields.filter(f => f.id !== id);
        setFields(updated);
        onChange?.(updated);
    };

    const getDefaultContent = (type) => {
        const defaults = {
            heading: 'Section Title',
            text: 'Enter your text here...',
            checkbox: 'I agree to the terms and conditions',
            signature: 'Patient Signature',
            date: 'Date',
            list: 'Item 1\nItem 2\nItem 3'
        };
        return defaults[type] || '';
    };

    const generateHTML = () => {
        return fields.map(field => {
            switch (field.type) {
                case 'heading':
                    const level = field.level || 2;
                    return `<h${level} style="font-weight: bold; margin: 16px 0 8px 0;">${field.content}</h${level}>`;
                case 'text':
                    return `<p style="margin: 8px 0;">${field.content}</p>`;
                case 'checkbox':
                    return `<div style="margin: 8px 0;"><input type="checkbox" style="margin-right: 8px;" />${field.content}</div>`;
                case 'signature':
                    return `<div style="margin: 20px 0;"><strong>${field.content}:</strong> <span style="display: inline-block; width: 300px; border-bottom: 1px solid black;"></span></div>`;
                case 'date':
                    return `<div style="margin: 20px 0;"><strong>${field.content}:</strong> <span style="display: inline-block; width: 200px; border-bottom: 1px solid black;"></span></div>`;
                case 'list':
                    const items = field.content.split('\n').filter(i => i.trim());
                    return `<ul style="margin: 8px 0; padding-left: 24px;">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
                default:
                    return '';
            }
        }).join('\n');
    };

    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Field Types</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                            <Button
                                key={type}
                                variant="outline"
                                size="sm"
                                onClick={() => addField(type)}
                                className="w-full justify-start"
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {label}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="col-span-9">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="form-fields">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-2 min-h-[400px] bg-gray-50 p-4 rounded-lg"
                            >
                                {fields.length === 0 && (
                                    <div className="text-center py-12 text-gray-400">
                                        Add fields from the left panel to build your form
                                    </div>
                                )}
                                {fields.map((field, index) => (
                                    <Draggable key={field.id} draggableId={field.id} index={index}>
                                        {(provided, snapshot) => (
                                            <Card
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex gap-3">
                                                        <div {...provided.dragHandleProps} className="pt-2">
                                                            <GripVertical className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            {field.type === 'heading' && (
                                                                <div className="space-y-2">
                                                                    <Select
                                                                        value={field.level?.toString() || '2'}
                                                                        onValueChange={(val) => updateField(field.id, { level: parseInt(val) })}
                                                                    >
                                                                        <SelectTrigger className="w-32">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="1">H1</SelectItem>
                                                                            <SelectItem value="2">H2</SelectItem>
                                                                            <SelectItem value="3">H3</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Input
                                                                        value={field.content}
                                                                        onChange={(e) => updateField(field.id, { content: e.target.value })}
                                                                        className="font-semibold"
                                                                    />
                                                                </div>
                                                            )}
                                                            {field.type === 'list' && (
                                                                <textarea
                                                                    value={field.content}
                                                                    onChange={(e) => updateField(field.id, { content: e.target.value })}
                                                                    className="w-full border rounded p-2 text-sm"
                                                                    rows={4}
                                                                    placeholder="One item per line"
                                                                />
                                                            )}
                                                            {!['heading', 'list'].includes(field.type) && (
                                                                <Input
                                                                    value={field.content}
                                                                    onChange={(e) => updateField(field.id, { content: e.target.value })}
                                                                />
                                                            )}
                                                            <div className="text-xs text-gray-500">
                                                                {FIELD_TYPES.find(t => t.type === field.type)?.label}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteField(field.id)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="mt-4">
                    <Button
                        onClick={() => {
                            const html = generateHTML();
                            onChange?.(fields, html);
                        }}
                        className="w-full"
                    >
                        Generate Form HTML
                    </Button>
                </div>
            </div>
        </div>
    );
}