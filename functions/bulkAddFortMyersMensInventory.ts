import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// One-time bulk insert of inventory for Fort Myers Men’s Clinic (BLDG: 200)
// Run from Dashboard -> Code -> Functions -> bulkAddFortMyersMensInventory
// Admin-only
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    // Resolve clinic location
    const locations = await base44.entities.ClinicLocation.filter({ name: 'Fort Myers Men’s Clinic' });
    if (!locations?.length) {
      return Response.json({ error: 'ClinicLocation "Fort Myers Men’s Clinic" not found' }, { status: 404 });
    }
    const locationId = locations[0].id;

    const items = [
      // STORAGE (BLDG: 200)
      { item_name: '20ML Syringes', qty: 7, storage_location: 'Storage' },
      { item_name: '3ML Syringes', qty: 8, storage_location: 'Storage' },
      { item_name: '10ML Syringes', qty: 5, storage_location: 'Storage' },
      { item_name: '5ML Syringes', qty: 8, storage_location: 'Storage' },
      { item_name: 'Pillowcases', qty: 1, storage_location: 'Storage' },
      { item_name: 'Drape Sheets', qty: 4, storage_location: 'Storage' },
      { item_name: 'Underpads Tissue', qty: 2, storage_location: 'Storage' },
      { item_name: 'Towels/Bibs', qty: 4, storage_location: 'Storage' },
      { item_name: 'Sharps Containers', qty: 1, storage_location: 'Storage', unit: 'boxes' },
      { item_name: 'Cotton Balls', qty: 1, storage_location: 'Storage' },
      { item_name: 'Autoclave Pouch 12x15', qty: 6, storage_location: 'Storage' },
      { item_name: 'Autoclave Pouch 7 1/2x13', qty: 1, storage_location: 'Storage' },
      { item_name: 'Autoclave Pouch 3 1/2x9', qty: 7, storage_location: 'Storage' },
      { item_name: 'Syringe 60CC', qty: 2, storage_location: 'Storage' },
      { item_name: 'Urine Cups', qty: 2, storage_location: 'Storage' },
      { item_name: 'Aptima Swabs', qty: 4, storage_location: 'Storage' },
      { item_name: 'IV Flush', qty: 2, storage_location: 'Storage' },
      { item_name: '10CC Controlled Syringe', qty: 2, storage_location: 'Storage' },
      { item_name: 'Castile Soap Towelettes', qty: 9, storage_location: 'Storage' },
      { item_name: 'Cotton Tipped Applicators', qty: 12, storage_location: 'Storage' },
      { item_name: 'Hubs', qty: 0, storage_location: 'Storage', notes: 'plenty' },
      { item_name: 'Butterfly Needles (HINGED)', qty: 8, storage_location: 'Storage' },
      { item_name: 'Butterfly Needles (GLIDE)', qty: 3, storage_location: 'Storage' },
      { item_name: 'US Jelly', qty: 1, storage_location: 'Storage' },
      { item_name: 'Obstetrical Antiseptic Towels', qty: 5, storage_location: 'Storage' },
      { item_name: 'Alcohol Prep Pads', qty: 1, storage_location: 'Storage' },
      { item_name: '18Gx1 Needle', qty: 4, storage_location: 'Storage' },
      { item_name: '18Gx1 1/2 Needle', qty: 2, storage_location: 'Storage' },
      { item_name: '28Gx1 Needle', qty: 1, storage_location: 'Storage' },
      { item_name: '30Gx1/2 Needle', qty: 2, storage_location: 'Storage' },
      { item_name: '25Gx1 1/2 Needle', qty: 2, storage_location: 'Storage' },
      { item_name: 'Antiseptic Skin Cleaner', qty: 4, storage_location: 'Storage' },
      { item_name: 'Rubbing Alcohol', qty: 9, storage_location: 'Storage' },
      { item_name: 'Lavender Tubes', qty: 2, storage_location: 'Storage', notes: 'exp. 08.2026' },
      { item_name: 'Red Tubes', qty: 2, storage_location: 'Storage', notes: 'exp. 05.2026' },
      { item_name: 'Red Tubes', qty: 2, storage_location: 'Storage', notes: 'exp. 09.2026' },
      { item_name: '2x2 Woven Gauze', qty: 8, storage_location: 'Storage' },
      { item_name: '4x4 Woven Gauze', qty: 2, storage_location: 'Storage' },
      { item_name: 'Adhesive Fabric Bandaids', qty: 24, storage_location: 'Storage' },
      { item_name: 'Adhesive Fabric Bandaids STRIP', qty: 12, storage_location: 'Storage' },
      { item_name: 'Hemoglobin Drain Bags', qty: 1, storage_location: 'Storage' },
      { item_name: 'Latex Gloves SZ 7', qty: 4, storage_location: 'Storage' },
      { item_name: 'Latex Gloves SZ 7 1/2', qty: 4, storage_location: 'Storage' },
      { item_name: 'Latex Gloves SZ 8-9 1/2', qty: 2, storage_location: 'Storage' },
      { item_name: 'Exam Gloves S', qty: 2, storage_location: 'Storage' },
      { item_name: 'Witch Hazel', qty: 3, storage_location: 'Storage' },
      { item_name: 'Multi-Enzymatic Cleaner', qty: 2, storage_location: 'Storage' },
      { item_name: 'Nitronox Tubing', qty: 3, storage_location: 'Storage', unit: 'boxes' },
      { item_name: 'Sharps Container', qty: 1, storage_location: 'Storage' },
      { item_name: 'IV BAGS (500ml)', qty: 2, storage_location: 'Storage', notes: 'exp. 2026' },
      { item_name: 'IV BAGS (500ml)', qty: 2, storage_location: 'Storage', notes: 'exp. 2027' },
      { item_name: 'IV BAGS (1000ml)', qty: 1, storage_location: 'Storage', notes: 'exp. 2027' },
      { item_name: 'IV BAGS (1000ml)', qty: 3, storage_location: 'Storage', notes: 'exp. 2028' },
      { item_name: 'Ice Packs', qty: 12, storage_location: 'Storage', unit: 'boxes' },

      // BIG LAB
      { item_name: 'Green Tubes', qty: 1, storage_location: 'Big Lab', notes: 'exp. 10.31.26 & 10.01.26' },
      { item_name: 'Red Solid Tubes', qty: 0, storage_location: 'Big Lab' },
      { item_name: 'Tiger Top Tubes', qty: 0, storage_location: 'Big Lab' },
      { item_name: 'Lavender Tubes', qty: 0, storage_location: 'Big Lab' },
    ];

    const payload = items.map((i) => ({
      item_name: i.item_name,
      item_type: 'Supply',
      quantity: i.qty,
      unit: i.unit || 'units',
      location_id: locationId,
      storage_location: i.storage_location,
      ...(i.notes ? { notes: i.notes } : {}),
    }));

    const created = await base44.asServiceRole.entities.InventoryItem.bulkCreate(payload);
    return Response.json({ success: true, createdCount: created?.length || payload.length, locationId });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});