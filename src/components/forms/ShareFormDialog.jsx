import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Share2, Loader2, Eye, EyeOff, Clock, Lock, Trash2, CheckCircle2, ShieldX } from "lucide-react";
import { toast } from "sonner";

export default function ShareFormDialog({ open, onOpenChange, entityType, entityId, formName }) {
    const [hasExpiration, setHasExpiration] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [expirationDate, setExpirationDate] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [copiedToken, setCopiedToken] = useState(null);
    const [revokeDialogLink, setRevokeDialogLink] = useState(null);
    const queryClient = useQueryClient();

    const { data: sharedLinks = [], isLoading } = useQuery({
        queryKey: ['sharedLinks', entityType, entityId],
        queryFn: async () => {
            const allLinks = await base44.entities.SharedFormLink.list();
            return allLinks.filter(link => link.entity_type === entityType && link.entity_id === entityId);
        },
        enabled: open
    });

    const createLinkMutation = useMutation({
        mutationFn: async () => {
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const linkData = {
                entity_type: entityType,
                entity_id: entityId,
                share_token: token,
                expires_at: hasExpiration && expirationDate ? new Date(expirationDate).toISOString() : null,
                password: hasPassword && password ? password : null,
                view_count: 0,
                is_active: true
            };
            return await base44.entities.SharedFormLink.create(linkData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sharedLinks'] });
            setHasExpiration(false);
            setHasPassword(false);
            setExpirationDate("");
            setPassword("");
            toast.success("Share link created successfully");
        }
    });

    const revokeLinkMutation = useMutation({
        mutationFn: async (id) => {
            return await base44.entities.SharedFormLink.update(id, { is_active: false });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sharedLinks'] });
            setRevokeDialogLink(null);
            toast.success("Link revoked - access disabled");
        }
    });

    const deleteLinkMutation = useMutation({
        mutationFn: async (id) => {
            return await base44.entities.SharedFormLink.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sharedLinks'] });
            toast.success("Link deleted");
        }
    });

    const copyToClipboard = (token) => {
        const url = `${window.location.origin}/ViewSharedForm?token=${token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const isExpired = (expiresAt) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Share2 className="w-4 h-4" />
                        Share "{formName}"
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Create New Link Section */}
                    <Card>
                        <CardContent className="pt-4 space-y-3">
                            <h3 className="font-semibold text-base">Create New Share Link</h3>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <Label htmlFor="expiration">Set Expiration Date</Label>
                                </div>
                                <Switch
                                    id="expiration"
                                    checked={hasExpiration}
                                    onCheckedChange={setHasExpiration}
                                />
                            </div>

                            {hasExpiration && (
                                <div className="space-y-2">
                                    <Label htmlFor="expiration-date">Expires On</Label>
                                    <Input
                                        id="expiration-date"
                                        type="datetime-local"
                                        value={expirationDate}
                                        onChange={(e) => setExpirationDate(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-gray-500" />
                                    <Label htmlFor="password-protection">Password Protection</Label>
                                </div>
                                <Switch
                                    id="password-protection"
                                    checked={hasPassword}
                                    onCheckedChange={setHasPassword}
                                />
                            </div>

                            {hasPassword && (
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <Eye className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={() => createLinkMutation.mutate()}
                                disabled={createLinkMutation.isPending || (hasPassword && !password) || (hasExpiration && !expirationDate)}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {createLinkMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Generate Share Link
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Existing Links Section */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-base">Active Share Links</h3>
                        
                        {isLoading ? (
                            <div className="text-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : sharedLinks.length === 0 ? (
                            <Card>
                                <CardContent className="py-4 text-center text-sm text-gray-500">
                                    No share links created yet
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {sharedLinks.map((link) => {
                                    const expired = isExpired(link.expires_at);
                                    const url = `${window.location.origin}/ViewSharedForm?token=${link.share_token}`;
                                    
                                    return (
                                        <Card key={link.id} className={!link.is_active || expired ? "opacity-50" : ""}>
                                            <CardContent className="pt-3 pb-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate">
                                                                {url}
                                                            </code>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => copyToClipboard(link.share_token)}
                                                                className="flex-shrink-0"
                                                            >
                                                                {copiedToken === link.share_token ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <div className="flex gap-3 text-xs text-gray-600">
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />
                                                                {link.view_count} views
                                                            </span>
                                                            {link.password && (
                                                                <span className="flex items-center gap-1 text-amber-600">
                                                                    <Lock className="w-3 h-3" />
                                                                    Password protected
                                                                </span>
                                                            )}
                                                            {link.expires_at && (
                                                                <span className={`flex items-center gap-1 ${expired ? 'text-red-600' : ''}`}>
                                                                    <Clock className="w-3 h-3" />
                                                                    {expired ? 'Expired' : `Expires ${new Date(link.expires_at).toLocaleString()}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        {link.is_active && !expired && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setRevokeDialogLink(link)}
                                                                className="text-orange-600 hover:bg-orange-50 border-orange-300"
                                                            >
                                                                <ShieldX className="w-4 h-4 mr-1" />
                                                                Revoke
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => deleteLinkMutation.mutate(link.id)}
                                                            disabled={deleteLinkMutation.isPending}
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
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

            <AlertDialog open={!!revokeDialogLink} onOpenChange={(open) => !open && setRevokeDialogLink(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Share Link Access?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will immediately disable this share link. Anyone with this link will no longer be able to access the form. This action can be reversed by deleting and creating a new link.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => revokeLinkMutation.mutate(revokeDialogLink?.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Revoke Access
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}