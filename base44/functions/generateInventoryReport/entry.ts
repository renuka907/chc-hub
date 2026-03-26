import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { reportType, startDate, endDate, locationId, itemType } = body;

        // Fetch all inventory items
        const allItems = await base44.asServiceRole.entities.InventoryItem.list('-updated_date', 1000);
        
        // Fetch locations for name mapping
        const locations = await base44.asServiceRole.entities.ClinicLocation.list();
        const locationMap = {};
        locations.forEach(loc => {
            locationMap[loc.id] = loc.name;
        });

        let filteredItems = allItems;

        // Apply filters
        if (locationId && locationId !== 'all') {
            filteredItems = filteredItems.filter(item => item.location_id === locationId);
        }

        if (itemType && itemType !== 'all') {
            filteredItems = filteredItems.filter(item => item.item_type === itemType);
        }

        const startDateObj = startDate ? new Date(startDate) : null;
        const endDateObj = endDate ? new Date(endDate) : null;

        if (startDateObj || endDateObj) {
            filteredItems = filteredItems.filter(item => {
                const itemDate = new Date(item.updated_date);
                if (startDateObj && itemDate < startDateObj) return false;
                if (endDateObj && itemDate > endDateObj) return false;
                return true;
            });
        }

        let reportData = [];

        if (reportType === 'inventory-levels') {
            reportData = filteredItems.map(item => ({
                'Item Name': item.item_name,
                'SKU': item.sku || 'N/A',
                'Type': item.item_type,
                'Quantity': item.quantity,
                'Unit': item.unit,
                'Low Stock Threshold': item.low_stock_threshold,
                'Status': item.quantity <= item.low_stock_threshold ? 'Low Stock' : 'Normal',
                'Location': locationMap[item.location_id] || 'N/A',
                'Storage Location': item.storage_location || 'N/A',
                'Cost Per Unit': item.cost_per_unit || 0,
                'Total Value': (item.cost_per_unit || 0) * item.quantity,
                'Supplier': item.supplier || 'N/A',
                'Last Updated': new Date(item.updated_date).toLocaleDateString()
            }));
        } else if (reportType === 'low-stock') {
            reportData = filteredItems
                .filter(item => item.quantity <= item.low_stock_threshold && item.status === 'active')
                .map(item => ({
                    'Item Name': item.item_name,
                    'SKU': item.sku || 'N/A',
                    'Current Quantity': item.quantity,
                    'Low Stock Threshold': item.low_stock_threshold,
                    'Reorder Quantity': item.reorder_quantity || 'N/A',
                    'Type': item.item_type,
                    'Location': locationMap[item.location_id] || 'N/A',
                    'Supplier': item.supplier || 'N/A',
                    'Cost Per Unit': item.cost_per_unit || 0,
                    'Reorder Cost': (item.reorder_quantity || 0) * (item.cost_per_unit || 0),
                    'Last Updated': new Date(item.updated_date).toLocaleDateString()
                }))
                .sort((a, b) => a['Current Quantity'] - b['Current Quantity']);
        } else if (reportType === 'expiring') {
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

            reportData = filteredItems
                .filter(item => {
                    if (!item.expiry_date || item.status !== 'active') return false;
                    const expiryDate = new Date(item.expiry_date);
                    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
                })
                .map(item => ({
                    'Item Name': item.item_name,
                    'SKU': item.sku || 'N/A',
                    'Quantity': item.quantity,
                    'Expiry Date': new Date(item.expiry_date).toLocaleDateString(),
                    'Days Until Expiry': Math.ceil((new Date(item.expiry_date) - today) / (1000 * 60 * 60 * 24)),
                    'Type': item.item_type,
                    'Location': locationMap[item.location_id] || 'N/A',
                    'Storage Location': item.storage_location || 'N/A',
                    'Condition': item.item_condition,
                    'Notes': item.notes || 'N/A'
                }))
                .sort((a, b) => a['Days Until Expiry'] - b['Days Until Expiry']);
        } else if (reportType === 'stock-movement') {
            reportData = filteredItems
                .filter(item => item.updated_date)
                .map(item => ({
                    'Item Name': item.item_name,
                    'SKU': item.sku || 'N/A',
                    'Current Quantity': item.quantity,
                    'Type': item.item_type,
                    'Location': locationMap[item.location_id] || 'N/A',
                    'Last Updated': new Date(item.updated_date).toLocaleDateString(),
                    'Status': item.status,
                    'Cost Per Unit': item.cost_per_unit || 0,
                    'Current Value': (item.cost_per_unit || 0) * item.quantity
                }))
                .sort((a, b) => new Date(b['Last Updated']) - new Date(a['Last Updated']));
        }

        return Response.json({ reportData });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});