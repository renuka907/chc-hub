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

      const triggerAt = new Date(triggerISO);
      const lastNotified = r.last_notified_at ? new Date(r.last_notified_at) : null;

      if (triggerAt <= now && (!lastNotified || lastNotified < triggerAt)) {
        const to = r.assigned_to || r.created_by;
        if (!to) continue;

        const subject = `Reminder Due: ${r.title}`;
        const dueStr = triggerAt.toLocaleString();
        const body = `Hello,\n\nThis is a reminder: ${r.title}$${r.description ? `\n\nDetails: ${r.description}` : ''}\nDue: ${dueStr}\n\n— CHC Hub`;

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
    }

    return Response.json({ status: 'ok', checked, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});