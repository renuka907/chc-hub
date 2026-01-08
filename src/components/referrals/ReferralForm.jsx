import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ReferralForm({ open, onOpenChange, initialData, onSave }) {
  const [form, setForm] = React.useState({
    doctor_name: "",
    specialty: "",
    office_name: "",
    address: "",
    phone: "",
    notes: ""
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        doctor_name: initialData?.doctor_name || "",
        specialty: initialData?.specialty || "",
        office_name: initialData?.office_name || "",
        address: initialData?.address || "",
        phone: initialData?.phone || "",
        notes: initialData?.notes || ""
      });
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Referral" : "Add Referral"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doctor_name">Doctor Name</Label>
              <Input id="doctor_name" value={form.doctor_name} onChange={(e) => setForm(f => ({...f, doctor_name: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input id="specialty" value={form.specialty} onChange={(e) => setForm(f => ({...f, specialty: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office_name">Office Name</Label>
              <Input id="office_name" value={form.office_name} onChange={(e) => setForm(f => ({...f, office_name: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm(f => ({...f, address: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}