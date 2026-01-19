import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all reminders with recurrence
        const reminders = await base44.asServiceRole.entities.Reminder.list('', 1000);
        const recurringReminders = reminders.filter(r => r.recurrence_type && r.recurrence_type !== 'none');

        let generatedCount = 0;

        for (const reminder of recurringReminders) {
            if (!reminder.due_date) continue;

            const lastDueDate = new Date(reminder.due_date);
            const now = new Date();
            let nextDueDate = new Date(lastDueDate);
            const interval = reminder.recurrence_interval || 1;

            // Calculate next occurrence
            switch (reminder.recurrence_type) {
                case 'daily':
                    nextDueDate.setDate(nextDueDate.getDate() + interval);
                    break;
                case 'weekly':
                    nextDueDate.setDate(nextDueDate.getDate() + (7 * interval));
                    break;
                case 'monthly':
                    nextDueDate.setMonth(nextDueDate.getMonth() + interval);
                    break;
                case 'annually':
                    nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
                    break;
            }

            // If next occurrence is in the past, keep generating until we get one in the future
            while (nextDueDate <= now) {
                switch (reminder.recurrence_type) {
                    case 'daily':
                        nextDueDate.setDate(nextDueDate.getDate() + interval);
                        break;
                    case 'weekly':
                        nextDueDate.setDate(nextDueDate.getDate() + (7 * interval));
                        break;
                    case 'monthly':
                        nextDueDate.setMonth(nextDueDate.getMonth() + interval);
                        break;
                    case 'annually':
                        nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
                        break;
                }
            }

            // Create a new reminder instance if it doesn't exist
            try {
                await base44.asServiceRole.entities.Reminder.create({
                    title: reminder.title,
                    description: reminder.description,
                    due_date: nextDueDate.toISOString(),
                    priority: reminder.priority,
                    assigned_to: reminder.assigned_to,
                    recurrence_type: reminder.recurrence_type,
                    recurrence_interval: reminder.recurrence_interval,
                    next_trigger_at: nextDueDate.toISOString(),
                    completed: false
                });
                generatedCount++;
            } catch (e) {
                // Reminder instance may already exist, continue
            }
        }

        return Response.json({ 
            success: true, 
            generatedReminders: generatedCount,
            message: `Generated ${generatedCount} recurring reminder instances`
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});