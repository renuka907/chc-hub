import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function NotificationPreferencesDialog({ open, onOpenChange }) {
  const [form, setForm] = React.useState({
    advance_hours: 24,
    notify_on_due: true,
    notify_on_overdue: true,
    enabled: true,
  });
  const [saving, setSaving] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: preferences } = useQuery({
    queryKey: ['notificationPreferences', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const prefs = await base44.entities.NotificationPreferences.filter(
        { user_email: currentUser.email },
        undefined,
        1
      );
      return prefs[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  React.useEffect(() => {
    if (preferences) {
      setForm({
        advance_hours: preferences.advance_hours || 24,
        notify_on_due: preferences.notify_on_due !== false,
        notify_on_overdue: preferences.notify_on_overdue !== false,
        enabled: preferences.enabled !== false,
      });
    }
  }, [preferences?.id, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        user_email: currentUser.email,
        ...form,
      };

      if (preferences) {
        await base44.entities.NotificationPreferences.update(preferences.id, payload);
      } else {
        await base44.entities.NotificationPreferences.create(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Notification preferences saved');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={form.enabled}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))}
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              Enable notifications
            </Label>
          </div>

          <div>
            <Label htmlFor="advance">Hours before due date to notify</Label>
            <Input
              id="advance"
              type="number"
              min={0}
              max={168}
              step={1}
              value={form.advance_hours}
              onChange={(e) =>
                setForm((f) => ({ ...f, advance_hours: Math.max(0, parseInt(e.target.value || 0)) }))
              }
              className="mt-1"
              disabled={!form.enabled}
            />
            <p className="text-xs text-gray-500 mt-1">Enter 0 to only notify at due time</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify_due"
              checked={form.notify_on_due}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, notify_on_due: checked }))}
              disabled={!form.enabled}
            />
            <Label htmlFor="notify_due" className="cursor-pointer">
              Notify when reminder is due
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify_overdue"
              checked={form.notify_on_overdue}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, notify_on_overdue: checked }))}
              disabled={!form.enabled}
            />
            <Label htmlFor="notify_overdue" className="cursor-pointer">
              Notify if reminder becomes overdue
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}