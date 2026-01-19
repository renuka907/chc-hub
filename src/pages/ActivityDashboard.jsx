import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, Activity, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricCard from "../components/activity/MetricCard";
import TopPagesChart from "../components/activity/TopPagesChart";
import ActivityHeatmap from "../components/activity/ActivityHeatmap";
import UserActivityTable from "../components/activity/UserActivityTable";

export default function ActivityDashboard() {
    const [currentUser, setCurrentUser] = React.useState(null);

    useEffect(() => {
        base44.auth.me()
            .then(user => {
                if (user?.role !== 'admin') {
                    window.location.href = '/';
                }
                setCurrentUser(user);
            })
            .catch(() => {
                base44.auth.redirectToLogin();
            });
    }, []);

    const { data: metrics, isLoading, error } = useQuery({
        queryKey: ['activityMetrics'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getUserActivityMetrics', {});
            return response.data;
        },
        refetchInterval: 60000,
        enabled: !!currentUser?.role === 'admin'
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                    <p className="text-red-700">Failed to load activity data. Please try again later.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">User Activity Dashboard</h1>
                <p className="text-gray-600 mt-2">Monitor user engagement and application usage</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Active Users (Today)"
                    value={metrics.summary.activeUsersToday}
                    subtitle="Users who accessed the app"
                    icon={Users}
                    color="purple"
                />
                <MetricCard
                    title="Active Users (Week)"
                    value={metrics.summary.activeUsersThisWeek}
                    subtitle="Users in the last 7 days"
                    icon={Users}
                    color="blue"
                />
                <MetricCard
                    title="Total Users"
                    value={metrics.summary.totalUsers}
                    subtitle="Registered users in system"
                    icon={Users}
                    color="green"
                />
                <MetricCard
                    title="Total Activities"
                    value={metrics.summary.totalActivities}
                    subtitle="All recorded actions"
                    icon={Activity}
                    color="pink"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TopPagesChart data={metrics.topPages} />
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Actions Today</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(metrics.actionTypeDistribution).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 capitalize">{type}</span>
                                        <span className="font-semibold text-purple-600">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Heatmap */}
            <ActivityHeatmap data={metrics.heatmapData} />

            {/* User Activity Table */}
            <UserActivityTable data={metrics.userStats} />
        </div>
    );
}