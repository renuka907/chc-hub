import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://xtalelqzucijanmnpkol.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YWxlbHF6dWNpamFubW5wa29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDE4NDgsImV4cCI6MjA4Njc3Nzg0OH0.ikyqUV85rLFE9lZOOe74LOAGIpGnRgshyH5B5ufbwLo';
const DATA_DIR = join(import.meta.dirname, 'data-export');

// Map CSV filenames → table name + allowed columns (from our schema)
const TABLE_MAP = {
  'AftercareInstruction_export.csv': {
    table: 'aftercare_instructions',
    cols: ['procedure_name','instructions','warnings','follow_up_schedule','image_url','document_url','is_favorite','tags','version','parent_id','effective_date','created_at','updated_at'],
    remap: { warning_signs: 'warnings', follow_up: 'follow_up_schedule', duration: null, category: null }
  },
  'ClinicLocation_export.csv': {
    table: 'clinic_locations',
    cols: ['name','address','phone','fax','email','hours','status','is_favorite','notes','created_at','updated_at'],
    remap: { tax_rate: null }
  },
  'ConsentForm_export.csv': {
    table: 'consent_forms',
    cols: ['form_name','content','category','document_url','is_favorite','tags','version','parent_id','effective_date','created_at','updated_at'],
    remap: { form_type: 'category' }
  },
  'Discount_export.csv': {
    table: 'discounts',
    cols: ['name','description','discount_type','discount_value','applicable_item_ids','start_date','end_date','status','min_purchase_amount','max_discount_amount','created_at','updated_at'],
    remap: { valid_from: 'start_date', valid_to: 'end_date', applicable_to: null, applicable_categories: null, code: null, max_uses: null, current_uses: null, total_discount_amount: null }
  },
  'EducationTopic_export.csv': {
    table: 'education_topics',
    cols: ['title','category','summary','content','image_url','is_favorite','tags','version','parent_id','effective_date','created_at','updated_at'],
    remap: { header: null, medical_references: null, last_reviewed: null, change_summary: null }
  },
  'FAQ_export.csv': {
    table: 'faqs',
    cols: ['question','answer','category','sort_order','is_favorite','created_at','updated_at'],
    remap: { order: 'sort_order' }
  },
  'InventoryItem_export.csv': {
    table: 'inventory_items',
    cols: ['item_name','sku','item_type','quantity','unit','cost_per_unit','supplier','storage_location','low_stock_threshold','reorder_quantity','expiry_date','status','notes','location_id','associated_pricing_item_ids','item_condition','created_at','updated_at'],
    remap: {}
  },
  'LabTestInfo_export.csv': {
    table: 'lab_test_info',
    cols: ['test_name','test_code','tube_type','specimen_type','collection_instructions','storage_requirements','volume_required','quest_url','category','notes','diagnosis_codes','panel_ids','is_favorite','created_at','updated_at'],
    remap: {}
  },
  'LibraryDocument_export.csv': {
    table: 'library_documents',
    cols: ['document_name','document_url','file_urls','category','description','file_type','is_favorite','tags','created_at','updated_at'],
    remap: {}
  },
  'NotificationPreferences_export.csv': {
    table: 'notification_preferences',
    cols: ['user_email','advance_hours','notify_on_due','notify_on_overdue','enabled','created_at','updated_at'],
    remap: {}
  },
  'Panel_export.csv': {
    table: 'panels',
    cols: ['panel_name','description','status','created_at','updated_at'],
    remap: {}
  },
  'PricingItem_export.csv': {
    table: 'pricing_items',
    cols: ['name','description','category','price','member_price','unit','status','is_favorite','location_ids','created_at','updated_at'],
    remap: { clinic_location_ids: 'location_ids', categories: 'category', item_type: null, area_based: null, pricing_tiers: null, taxable: null }
  },
  'Procedure_export.csv': {
    table: 'procedures',
    cols: ['procedure_name','description','category','cpt_code','icd10_codes','estimated_duration','average_cost','instructions','warnings','is_favorite','created_at','updated_at'],
    remap: { pre_procedure_prep: null, patient_education: null, required_supplies: null, required_tools: null, procedure_steps: 'instructions', post_procedure_notes: null, estimated_time: 'estimated_duration', related_pricing_item_ids: null, related_aftercare_id: null, notes: null }
  },
  'Provider_export.csv': {
    table: 'providers',
    cols: ['full_name','credentials','specialty','npi','phone','fax','email','address','city','state','zip','notes','status','taxonomy_code','created_at','updated_at'],
    remap: { website: null, addresses: null, bio: null, profile_image_url: null, languages: null, category: null, accepting_referrals: null, group_name: null, group_member_ids: null, clinic_location_id: null }
  },
  'Quote_export.csv': {
    table: 'quotes',
    cols: ['quote_number','patient_name','items','subtotal','discount_id','discount_amount','tax_amount','total','notes','image_url','document_url','show_totals','clinic_location_id','status','created_at','updated_at'],
    remap: {}
  },
  'Reminder_export.csv': {
    table: 'reminders',
    cols: ['title','description','due_date','completed','assigned_to','priority','recurrence_type','recurrence_interval','next_trigger_at','last_notified_at','show_after','created_at','updated_at'],
    remap: {}
  },
  'SharedFormLink_export.csv': {
    table: 'shared_form_links',
    cols: ['form_type','form_id','share_token','password','expires_at','is_active','view_count','created_at','updated_at'],
    remap: { entity_type: 'form_type', entity_id: 'form_id' }
  },
  'Special_export.csv': {
    table: 'specials',
    cols: ['title','description','image_url','start_date','end_date','is_archived','discount_percentage','promo_code','created_at','updated_at'],
    remap: { file_url: 'image_url', date_from: 'start_date', date_to: 'end_date' }
  },
};

// Shared columns to always skip
const SKIP_COLS = ['id', 'created_by_id', 'created_by', 'is_sample', '__v', '_id'];

function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  let i = 1;
  while (i < lines.length) {
    let fullLine = lines[i];
    if (!fullLine.trim()) { i++; continue; }
    while (i < lines.length - 1 && (fullLine.split('"').length - 1) % 2 !== 0) {
      i++;
      fullLine += '\n' + lines[i];
    }
    const values = parseCSVLine(fullLine);
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => { row[h.trim()] = values[idx] !== undefined ? values[idx] : ''; });
      rows.push(row);
    }
    i++;
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

const MONGO_ID_RE = /^[a-f0-9]{24}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FK_FIELDS = ['parent_id','location_id','clinic_location_id','related_aftercare_id','related_pricing_item_ids','entity_id','discount_id','associated_pricing_item_ids','group_member_ids','panel_ids','clinic_location_ids'];

function transformRow(row, config) {
  const transformed = {};
  for (const [key, value] of Object.entries(row)) {
    if (SKIP_COLS.includes(key)) continue;
    if (value === '' || value === undefined) continue;

    // Remap field names
    let newKey = key;
    if (newKey === 'created_date') newKey = 'created_at';
    else if (newKey === 'updated_date') newKey = 'updated_at';
    else if (config.remap && config.remap[key] !== undefined) {
      if (config.remap[key] === null) continue;
      newKey = config.remap[key];
    }

    if (!config.cols.includes(newKey)) continue;

    let newValue = value;

    // Strip any field with a MongoDB ObjectId value
    if (typeof newValue === 'string' && MONGO_ID_RE.test(newValue)) continue;

    // Strip FK fields unless they hold a valid UUID
    if (FK_FIELDS.includes(newKey) && typeof newValue === 'string' && !UUID_RE.test(newValue)) continue;

    // Parse JSON
    if (typeof newValue === 'string' && (newValue.startsWith('[') || newValue.startsWith('{'))) {
      try { newValue = JSON.parse(newValue); } catch (e) {}
    }

    // Strip arrays containing MongoDB IDs
    if (Array.isArray(newValue)) {
      newValue = newValue.filter(v => typeof v !== 'string' || !MONGO_ID_RE.test(v));
      if (newValue.length === 0) continue;
    }

    // Parse booleans
    if (newValue === 'true') newValue = true;
    if (newValue === 'false') newValue = false;

    // Parse numbers for numeric fields
    if (['quantity','cost_per_unit','low_stock_threshold','reorder_quantity','discount_value','subtotal','tax_amount','total','discount_amount','sort_order','version','advance_hours','view_count','estimated_time'].includes(newKey)) {
      const num = Number(newValue);
      if (!isNaN(num)) newValue = num;
    }

    // Floor version to integer
    if (newKey === 'version' && typeof newValue === 'number') {
      newValue = Math.floor(newValue);
    }

    // If category is an array, take first element
    if (newKey === 'category' && Array.isArray(newValue)) {
      newValue = newValue[0] || null;
      if (!newValue) continue;
    }

    // Validate discount_type
    if (newKey === 'discount_type') {
      if (newValue !== 'percentage' && newValue !== 'fixed') {
        newValue = 'percentage';
      }
    }

    transformed[newKey] = newValue;
  }
  return transformed;
}

async function insertRows(tableName, rows) {
  let total = 0, errors = 0;
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    // Normalize keys — all rows must have same keys
    const allKeys = new Set();
    batch.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
    const normalized = batch.map(r => {
      const obj = {};
      for (const k of allKeys) obj[k] = r[k] !== undefined ? r[k] : null;
      return obj;
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(normalized),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ Batch error: ${err.substring(0, 200)}`);
      // Try individually
      for (const row of normalized) {
        const r2 = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(row),
        });
        if (r2.ok) total++;
        else { const e = await r2.text(); console.error(`  ❌ Row: ${e.substring(0, 150)}`); errors++; }
      }
    } else {
      total += batch.length;
    }
  }
  return { total, errors };
}

async function main() {
  console.log('🚀 Starting CHC Hub data import...\n');
  // Check existing row counts and skip tables that already have data
  async function getCount(table) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' },
    });
    const range = res.headers.get('content-range') || '';
    const m = range.match(/\/(\d+)/);
    return m ? parseInt(m[1]) : 0;
  }
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.csv'));
  const results = [];

  for (const file of files) {
    const config = TABLE_MAP[file];
    if (!config) { console.log(`⏭️  Skipping ${file}`); continue; }
    const existingCount = await getCount(config.table);
    if (existingCount > 0) {
      console.log(`⏭️  ${config.table} already has ${existingCount} rows, skipping`);
      results.push({ table: config.table, imported: existingCount, errors: 0, skipped: true });
      continue;
    }
    console.log(`📦 ${file} → ${config.table}...`);
    const csv = readFileSync(join(DATA_DIR, file), 'utf-8');
    const rows = parseCSV(csv);
    if (rows.length === 0) { console.log('   (empty)'); results.push({ table: config.table, imported: 0, errors: 0 }); continue; }
    const transformed = rows.map(r => transformRow(r, config)).filter(r => Object.keys(r).length > 0);
    const { total, errors } = await insertRows(config.table, transformed);
    console.log(`   ✅ ${total} rows${errors > 0 ? `, ❌ ${errors} errors` : ''}`);
    results.push({ table: config.table, imported: total, errors });
  }

  console.log('\n📊 SUMMARY:');
  let grand = 0;
  for (const r of results) { console.log(`  ${r.table}: ${r.imported}${r.errors ? ` (${r.errors} err)` : ' ✅'}`); grand += r.imported; }
  console.log(`  TOTAL: ${grand} rows`);
}

main().catch(console.error);
