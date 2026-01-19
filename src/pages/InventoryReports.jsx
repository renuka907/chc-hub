import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReportGenerator from '../components/inventory/ReportGenerator';
import { BarChart3, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

export default function InventoryReports() {
    const [currentUser, setCurrentUser] = useState(null);

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
    }, []);

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: () => base44.entities.InventoryItem.list('-updated_date', 500),
        refetchInterval: 30000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Calculate metrics
    const lowStockCount = inventoryItems.filter(item => 
        item.quantity <= item.low_stock_threshold && item.status === 'active'
    ).length;

    const expiringCount = inventoryItems.filter(item => {
        if (!item.expiry_date || item.status !== 'active') return false;
        const today = new Date();
        const expiry = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    const totalValue = inventoryItems
        .filter(item => item.status === 'active')
        .reduce((sum, item) => sum + ((item.cost_per_unit || 0) * item.quantity), 0);

    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    if (!canEdit) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-md text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">You don't have permission to view reports.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inventory Reports</h1>
                        <p className="text-gray-600">Generate and export custom inventory reports</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock Items</p>
                                <p className="text-3xl font-bold text-red-600">{lowStockCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-3xl font-bold text-amber-600">{expiringCount}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Inventory Value</p>
                                <p className="text-3xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Generator */}
            <ReportGenerator locations={locations} />
        </div>
    );
}