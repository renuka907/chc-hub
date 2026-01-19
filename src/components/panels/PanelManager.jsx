import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function PanelManager({ isOpen, onClose }) {
    const [editingPanel, setEditingPanel] = React.useState(null);
    const [formData, setFormData] = React.useState({ panel_name: "", description: "" });
    const queryClient = useQueryClient();

    const { data: panels = [] } = useQuery({
        queryKey: ['panels'],
        queryFn: () => base44.entities.Panel.list('-updated_date'),
    });

    const { data: allTests = [] } = useQuery({
        queryKey: ['labTests'],
        queryFn: () => base44.entities.LabTestInfo.list(),
    });

    const createPanelMutation = useMutation({
        mutationFn: (data) => base44.entities.Panel.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panels'] });
            setFormData({ panel_name: "", description: "" });
            toast.success("Panel created");
        }
    });

    const updatePanelMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Panel.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panels'] });
            setEditingPanel(null);
            setFormData({ panel_name: "", description: "" });
            toast.success("Panel updated");
        }
    });

    const deletePanelMutation = useMutation({
        mutationFn: (id) => base44.entities.Panel.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panels'] });
            toast.success("Panel deleted");
        }
    });

    const handleSave = () => {
        if (!formData.panel_name.trim()) {
            toast.error("Panel name is required");
            return;
        }

        if (editingPanel) {
            updatePanelMutation.mutate({ id: editingPanel.id, data: formData });
        } else {
            createPanelMutation.mutate(formData);
        }
    };

    const handleEdit = (panel) => {
        setEditingPanel(panel);
        setFormData({ 
            panel_name: panel.panel_name, 
            description: panel.description || "" 
        });
    };

    const handleDelete = (panelId) => {
        if (confirm("Delete this panel?")) {
            deletePanelMutation.mutate(panelId);
        }
    };

    const handleClose = () => {
        setEditingPanel(null);
        setFormData({ panel_name: "", description: "" });
        onClose();
    };

    const getTestsInPanel = (panelId) => {
        return allTests.filter(t => t.panel_id === panelId).length;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Panels</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Create/Edit Form */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {editingPanel ? "Edit Panel" : "Create New Panel"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Panel Name</label>
                                <Input
                                    value={formData.panel_name}
                                    onChange={(e) => setFormData({ ...formData, panel_name: e.target.value })}
                                    placeholder="e.g., Annual Physical, Hormone Panel"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                    rows={2}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={createPanelMutation.isPending || updatePanelMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {editingPanel ? "Update" : "Create"}
                                </Button>
                                {editingPanel && (
                                    <Button
                                        onClick={() => {
                                            setEditingPanel(null);
                                            setFormData({ panel_name: "", description: "" });
                                        }}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Panels List */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">All Panels ({panels.length})</h3>
                        {panels.length === 0 ? (
                            <p className="text-sm text-gray-500">No panels created yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {panels.map(panel => {
                                    const testCount = getTestsInPanel(panel.id);
                                    return (
                                        <Card key={panel.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="pt-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900">{panel.panel_name}</h4>
                                                        {panel.description && (
                                                            <p className="text-sm text-gray-600 mt-1">{panel.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline">
                                                                {testCount} test{testCount !== 1 ? 's' : ''}
                                                            </Badge>
                                                            <Badge variant={panel.status === 'active' ? 'default' : 'outline'}>
                                                                {panel.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(panel)}
                                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Edit panel"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(panel.id)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete panel"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}