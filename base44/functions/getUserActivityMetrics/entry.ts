import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Get all activities
        const activities = await base44.asServiceRole.entities.UserActivity.list('-timestamp', 1000);

        // Calculate metrics
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        // Active users (today)
        const activeUsersToday = new Set(
            activities
                .filter(a => new Date(a.timestamp) >= today)
                .map(a => a.user_email)
        ).size;

        // Active users (this week)
        const activeUsersThisWeek = new Set(
            activities
                .filter(a => new Date(a.timestamp) >= thisWeek)
                .map(a => a.user_email)
        ).size;

        // Most accessed pages
        const pageAccess = {};
        activities.forEach(a => {
            pageAccess[a.page_name] = (pageAccess[a.page_name] || 0) + 1;
        });

        const topPages = Object.entries(pageAccess)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([page, count]) => ({ page, count }));

        // Activity by user
        const userActivity = {};
        activities.forEach(a => {
            if (!userActivity[a.user_email]) {
                userActivity[a.user_email] = {
                    email: a.user_email,
                    full_name: a.user_full_name,
                    total_actions: 0,
                    last_seen: null,
                    actions_by_type: {}
                };
            }
            userActivity[a.user_email].total_actions++;
            userActivity[a.user_email].last_seen = a.timestamp;
            userActivity[a.user_email].actions_by_type[a.action_type] = 
                (userActivity[a.user_email].actions_by_type[a.action_type] || 0) + 1;
        });

        const userStats = Object.values(userActivity)
            .sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));

        // Action type distribution (today)
        const actionTypeToday = {};
        activities
            .filter(a => new Date(a.timestamp) >= today)
            .forEach(a => {
                actionTypeToday[a.action_type] = (actionTypeToday[a.action_type] || 0) + 1;
            });

        // Heatmap data (activity by hour for today)
        const heatmapData = Array(24).fill(0);
        activities
            .filter(a => new Date(a.timestamp) >= today)
            .forEach(a => {
                const hour = new Date(a.timestamp).getHours();
                heatmapData[hour]++;
            });

        return Response.json({
            summary: {
                activeUsersToday,
                activeUsersThisWeek,
                totalActivities: activities.length,
                totalUsers: Object.keys(userActivity).length
            },
            topPages,
            userStats: userStats.slice(0, 20),
            actionTypeDistribution: actionTypeToday,
            heatmapData,
            recentActivities: activities.slice(0, 50)
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});