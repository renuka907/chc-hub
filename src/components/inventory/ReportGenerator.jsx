import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, BarChart3, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ReportGenerator({ locations }) {
    const [reportType, setReportType] = useState('inventory-levels');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [itemTypeFilter, setItemTypeFilter] = useState('all');
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const reportTypes = [
        { value: 'inventory-levels', label: 'Inventory Levels' },
        { value: 'low-stock', label: 'Low Stock Items' },
        { value: 'expiring', label: 'Expiring Items' },
        { value: 'stock-movement', label: 'Stock Movement' }
    ];

    const itemTypes = ['all', 'Product', 'Supply', 'Equipment', 'Medication'];

    const generateReport = async () => {
        setIsLoading(true);
        try {
            const response = await base44.functions.invoke('generateInventoryReport', {
                reportType,
                startDate: startDate || null,
                endDate: endDate || null,
                locationId: locationFilter,
                itemType: itemTypeFilter
            });
            setReportData(response.data.reportData);
        } catch (error) {
            console.error('Error generating report:', error);
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const exportToCSV = () => {
        if (reportData.length === 0) return;

        const headers = Object.keys(reportData[0]);
        const csvContent = [
            headers.join(','),
            ...reportData.map(row =>
                headers.map(header => {
                    const value = row[header];
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    };

    return (
        <div className="space-y-6">
            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Generate Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Item Type</label>
                            <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {itemTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type === 'all' ? 'All Types' : type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={generateReport}
                            disabled={isLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Generate Report
                                </>
                            )}
                        </Button>
                        {reportData.length > 0 && (
                            <Button
                                onClick={exportToCSV}
                                variant="outline"
                                className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Report Table */}
            {reportData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Report Results ({reportData.length} items)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-300">
                                        {Object.keys(reportData[0]).map(header => (
                                            <th
                                                key={header}
                                                className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                            {Object.values(row).map((value, cellIdx) => (
                                                <td key={cellIdx} className="py-3 px-4 text-gray-700">
                                                    {typeof value === 'number' ? value.toLocaleString() : value}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {reportData.length === 0 && !isLoading && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Generate a report to view data</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}