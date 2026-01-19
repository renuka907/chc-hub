import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function addWeeks(date, weeks) {
  return addDays(date, 7 * weeks);
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const m = d.getMonth();
  d.setMonth(m + months);
  return d;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();

    // Get open reminders (service role for scheduled execution)
    const reminders = await base44.asServiceRole.entities.Reminder.filter({ completed: false }, undefined, 500);

    let checked = 0;
    let notified = 0;

    for (const r of reminders) {
      checked += 1;
      const triggerISO = r.next_trigger_at || r.due_date;
      if (!triggerISO) continue;

      const to = r.assigned_to || r.created_by;
      if (!to) continue;

      // Get user's notification preferences
      const prefs = await base44.asServiceRole.entities.NotificationPreferences.filter(
        { user_email: to },
        undefined,
        1
      );

      const userPrefs = prefs[0] || { advance_hours: 24, notify_on_due: true, notify_on_overdue: true, enabled: true };

      // Skip if notifications disabled
      if (!userPrefs.enabled) continue;

      const triggerAt = new Date(triggerISO);
      const lastNotified = r.last_notified_at ? new Date(r.last_notified_at) : null;
      const isOverdue = triggerAt < now;

      // Determine if we should notify
      let shouldNotify = false;
      let notificationType = '';

      if (isOverdue) {
        // Check if overdue notification should be sent
        if (userPrefs.notify_on_overdue && (!lastNotified || lastNotified < triggerAt)) {
          shouldNotify = true;
          notificationType = 'Overdue';
        }
      } else {
        // Check if advance notification should be sent
        const advanceTime = new Date(triggerAt.getTime() - userPrefs.advance_hours * 60 * 60 * 1000);
        if (now >= advanceTime && (!lastNotified || lastNotified < advanceTime)) {
          shouldNotify = true;
          notificationType = 'Due Soon';
        }
      }

      if (shouldNotify && userPrefs.notify_on_due) {
        const subject = `[${notificationType}] ${r.title}`;
        const dueStr = triggerAt.toLocaleString();
        const body = `Hello,\n\nThis is a reminder notification: ${r.title}\n${r.description ? `\nDetails: ${r.description}` : ''}\n\nDue: ${dueStr}\n${isOverdue ? '(OVERDUE)' : `(Notification sent ${userPrefs.advance_hours} hours in advance)`}\n\n— CHC Hub`;

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to,
            subject,
            body,
            from_name: 'CHC Hub Reminders'
          });
          notified += 1;
        } catch (_e) {
          // continue to compute next even if email fails
        }
      }

      // Compute next occurrence
      let next = null;
      const interval = r.recurrence_interval || 1;
      if (r.recurrence_type === 'daily') {
        next = addDays(triggerAt, interval);
      } else if (r.recurrence_type === 'weekly') {
        next = addWeeks(triggerAt, interval);
      } else if (r.recurrence_type === 'monthly') {
        next = addMonths(triggerAt, interval);
      }

      await base44.asServiceRole.entities.Reminder.update(r.id, {
        last_notified_at: now.toISOString(),
        next_trigger_at: next ? next.toISOString() : null,
      });
    }

    return Response.json({ status: 'ok', checked, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});