import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/SearchBar";
import UsageRecorder from "../components/inventory/UsageRecorder";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, TrendingUp, Zap } from "lucide-react";

export default function InventoryUsageTracking() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedTimeframe, setSelectedTimeframe] = useState("7"); // days
    const [showRecorder, setShowRecorder] = useState(false);
    const [currentUser, setCurrentUser] = React.useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
    }, []);

    const { data: usageLogs = [] } = useQuery({
        queryKey: ['usageLogs'],
        queryFn: () => base44.entities.UsageLog.list('-usage_date', 500),
        refetchInterval: 30000,
    });

    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: () => base44.entities.InventoryItem.list('', 500),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const canRecord = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'staff';

    // Filter logs based on timeframe and location
    const daysBack = parseInt(selectedTimeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const filteredLogs = usageLogs.filter(log => {
        const logDate = new Date(log.usage_date);
        const matchesDate = logDate >= cutoffDate;
        const matchesLocation = selectedLocation === "all" || log.location_id === selectedLocation;
        const matchesSearch = !searchQuery || log.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesLocation && matchesSearch;
    });

    // Calculate top items used
    const itemUsage = {};
    filteredLogs.forEach(log => {
        if (!itemUsage[log.item_name]) {
            itemUsage[log.item_name] = 0;
        }
        itemUsage[log.item_name] += log.quantity_used;
    });

    const topItems = Object.entries(itemUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, total]) => ({ name, total }));

    // Usage by reason
    const usageByReason = {};
    filteredLogs.forEach(log => {
        if (!usageByReason[log.usage_reason]) {
            usageByReason[log.usage_reason] = 0;
        }
        usageByReason[log.usage_reason] += 1;
    });

    const reasonData = Object.entries(usageByReason).map(([reason, count]) => ({
        name: reason.replace('_', ' ').toUpperCase(),
        value: count
    }));

    // Waste analysis
    const wasteItems = filteredLogs
        .filter(log => log.usage_reason === 'waste' || log.usage_reason === 'expired')
        .reduce((acc, log) => {
            const item = acc.find(i => i.name === log.item_name);
            if (item) {
                item.quantity += log.quantity_used;
            } else {
                acc.push({ name: log.item_name, quantity: log.quantity_used });
            }
            return acc;
        }, [])
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    // Daily usage trend
    const dailyUsage = {};
    filteredLogs.forEach(log => {
        if (!dailyUsage[log.usage_date]) {
            dailyUsage[log.usage_date] = 0;
        }
        dailyUsage[log.usage_date] += 1;
    });

    const trendData = Object.entries(dailyUsage)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count
        }));

    const COLORS = ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#ef4444'];

    const getLocationName = (locationId) => {
        return locations.find(loc => loc.id === locationId)?.name || "N/A";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
                            <p className="text-gray-600">Track item consumption and usage patterns</p>
                        </div>
                    </div>
                    {canRecord && (
                        <Button
                            onClick={() => setShowRecorder(true)}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Record Usage
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-md space-y-3">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search items..."
                        />
                    </div>
                    
                    <select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="14">Last 14 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>

                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium"
                    >
                        <option value="all">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Usage Records</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
                            </div>
                            <Zap className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div>
                            <p className="text-sm text-gray-600">Items Used in Period</p>
                            <p className="text-2xl font-bold text-gray-900">{Object.keys(itemUsage).length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div>
                            <p className="text-sm text-gray-600">Waste/Expired Records</p>
                            <p className="text-2xl font-bold text-red-600">
                                {filteredLogs.filter(l => l.usage_reason === 'waste' || l.usage_reason === 'expired').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Items Used */}
                {topItems.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Items Used</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topItems}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#f97316" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Usage by Reason */}
                {reasonData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={reasonData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {reasonData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Usage Trend */}
            {trendData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Usage Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8b5cf6" name="Usage Records" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Waste Analysis */}
            {wasteItems.length > 0 && (
                <Card className="border-2 border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700">⚠️ Waste & Expired Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {wasteItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg">
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                    <span className="text-red-600 font-bold">{item.quantity} units wasted</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Usage */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Usage Records</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-2 font-medium">Item</th>
                                    <th className="text-left py-2 px-2 font-medium">Location</th>
                                    <th className="text-left py-2 px-2 font-medium">Quantity</th>
                                    <th className="text-left py-2 px-2 font-medium">Reason</th>
                                    <th className="text-left py-2 px-2 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.slice(0, 10).map((log, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-2 text-gray-900 font-medium">{log.item_name}</td>
                                        <td className="py-2 px-2">{getLocationName(log.location_id)}</td>
                                        <td className="py-2 px-2">{log.quantity_used} {log.unit}</td>
                                        <td className="py-2 px-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                log.usage_reason === 'procedure' ? 'bg-blue-100 text-blue-800' :
                                                log.usage_reason === 'waste' ? 'bg-red-100 text-red-800' :
                                                log.usage_reason === 'expired' ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {log.usage_reason.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2">{new Date(log.usage_date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <UsageRecorder open={showRecorder} onOpenChange={setShowRecorder} onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['usageLogs'] });
            }} />
        </div>
    );
}