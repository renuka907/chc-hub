import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function ReminderEditDialog({ open, onOpenChange, reminder, users = [], onSaved }) {
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date_local: "",
    recurrence_type: "none",
    recurrence_interval: 1,
    priority: "medium",
    hide_until_hours: 0
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (reminder) {
      const dueLocal = reminder.due_date ? toLocalInput(reminder.due_date) : "";
      const showAfterLocal = reminder.show_after ? toLocalInput(reminder.show_after) : "";
      const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;
      const showAfterDate = reminder.show_after ? new Date(reminder.show_after) : null;
      let hideUntilHours = 0;
      if (dueDate && showAfterDate) {
        hideUntilHours = Math.round((dueDate - showAfterDate) / (1000 * 60 * 60));
      }
      setForm({
        title: reminder.title || "",
        description: reminder.description || "",
        assigned_to: reminder.assigned_to || "",
        due_date_local: dueLocal,
        recurrence_type: reminder.recurrence_type || "none",
        recurrence_interval: reminder.recurrence_interval || 1,
        priority: reminder.priority || "medium",
        hide_until_hours: hideUntilHours
      });
    } else {
      // Reset form for new reminder
      setForm({
        title: "",
        description: "",
        assigned_to: "",
        due_date_local: "",
        recurrence_type: "none",
        recurrence_interval: 1,
        priority: "medium",
        hide_until_hours: 0
      });
    }
  }, [reminder?.id, open]);

  const toLocalInput = (iso) => {
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const MM = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
    } catch {
      return "";
    }
  };

  const toISO = (local) => (local ? new Date(local).toISOString() : undefined);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assigned_to: form.assigned_to || undefined,
        due_date: form.due_date_local ? toISO(form.due_date_local) : undefined,
        recurrence_type: form.recurrence_type,
        recurrence_interval: form.recurrence_interval,
        priority: form.priority,
      };
      if (payload.due_date) {
        payload.next_trigger_at = payload.due_date;
        if (form.hide_until_hours > 0) {
          const dueDate = new Date(payload.due_date);
          const showAfterDate = new Date(dueDate.getTime() - form.hide_until_hours * 60 * 60 * 1000);
          payload.show_after = showAfterDate.toISOString();
        } else {
          payload.show_after = undefined;
        }
      }
      if (reminder) {
        await base44.entities.Reminder.update(reminder.id, payload);
      } else {
        await base44.entities.Reminder.create(payload);
      }
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reminder ? "Edit Reminder" : "Create Reminder"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Reminder title"
                className="mt-1"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                placeholder="Reminder details"
                className="mt-1"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <Label>Assign to</Label>
              <Select
                value={form.assigned_to || ""}
                onValueChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Due date</Label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={form.due_date_local}
                onChange={(e) => setForm((f) => ({ ...f, due_date_local: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recurrence</Label>
                <Select
                  value={form.recurrence_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, recurrence_type: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Interval</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.recurrence_interval}
                  onChange={(e) => setForm((f) => ({ ...f, recurrence_interval: Math.max(1, parseInt(e.target.value || 1)) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hide until (hours before due date)</Label>
              <Input
                type="number"
                min={0}
                max={168}
                value={form.hide_until_hours}
                onChange={(e) => setForm((f) => ({ ...f, hide_until_hours: Math.max(0, parseInt(e.target.value || 0)) }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Reminder will only show this many hours before due date. Set to 0 to always show.</p>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}