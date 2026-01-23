import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Syringe, Clock, LogIn, LogOut, Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function StaffCheckInPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [showCheckInDialog, setShowCheckInDialog] = useState(false);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [editingCheckIn, setEditingCheckIn] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [checkInForm, setCheckInForm] = useState({ location_id: "", area: "Front Desk", notes: "" });
    const [scheduleForm, setScheduleForm] = useState({ staff_email: "", staff_name: "", location_id: "", date: "", shift: "All Day", notes: "" });
    const queryClient = useQueryClient();

    React.useEffect(() => {
        base44.auth.me().then(user => {
            setCurrentUser(user);
            setCheckInForm(prev => ({ ...prev, staff_email: user.email, staff_name: user.full_name || user.email }));
        }).catch(() => {});
    }, []);

    const today = new Date().toISOString().split('T')[0];

    const { data: checkIns = [] } = useQuery({
        queryKey: ['checkIns', today],
        queryFn: () => base44.entities.StaffCheckIn.filter({ date: today }),
        refetchInterval: 30000,
    });

    const { data: schedules = [] } = useQuery({
        queryKey: ['injectionSchedules', today],
        queryFn: () => base44.entities.InjectionSchedule.filter({ date: today }),
        refetchInterval: 30000,
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const checkInMutation = useMutation({
        mutationFn: (data) => base44.entities.StaffCheckIn.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checkIns'] });
            setShowCheckInDialog(false);
            resetCheckInForm();
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: (id) => base44.entities.StaffCheckIn.update(id, { check_out_time: new Date().toISOString() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checkIns'] });
        },
    });

    const createScheduleMutation = useMutation({
        mutationFn: (data) => editingSchedule 
            ? base44.entities.InjectionSchedule.update(editingSchedule.id, data)
            : base44.entities.InjectionSchedule.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['injectionSchedules'] });
            setShowScheduleDialog(false);
            setEditingSchedule(null);
            resetScheduleForm();
        },
    });

    const deleteScheduleMutation = useMutation({
        mutationFn: (id) => base44.entities.InjectionSchedule.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['injectionSchedules'] });
            setDeleteConfirm(null);
        },
    });

    const resetCheckInForm = () => {
        setCheckInForm({
            staff_email: currentUser?.email || "",
            staff_name: currentUser?.full_name || currentUser?.email || "",
            location_id: "",
            area: "Front Desk",
            notes: ""
        });
    };

    const resetScheduleForm = () => {
        setScheduleForm({ staff_email: "", staff_name: "", location_id: "", date: today, shift: "All Day", notes: "" });
    };

    const handleCheckIn = () => {
        checkInMutation.mutate({
            ...checkInForm,
            staff_email: currentUser.email,
            staff_name: currentUser.full_name || currentUser.email,
            check_in_time: new Date().toISOString(),
            date: today,
        });
    };

    const handleScheduleSubmit = () => {
        createScheduleMutation.mutate(scheduleForm);
    };

    const getLocationName = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        return location?.name || "Unknown Location";
    };

    const activeCheckIns = checkIns.filter(c => !c.check_out_time);
    const canManageSchedule = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    // Group check-ins by location and area
    const checkInsByLocation = {};
    activeCheckIns.forEach(checkIn => {
        const locName = getLocationName(checkIn.location_id);
        if (!checkInsByLocation[locName]) {
            checkInsByLocation[locName] = {};
        }
        if (!checkInsByLocation[locName][checkIn.area]) {
            checkInsByLocation[locName][checkIn.area] = [];
        }
        checkInsByLocation[locName][checkIn.area].push(checkIn);
    });

    // Group schedules by location
    const schedulesByLocation = {};
    schedules.forEach(schedule => {
        const locName = getLocationName(schedule.location_id);
        if (!schedulesByLocation[locName]) {
            schedulesByLocation[locName] = [];
        }
        schedulesByLocation[locName].push(schedule);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Staff Check-In</h1>
                            <p className="text-gray-600">See who's where and who's on injections today</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canManageSchedule && (
                            <Button onClick={() => { setEditingSchedule(null); resetScheduleForm(); setShowScheduleDialog(true); }} className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Schedule
                            </Button>
                        )}
                        <Button onClick={() => setShowCheckInDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                            <LogIn className="w-4 h-4 mr-2" />
                            Check In
                        </Button>
                    </div>
                </div>
            </div>

            {/* Current Check-Ins */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Currently Checked In</h2>
                </div>

                {Object.keys(checkInsByLocation).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No staff checked in yet</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(checkInsByLocation).map(([locationName, areas]) => (
                            <div key={locationName}>
                                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl p-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        <h3 className="text-xl font-bold">{locationName}</h3>
                                        <Badge className="bg-white/20 text-white border-0 ml-2">
                                            {Object.values(areas).flat().length} staff
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(areas).map(([area, staffList]) => (
                                        <Card key={area} className="border-l-4 border-l-blue-500">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-600" />
                                                    {area}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {staffList.map(checkIn => (
                                                    <div key={checkIn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{checkIn.staff_name}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(checkIn.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            {checkIn.notes && (
                                                                <div className="text-xs text-gray-600 mt-1">{checkIn.notes}</div>
                                                            )}
                                                        </div>
                                                        {checkIn.staff_email === currentUser?.email && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => checkOutMutation.mutate(checkIn.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <LogOut className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Today's Injection Schedule */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Syringe className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Today's Injection Schedule</h2>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Badge>
                </div>

                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No injection schedule for today</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(schedulesByLocation).map(([locationName, scheduleList]) => (
                            <div key={locationName}>
                                <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl p-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        <h3 className="text-xl font-bold">{locationName}</h3>
                                        <Badge className="bg-white/20 text-white border-0 ml-2">
                                            {scheduleList.length} scheduled
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {scheduleList.map(schedule => (
                                        <Card key={schedule.id} className="border-l-4 border-l-purple-500">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-bold text-lg text-gray-900">{schedule.staff_name}</div>
                                                        <Badge className="bg-purple-100 text-purple-800 mt-1">
                                                            {schedule.shift}
                                                        </Badge>
                                                        {schedule.notes && (
                                                            <p className="text-sm text-gray-600 mt-2">{schedule.notes}</p>
                                                        )}
                                                    </div>
                                                    {canManageSchedule && (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setEditingSchedule(schedule);
                                                                    setScheduleForm(schedule);
                                                                    setShowScheduleDialog(true);
                                                                }}
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() => setDeleteConfirm(schedule)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Check-In Dialog */}
            <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Check In</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Location</Label>
                            <Select value={checkInForm.location_id} onValueChange={(value) => setCheckInForm({ ...checkInForm, location_id: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.filter(loc => loc.status === 'active').map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Area</Label>
                            <Select value={checkInForm.area} onValueChange={(value) => setCheckInForm({ ...checkInForm, area: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Front Desk">Front Desk</SelectItem>
                                    <SelectItem value="Back Office">Back Office</SelectItem>
                                    <SelectItem value="Lab">Lab</SelectItem>
                                    <SelectItem value="Treatment Room">Treatment Room</SelectItem>
                                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Notes (Optional)</Label>
                            <Input
                                value={checkInForm.notes}
                                onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                                placeholder="Any notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCheckInDialog(false)}>Cancel</Button>
                        <Button onClick={handleCheckIn} disabled={!checkInForm.location_id || checkInMutation.isPending} className="text-black">
                            Check In
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={(open) => {
                setShowScheduleDialog(open);
                if (!open) {
                    setEditingSchedule(null);
                    resetScheduleForm();
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add Injection Schedule'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Staff Name</Label>
                            <Input
                                value={scheduleForm.staff_name}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, staff_name: e.target.value })}
                                placeholder="Staff member name"
                            />
                        </div>
                        <div>
                            <Label>Staff Email</Label>
                            <Input
                                type="email"
                                value={scheduleForm.staff_email}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, staff_email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Select value={scheduleForm.location_id} onValueChange={(value) => setScheduleForm({ ...scheduleForm, location_id: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.filter(loc => loc.status === 'active').map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={scheduleForm.date}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Shift</Label>
                            <Select value={scheduleForm.shift} onValueChange={(value) => setScheduleForm({ ...scheduleForm, shift: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Morning">Morning</SelectItem>
                                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                                    <SelectItem value="Evening">Evening</SelectItem>
                                    <SelectItem value="All Day">All Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                value={scheduleForm.notes}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                                placeholder="Special instructions..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowScheduleDialog(false); setEditingSchedule(null); resetScheduleForm(); }}>Cancel</Button>
                        <Button 
                            onClick={handleScheduleSubmit} 
                            disabled={!scheduleForm.staff_name || !scheduleForm.staff_email || !scheduleForm.location_id || !scheduleForm.date || createScheduleMutation.isPending}
                        >
                            {editingSchedule ? 'Update' : 'Add'} Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove {deleteConfirm?.staff_name} from the injection schedule?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteScheduleMutation.mutate(deleteConfirm.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}