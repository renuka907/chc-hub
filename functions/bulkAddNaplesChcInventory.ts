import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function parseExpiry(monthDotYear) {
  if (!monthDotYear) return null;
  const cleaned = String(monthDotYear).replace(/\s+/g, '').replace(/\//g, '.').replace(/-/g, '.');
  const parts = cleaned.split('.');
  if (parts.length < 2) return null;
  const mm = parseInt(parts[0], 10);
  let yy = parts[1];
  let year = parseInt(yy, 10);
  if (yy.length === 2) {
    year = 2000 + year;
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

    // Find Naples CHC location
    const clinics = await base44.entities.ClinicLocation.filter({ name: 'Naples CHC' });
    const clinic = clinics?.[0];
    if (!clinic) {
      return Response.json({ error: "ClinicLocation 'Naples CHC' not found. Please create it first." }, { status: 404 });
    }

    const items = [];

    const addItem = ({ item_name, quantity, supplier, notes, expiry, condition = 'unopened', storage_location = null }) => {
      if (!quantity || quantity <= 0) return;
      items.push({
        item_name,
        item_type: 'Product',
        item_condition: condition,
        quantity,
        unit: 'units',
        location_id: clinic.id,
        storage_location: storage_location || undefined,
        supplier,
        notes: notes || undefined,
        expiry_date: expiry ? parseExpiry(expiry) : undefined,
        status: 'active',
      });
    };

    // RANDOMS
    addItem({ item_name: 'Latisse', quantity: 5, supplier: 'Various' });
    addItem({ item_name: 'Baby Foot', quantity: 2, supplier: 'Various' });
    addItem({ item_name: 'NP Thyroid Supplement', quantity: 2, supplier: 'Various' });
    addItem({ item_name: 'Quintessentials', quantity: 4, supplier: 'Various' });
    addItem({ item_name: 'Cartessa NOON Gear Up Kit', quantity: 2, supplier: 'Cartessa NOON' });
    addItem({ item_name: 'Cartessa NOON Accelerate Kit', quantity: 2, supplier: 'Cartessa NOON' });

    // OBAGI
    addItem({ item_name: 'Foaming Gel #1 Full Size', quantity: 4, supplier: 'OBAGI' });
    addItem({ item_name: 'Foaming Gel #1 Mini', quantity: 4, supplier: 'OBAGI' });
    addItem({ item_name: 'Gentle Cleanser #1 Full Size', quantity: 2, supplier: 'OBAGI' });
    addItem({ item_name: 'Gentle Cleanser #1 Mini', quantity: 3, supplier: 'OBAGI' });
    addItem({ item_name: 'Toner #2 Mini', quantity: 2, supplier: 'OBAGI' });
    addItem({ item_name: 'Clear #3', quantity: 2, supplier: 'OBAGI', expiry: '01.26' });
    addItem({ item_name: 'Exfoderm #4', quantity: 4, supplier: 'OBAGI' });
    addItem({ item_name: 'Blender #5', quantity: 3, supplier: 'OBAGI', expiry: '07.27' });
    addItem({ item_name: 'Hydrate Facial Moisturizer', quantity: 1, supplier: 'OBAGI' });
    addItem({ item_name: 'Hydrate Lux', quantity: 5, supplier: 'OBAGI' });
    addItem({ item_name: 'Elastiderm Advance Filler Concentrate', quantity: 3, supplier: 'OBAGI' });
    addItem({ item_name: 'Elastiderm Neck and Décolleté', quantity: 3, supplier: 'OBAGI' });
    addItem({ item_name: 'Elastiderm Eye Serum', quantity: 6, supplier: 'OBAGI' });
    addItem({ item_name: 'Elastiderm Facial Serum', quantity: 3, supplier: 'OBAGI' });
    addItem({ item_name: 'Elastiderm Lift Up and Sculpt', quantity: 6, supplier: 'OBAGI' });
    addItem({ item_name: 'Elastiderm Firming Eye Cream', quantity: 3, supplier: 'OBAGI' });
    addItem({ item_name: 'SPF 50 Tint', quantity: 2, supplier: 'OBAGI' });
    addItem({ item_name: 'SPF 50 Cool', quantity: 1, supplier: 'OBAGI' });
    addItem({ item_name: 'Tretinoin 0.025%', quantity: 2, supplier: 'OBAGI', expiry: '12.26' });
    addItem({ item_name: 'Tretinoin 0.05%', quantity: 5, supplier: 'OBAGI', expiry: '09.26' });
    addItem({ item_name: 'Tretinoin 0.05% Gel', quantity: 1, supplier: 'OBAGI', expiry: '02.27' });

    // ELEMIS
    addItem({ item_name: 'Hand and Body Lotion', quantity: 2, supplier: 'ELEMIS' });
    addItem({ item_name: 'Pro-Collagen Marine Cream', quantity: 2, supplier: 'ELEMIS' });
    addItem({ item_name: 'Dynamic Resurfacing Gel Mask', quantity: 2, supplier: 'ELEMIS' });
    addItem({ item_name: 'Dynamic Resurfacing Facial Wash', quantity: 2, supplier: 'ELEMIS' });
    addItem({ item_name: 'Dynamic Resurfacing Super C Serum', quantity: 2, supplier: 'ELEMIS' });
    addItem({ item_name: 'Dynamic Resurfacing Peel and Reset', quantity: 2, supplier: 'ELEMIS' });
    addItem({ item_name: 'Pro-Collagen Cleansing Balm', quantity: 2, supplier: 'ELEMIS' });
    addItem({ item_name: 'Pro-Collagen SPF 50', quantity: 1, supplier: 'ELEMIS' });
    addItem({ item_name: 'Pro-Collagen Vitality Eye Cream', quantity: 2, supplier: 'ELEMIS' });

    // NUTRAFOL
    addItem({ item_name: 'Nutrafol (M) Shampoo', quantity: 4, supplier: 'Nutrafol' });
    addItem({ item_name: 'Nutrafol (W) Conditioner', quantity: 3, supplier: 'Nutrafol' });
    addItem({ item_name: 'Nutrafol Hair Serum', quantity: 2, supplier: 'Nutrafol' });
    addItem({ item_name: 'Nutrafol (M) 3-Month', quantity: 1, supplier: 'Nutrafol', expiry: '04.26' });
    addItem({ item_name: 'Nutrafol (M) 3-Month', quantity: 1, supplier: 'Nutrafol', expiry: '11.26' });
    addItem({ item_name: 'Nutrafol (M) 1-Month', quantity: 3, supplier: 'Nutrafol' });
    addItem({ item_name: 'Nutrafol Vegan 3-Month', quantity: 3, supplier: 'Nutrafol', expiry: '10.26' });
    addItem({ item_name: 'Nutrafol Vegan 1-Month', quantity: 1, supplier: 'Nutrafol', expiry: '08.25' });
    addItem({ item_name: 'Nutrafol Vegan 1-Month', quantity: 3, supplier: 'Nutrafol', expiry: '01.27' });
    addItem({ item_name: 'Nutrafol Balance 3-Month', quantity: 1, supplier: 'Nutrafol', expiry: '06.26' });
    addItem({ item_name: 'Nutrafol Balance 3-Month', quantity: 2, supplier: 'Nutrafol', expiry: '07.26' });
    addItem({ item_name: 'Nutrafol Balance 1-Month', quantity: 3, supplier: 'Nutrafol', expiry: '03.26' });
    addItem({ item_name: 'Nutrafol DHT 3-Month', quantity: 2, supplier: 'Nutrafol', expiry: '10.27' });
    addItem({ item_name: 'Nutrafol DHT 1-Month', quantity: 4, supplier: 'Nutrafol', expiry: '08.25' });
    addItem({ item_name: 'Nutrafol Hair Collagen', quantity: 2, supplier: 'Nutrafol', expiry: '04.27' });
    addItem({ item_name: 'Nutrafol Skin 1-Month', quantity: 3, supplier: 'Nutrafol', expiry: '04.26' });

    // NOON
    addItem({ item_name: 'NOON Kit', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Anti-Aging Kit', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON Brightening Kit', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON Acne Kit', quantity: 6, supplier: 'NOON' });
    addItem({ item_name: 'NOON In Depth Filler Cream', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON In Depth Filler Serum', quantity: 5, supplier: 'NOON' });
    addItem({ item_name: 'NOON OMG Cream', quantity: 5, supplier: 'NOON' });
    addItem({ item_name: 'NOON Reform Eye Cream', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Therapeutic Hydrogel', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Retinol 0.3%', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON Retinol 1%', quantity: 3, supplier: 'NOON' });
    addItem({ item_name: 'NOON Retinol 1.6%', quantity: 3, supplier: 'NOON' });
    addItem({ item_name: 'NOON Lift and Whitening Complex', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON C Cleanser', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Igloo Moist', quantity: 5, supplier: 'NOON' });
    addItem({ item_name: 'NOON Acne Solution', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON Anco Complex', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON BenzoAzelin', quantity: 3, supplier: 'NOON' });
    addItem({ item_name: 'NOON Double Fight', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Double White', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Lacto-10', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Vit C Serum', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Restart Serum', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON Halo-Ronic Serum', quantity: 3, supplier: 'NOON' });
    addItem({ item_name: 'NOON Microsoft Cleanser', quantity: 4, supplier: 'NOON' });
    addItem({ item_name: 'NOON Hydrocalming Complex', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON Brush N Go #1 All Skin Types', quantity: 6, supplier: 'NOON' });
    addItem({ item_name: 'NOON Brush N Go #2 All Skin Types', quantity: 2, supplier: 'NOON' });
    addItem({ item_name: 'NOON Brush N Go #1 Oily Types', quantity: 6, supplier: 'NOON' });
    addItem({ item_name: 'NOON Brush N Go #2 Oily Types', quantity: 6, supplier: 'NOON' });

    // SKINCEUTICALS
    addItem({ item_name: 'Conditioning Toner', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Equalizing Toner', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'LHA Toner', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Soothing Cleanser', quantity: 1, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Simple Clean Wash', quantity: 5, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Replenishing Cream', quantity: 1, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Triple Lipid', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Glycolic 10', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Tripeptide R-Neck Repair', quantity: 1, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Body Tightening Concentrate', quantity: 1, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Advanced RGN-6', quantity: 5, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'PHYTO Mist', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'PHYTO A+ Brightening Treatment', quantity: 4, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Double Defense Kit', quantity: 2, supplier: 'SkinCeuticals', expiry: '05.26' });
    addItem({ item_name: 'Phloretin CF GEL', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'PTOX', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Resveratrol BE', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'AGE Interrupter Serum', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'AGE Interrupter Advanced', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'C E Ferulic', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Face Cream', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Discoloration Defense', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'PHYTO+', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'HydraBalm', quantity: 4, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'HA Intensifier', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Phloretin CF', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Epidermal Repair', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Daily Brightening Defense', quantity: 2, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Clarifying Clay Mask', quantity: 3, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Blemish and Age', quantity: 1, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Lip Repair', quantity: 5, supplier: 'SkinCeuticals' });
    addItem({ item_name: 'Physical UV Defense Sunscreen 1.7FL', quantity: 4, supplier: 'SkinCeuticals' });

    if (items.length === 0) {
      return Response.json({ error: 'No items to insert' }, { status: 400 });
    }

    const created = await base44.entities.InventoryItem.bulkCreate(items);

    return Response.json({
      success: true,
      message: `Inserted ${created?.length ?? items.length} inventory items into Naples CHC.`,
      inserted_count: created?.length ?? items.length,
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});