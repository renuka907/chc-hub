import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock, Bell, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Profile form state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [passwordError, setPasswordError] = useState("");

    // Notification preferences state
    const [enableEmailNotifications, setEnableEmailNotifications] = useState(true);
    const [enablePushNotifications, setEnablePushNotifications] = useState(false);
    const [notificationFrequency, setNotificationFrequency] = useState("immediate");

    useEffect(() => {
        base44.auth.me()
            .then(currentUser => {
                setUser(currentUser);
                setFullName(currentUser.full_name || "");
                setEmail(currentUser.email || "");
                setPhone(currentUser.phone || "");
                
                // Load notification preferences if stored
                if (currentUser.notification_preferences) {
                    const prefs = typeof currentUser.notification_preferences === 'string' 
                        ? JSON.parse(currentUser.notification_preferences) 
                        : currentUser.notification_preferences;
                    setEnableEmailNotifications(prefs.email !== false);
                    setEnablePushNotifications(prefs.push || false);
                    setNotificationFrequency(prefs.frequency || "immediate");
                }
                
                setLoading(false);
            })
            .catch(() => {
                base44.auth.redirectToLogin();
            });
    }, []);

    const handleProfileUpdate = async () => {
        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");
        
        try {
            await base44.auth.updateMe({
                full_name: fullName,
                phone: phone,
                notification_preferences: JSON.stringify({
                    email: enableEmailNotifications,
                    push: enablePushNotifications,
                    frequency: notificationFrequency
                })
            });
            
            setSuccessMessage("Profile updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            setErrorMessage(error?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError("");
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All password fields are required");
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }
        
        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters");
            return;
        }

        setSaving(true);
        try {
            await base44.auth.changePassword(currentPassword, newPassword);
            setSuccessMessage("Password changed successfully!");
            setShowPasswordDialog(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            setPasswordError(error?.message || "Failed to change password. Please check your current password.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account and preferences</p>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                </Alert>
            )}
            {errorMessage && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
                </Alert>
            )}

            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-purple-600" />
                        <CardTitle>Profile Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullname">Full Name</Label>
                            <Input
                                id="fullname"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                placeholder="your@email.com"
                                className="bg-gray-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Email cannot be changed</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleProfileUpdate}
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-purple-600" />
                        <CardTitle>Security</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-4">Manage your password and security settings</p>
                    <Button
                        variant="outline"
                        onClick={() => setShowPasswordDialog(true)}
                    >
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                    </Button>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-purple-600" />
                        <CardTitle>Notification Preferences</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-600">Receive updates via email</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={enableEmailNotifications}
                                onChange={(e) => setEnableEmailNotifications(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-600">Receive browser notifications</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={enablePushNotifications}
                                onChange={(e) => setEnablePushNotifications(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="frequency">Notification Frequency</Label>
                        <select
                            id="frequency"
                            value={notificationFrequency}
                            onChange={(e) => setNotificationFrequency(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily Digest</option>
                            <option value="weekly">Weekly Digest</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleProfileUpdate}
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Preferences"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Password Change Dialog */}
            <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change Password</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter your current password and new password
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-pass">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="current-pass"
                                    type={showPasswords.current ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                                <button
                                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                    className="absolute right-3 top-2.5 text-gray-500"
                                >
                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-pass">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-pass"
                                    type={showPasswords.new ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 8 characters)"
                                />
                                <button
                                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                    className="absolute right-3 top-2.5 text-gray-500"
                                >
                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-pass">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-pass"
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                    className="absolute right-3 top-2.5 text-gray-500"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {passwordError && (
                            <Alert className="bg-red-50 border-red-200">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700 text-sm">{passwordError}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePasswordChange}
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {saving ? "Changing..." : "Change Password"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}