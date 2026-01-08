import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function parseExpiry(monthDotYear) {
  if (!monthDotYear) return null;
  // Support formats like '07.26', '11.2026', '07/26', '07-26'
  const cleaned = String(monthDotYear).replace(/\s+/g, '').replace(/\//g, '.').replace(/-/g, '.');
  const parts = cleaned.split('.');
  if (parts.length < 2) return null;
  const mm = parseInt(parts[0], 10);
  let yy = parts[1];
  let year = parseInt(yy, 10);
  if (yy.length === 2) {
    year = 2000 + year; // assume 20YY
  }
  if (!mm || !year) return null;
  const month = String(mm).padStart(2, '0');
  return `${year}-${month}-01`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Find Clinic Location: CHC Too
    const clinics = await base44.entities.ClinicLocation.filter({ name: 'CHC Too' });
    const clinic = clinics?.[0];
    if (!clinic) {
      return Response.json({ error: "ClinicLocation 'CHC Too' not found. Please create it first." }, { status: 404 });
    }

    const storageLocation = 'BLDG 200';

    const items = [];

    // Helper to push items
    const addItem = ({ item_name, quantity, supplier, notes, expiry, condition = 'unopened' }) => {
      if (!quantity || quantity <= 0) return;
      items.push({
        item_name,
        item_type: 'Product',
        item_condition: condition,
        quantity,
        unit: 'units',
        location_id: clinic.id,
        storage_location: storageLocation,
        supplier,
        notes: notes || undefined,
        expiry_date: expiry ? parseExpiry(expiry) : undefined,
        status: 'active',
      });
    };

    // PEELS - NOON
    addItem({ item_name: 'P-Peel 20', quantity: 1, supplier: 'NOON' });
    addItem({ item_name: 'G-Peel 50', quantity: 1, supplier: 'NOON' });
    addItem({ item_name: 'P-Peel 40', quantity: 1, supplier: 'NOON' });
    addItem({ item_name: 'G-Peel 30', quantity: 1, supplier: 'NOON' });

    // SKINCEUTICALS
    addItem({ item_name: 'Micropeel 20', quantity: 1, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Micropeel 30', quantity: 1, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Advanced Corrective', quantity: 1, supplier: 'SkinCeuticals' });

    // OBAGI
    addItem({ item_name: 'Blue Peel Radiance', quantity: 16, supplier: 'OBAGI' });
    addItem({ item_name: 'Blue Peel Radiance', quantity: 1, supplier: 'OBAGI', condition: 'partial', notes: '1/2 full (partial)' });
    addItem({ item_name: 'Revivify Multi-Acid Facial', quantity: 8, supplier: 'OBAGI', notes: '2 boxes of 4' });

    // ELEMIS (spelled ELMIS in request, no quantities provided) -> Skipped as no items listed

    // BIOPEEL
    addItem({ item_name: 'Biopeel Peel', quantity: 5, supplier: 'Biopeel', expiry: '07.28' });
    addItem({ item_name: 'Biopeel Peel', quantity: 1, supplier: 'Biopeel', expiry: '11.26' });

    // VIPEEL
    addItem({ item_name: 'ViPeel Purify', quantity: 4, supplier: 'ViPeel', expiry: '06.25', notes: 'Expired 06/2025 - staff use only' });
    addItem({ item_name: 'ViPeel Purify', quantity: 3, supplier: 'ViPeel', expiry: '03.27' });
    addItem({ item_name: 'ViPeel Purify with Precision and Peptides', quantity: 3, supplier: 'ViPeel', expiry: '03.27' });
    addItem({ item_name: 'ViPeel Precision Plus', quantity: 7, supplier: 'ViPeel', expiry: '07.26' });

    if (items.length === 0) {
      return Response.json({ error: 'No items to insert' }, { status: 400 });
    }

    // Bulk create
    const created = await base44.entities.InventoryItem.bulkCreate(items);

    return Response.json({
      success: true,
      message: `Inserted ${created?.length ?? items.length} inventory items into CHC Too / ${storageLocation}.`,
      inserted_count: created?.length ?? items.length,
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});