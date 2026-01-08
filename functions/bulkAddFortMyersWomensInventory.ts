import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// One-time bulk insert of inventory for Fort Myers Womens Clinic
// Run from Dashboard -> Code -> Functions -> bulkAddFortMyersWomensInventory
// Requires admin user
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

    // Find location id by name
    const locations = await base44.entities.ClinicLocation.filter({ name: 'Fort Myers Womens Clinic' });
    if (!locations || !locations.length) {
      return Response.json({ error: 'ClinicLocation "Fort Myers Womens Clinic" not found' }, { status: 404 });
    }
    const locationId = locations[0].id;

    const items = [
      // ROOM 7
      { item_name: 'Co-Band', qty: 1, storage_location: 'Room 7' },
      { item_name: 'Centrifuge Tubes', qty: 3, storage_location: 'Room 7' },
      { item_name: 'Skin Closure Strips (Steri-Strips)', qty: 1, storage_location: 'Room 7' },
      { item_name: 'Scalpel Blades #11', qty: 33, storage_location: 'Room 7' },
      { item_name: 'IV Catheters', qty: 3, storage_location: 'Room 7' },
      { item_name: 'Safety Lancets', qty: 1, storage_location: 'Room 7' },
      { item_name: 'Safety Hinges Blood Collection Needle (Butterfly Needles)', qty: 5, storage_location: 'Room 7' },
      { item_name: 'Poly-Lined Towel/Drapes', qty: 0, storage_location: 'Room 7' },
      { item_name: 'Hydrogen Peroxide', qty: 4, storage_location: 'Room 7' },
      { item_name: 'Isopropyl Alcohol', qty: 4, storage_location: 'Room 7' },
      { item_name: 'Betadine Solution', qty: 12, storage_location: 'Room 7' },
      { item_name: 'Tongue Depressors', qty: 2, storage_location: 'Room 7' },
      { item_name: '0.9% Sodium Chloride Irrigation', qty: 6, storage_location: 'Room 7' },
      { item_name: 'Cotton Tipped Applicators', qty: 10, storage_location: 'Room 7' },
      { item_name: 'Adhesive Bandages (SPOT)', qty: 1, storage_location: 'Room 7' },
      { item_name: 'Adhesive Bandages', qty: 2, storage_location: 'Room 7' },
      { item_name: 'Flexible Fabric Bandages', qty: 5, storage_location: 'Room 7' },
      { item_name: 'Mastisol', qty: 5, storage_location: 'Room 7' },
      { item_name: '0.9% Sodium Chloride FLUSH', qty: 0, storage_location: 'Room 7' },
      { item_name: 'Witch Hazel', qty: 7, storage_location: 'Room 7' },
      { item_name: 'J-Loops', qty: 2, storage_location: 'Room 7' },
      { item_name: 'Silver Nitrate', qty: 2, storage_location: 'Room 7' },
      { item_name: 'Ultrasound Jelly', qty: 4, storage_location: 'Room 7' },

      // ROOM 8
      { item_name: 'Insulin Syringes with Needles 3/10 CC', qty: 4, storage_location: 'Room 8' },
      { item_name: 'Syringes 5L', qty: 5, storage_location: 'Room 8' },
      { item_name: 'Syringes 10ML', qty: 2, storage_location: 'Room 8' },
      { item_name: 'Syringes 3ML', qty: 1, storage_location: 'Room 8' },
      { item_name: 'Syringes 20ML', qty: 2, storage_location: 'Room 8' },
      { item_name: 'Aptima Swabs', qty: 1, storage_location: 'Room 8' },
      { item_name: 'Syringes 60 CC', qty: 0, storage_location: 'Room 8' },
      { item_name: 'Insulin Syringes 3/10CC 30G', qty: 0, storage_location: 'Room 8' },
      { item_name: 'Non- Woven 4X4 Gauze', qty: 3, storage_location: 'Room 8' },
      { item_name: 'Non- Woven 2X2 Gauze', qty: 13, storage_location: 'Room 8' },
      { item_name: 'Syringes with Needles 1ML', qty: 1, storage_location: 'Room 8' },
      { item_name: 'Non- Adherent Pad', qty: 1, storage_location: 'Room 8' },
      { item_name: '18g x 1', qty: 4, storage_location: 'Room 8' },
      { item_name: '21g x 1', qty: 4, storage_location: 'Room 8' },
      { item_name: '30g x 1/2', qty: 9, storage_location: 'Room 8' },
      { item_name: '25g x 1 1/2', qty: 4, storage_location: 'Room 8' },
      { item_name: 'Hypodermic Needles', qty: 2, storage_location: 'Room 8' },

      // ROOM 9
      { item_name: 'Baby Wipes', qty: 8, storage_location: 'Room 9' },
      { item_name: 'Obstetrical Towelettes', qty: 6, storage_location: 'Room 9' },
      { item_name: 'UA Culture Tubes', qty: 1, storage_location: 'Room 9' },
      { item_name: 'U By Kotex Pads', qty: 1.5, storage_location: 'Room 9' },
      { item_name: 'UA Test Strips', qty: 6, storage_location: 'Room 9' },
      { item_name: 'Biopsy Jars', qty: 3, storage_location: 'Room 9' },
      { item_name: 'Lubricating Jelly', qty: 11, storage_location: 'Room 9' },
      { item_name: 'Chlorhexidine Wipes', qty: 20, storage_location: 'Room 9', notes: '+ one full box under sink' },
      { item_name: 'Thin Prep Pap Jars', qty: 14, storage_location: 'Room 9' },
      { item_name: 'Pap Brush and Spatulas', qty: 5, storage_location: 'Room 9' },
      { item_name: 'Arnicare', qty: 7, storage_location: 'Room 9' },
      { item_name: 'Triple Antibiotic Ointment', qty: 5, storage_location: 'Room 9' },
      { item_name: 'Aquaphor', qty: 2, storage_location: 'Room 9' },

      // ROOM 10
      { item_name: '6 1/2 & 7 Surgical Gloves', qty: 3, storage_location: 'Room 10' },
      { item_name: '7 1/2 Surgical Gloves', qty: 3, storage_location: 'Room 10' },
      { item_name: 'Small Gloves', qty: 0, storage_location: 'Room 10', notes: 'NONE' },
      { item_name: 'Medium Gloves', qty: 0, storage_location: 'Room 10', notes: 'NONE' },
      { item_name: 'Large Gloves', qty: 9, storage_location: 'Room 10' },
      { item_name: 'Tegaderm', qty: 6, storage_location: 'Room 10' },
      { item_name: 'Biopsy Punches', qty: 4, storage_location: 'Room 10' },
      { item_name: 'Surgical Tape (PAPER)', qty: 5, storage_location: 'Room 10' },
      { item_name: 'Alcohol Prep Pads', qty: 5, storage_location: 'Room 10' },
      { item_name: 'Sani-Cloth Wipes', qty: 16, storage_location: 'Room 10' },

      // BIG LAB-400
      { item_name: 'Towels/Bibs-Counter Sheets', qty: 0, storage_location: 'Big Lab-400' },
      { item_name: 'Urine Specimen Cups', qty: 0, storage_location: 'Big Lab-400' },
      { item_name: 'IV Flushes', qty: 0, storage_location: 'Big Lab-400' },
      { item_name: 'Exam Table Paper', qty: 0, storage_location: 'Big Lab-400' },
      { item_name: 'Pillowcases', qty: 0, storage_location: 'Big Lab-400' },

      // SMALL LAB-400
      { item_name: 'IV Tubing', qty: 1, storage_location: 'Small Lab-400' },
      { item_name: 'Solid Red Tubes', qty: 1, storage_location: 'Small Lab-400', notes: 'exp. 09.30.26', expiry_date: '2026-09-30' },
      { item_name: 'IV bags (500ML)', qty: 0, storage_location: 'Small Lab-400' },
      { item_name: 'IV bags (1000ML)', qty: 0, storage_location: 'Small Lab-400' },

      // DOC'S OFFICE
      { item_name: 'Exsosomes', qty: 0, storage_location: 'Doc’s Office' },
    ];

    const payload = items.map((i) => ({
      item_name: i.item_name,
      item_type: 'Supply',
      quantity: i.qty,
      unit: 'units',
      location_id: locationId,
      storage_location: i.storage_location,
      ...(i.notes ? { notes: i.notes } : {}),
      ...(i.expiry_date ? { expiry_date: i.expiry_date } : {}),
    }));

    const created = await base44.asServiceRole.entities.InventoryItem.bulkCreate(payload);

    return Response.json({
      success: true,
      createdCount: created?.length || payload.length,
      locationId,
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});