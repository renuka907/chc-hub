const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xtalelqzucijanmnpkol.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YWxlbHF6dWNpamFubW5wa29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDE4NDgsImV4cCI6MjA4Njc3Nzg0OH0.ikyqUV85rLFE9lZOOe74LOAGIpGnRgshyH5B5ufbwLo';
const DATA_DIR = path.join(__dirname, 'data-export');

const TABLE_CONFIGS = {
  'AftercareInstruction_export.csv': {
    table: 'aftercare_instructions',
    map: { procedure_name: 'procedure_name', instructions: 'instructions', warning_signs: 'warnings', follow_up: 'follow_up_schedule', image_url: 'image_url', document_url: 'document_url', is_favorite: 'is_favorite', tags: 'tags', version: 'version', parent_id: 'parent_id', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'ClinicLocation_export.csv': {
    table: 'clinic_locations',
    map: { name: 'name', address: 'address', phone: 'phone', email: 'email', status: 'status', is_favorite: 'is_favorite', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'ConsentForm_export.csv': {
    table: 'consent_forms',
    map: { form_name: 'form_name', content: 'content', form_type: 'category', document_url: 'document_url', is_favorite: 'is_favorite', tags: 'tags', version: 'version', parent_id: 'parent_id', effective_date: 'effective_date', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'Discount_export.csv': {
    table: 'discounts',
    map: { name: 'name', description: 'description', discount_type: 'discount_type', discount_value: 'discount_value', applicable_item_ids: 'applicable_item_ids', valid_from: 'start_date', valid_to: 'end_date', status: 'status', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'EducationTopic_export.csv': {
    table: 'education_topics',
    map: { title: 'title', summary: 'summary', content: 'content', category: 'category', image_url: 'image_url', medical_references: 'medical_references', header: 'header', is_favorite: 'is_favorite', version: 'version', parent_id: 'parent_id', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'FAQ_export.csv': {
    table: 'faqs',
    map: { question: 'question', answer: 'answer', category: 'category', order: 'sort_order', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'InventoryItem_export.csv': {
    table: 'inventory_items',
    map: { item_name: 'item_name', item_type: 'item_type', item_condition: 'item_condition', sku: 'sku', quantity: 'quantity', unit: 'unit', low_stock_threshold: 'low_stock_threshold', reorder_quantity: 'reorder_quantity', cost_per_unit: 'cost_per_unit', storage_location: 'storage_location', associated_pricing_item_ids: 'associated_pricing_item_ids', supplier: 'supplier', notes: 'notes', expiry_date: 'expiry_date', status: 'status', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'LabTestInfo_export.csv': {
    table: 'lab_test_info',
    map: { test_name: 'test_name', test_code: 'test_code', category: 'category', tube_type: 'tube_type', specimen_type: 'specimen_type', collection_instructions: 'collection_instructions', storage_requirements: 'storage_requirements', volume_required: 'volume_required', quest_url: 'quest_url', notes: 'notes', is_favorite: 'is_favorite', panel_ids: 'panel_ids', diagnosis_codes: 'diagnosis_codes', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'LibraryDocument_export.csv': {
    table: 'library_documents',
    map: { document_name: 'document_name', document_url: 'document_url', file_urls: 'file_urls', category: 'category', description: 'description', file_type: 'file_type', tags: 'tags', is_favorite: 'is_favorite', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'NotificationPreferences_export.csv': {
    table: 'notification_preferences',
    map: { user_email: 'user_email', advance_hours: 'advance_hours', notify_on_due: 'notify_on_due', notify_on_overdue: 'notify_on_overdue', enabled: 'enabled', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'Panel_export.csv': {
    table: 'panels',
    map: { panel_name: 'panel_name', description: 'description', status: 'status', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'PricingItem_export.csv': {
    table: 'pricing_items',
    map: { name: 'name', description: 'description', item_type: 'category', is_favorite: 'is_favorite', status: 'status', clinic_location_ids: 'location_ids', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'Procedure_export.csv': {
    table: 'procedures',
    map: { procedure_name: 'procedure_name', category: 'category', procedure_steps: 'description', patient_education: 'instructions', post_procedure_notes: 'warnings', is_favorite: 'is_favorite', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'Provider_export.csv': {
    table: 'providers',
    map: { full_name: 'full_name', credentials: 'credentials', specialty: 'specialty', phone: 'phone', fax: 'fax', email: 'email', address: 'address', notes: 'notes', status: 'status', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'Quote_export.csv': {
    table: 'quotes',
    map: { patient_name: 'patient_name', items: 'items', subtotal: 'subtotal', discount_amount: 'discount_amount', total: 'total', notes: 'notes', status: 'status', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'Reminder_export.csv': {
    table: 'reminders',
    map: { title: 'title', description: 'description', due_date: 'due_date', priority: 'priority', assigned_to: 'assigned_to', completed: 'completed', recurrence_type: 'recurrence_type', recurrence_interval: 'recurrence_interval', next_trigger_at: 'next_trigger_at', last_notified_at: 'last_notified_at', show_after: 'show_after', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'SharedFormLink_export.csv': {
    table: 'shared_form_links',
    map: { entity_type: 'form_type', share_token: 'share_token', password: 'password', expires_at: 'expires_at', is_active: 'is_active', view_count: 'view_count', created_date: 'created_at', updated_date: 'updated_at' }
  },
  'Special_export.csv': {
    table: 'specials',
    map: { title: 'title', file_url: 'image_url', date_from: 'start_date', date_to: 'end_date', is_archived: 'is_archived', created_date: 'created_at', updated_date: 'updated_at' }
  },
};

function parseCSV(text) {
  const rows = []; let i = 0;
  function parseField() {
    if (i >= text.length) return '';
    if (text[i] === '"') {
      i++; let f = '';
      while (i < text.length) {
        if (text[i] === '"') { if (i+1 < text.length && text[i+1] === '"') { f += '"'; i += 2; } else { i++; break; } }
        else { f += text[i]; i++; }
      } return f;
    } else {
      let f = '';
      while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') { f += text[i]; i++; }
      return f;
    }
  }
  while (i < text.length) {
    const row = [];
    while (true) {
      row.push(parseField());
      if (i >= text.length || text[i] === '\n' || text[i] === '\r') {
        if (i < text.length && text[i] === '\r') i++;
        if (i < text.length && text[i] === '\n') i++;
        break;
      }
      if (text[i] === ',') i++;
    }
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
  }
  return rows;
}

function tryJSON(val) {
  if (typeof val !== 'string') return val;
  const t = val.trim();
  if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
    try { return JSON.parse(t); } catch { return val; }
  }
  return val;
}

function coerce(val) {
  if (val === '' || val === undefined) return null;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return tryJSON(val);
}

async function insertBatch(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`, 'Prefer': 'return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) { const body = await res.text(); throw new Error(`${res.status}: ${body}`); }
}

async function main() {
  console.log('Starting CHC Hub data import (REST API)...\n');
  const results = [];

  for (const [file, config] of Object.entries(TABLE_CONFIGS)) {
    const { table, map } = config;
    try {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
      const parsed = parseCSV(raw);
      if (parsed.length < 2) { console.log(`  ${table}: 0 rows (empty)`); results.push({ table, count: 0 }); continue; }

      const headers = parsed[0];
      const dataRows = parsed.slice(1);
      const colMaps = [];
      for (let i = 0; i < headers.length; i++) {
        if (headers[i] in map && map[headers[i]] !== null) colMaps.push({ idx: i, col: map[headers[i]] });
      }

      const rows = dataRows.map(row => {
        const obj = {};
        for (const { idx, col } of colMaps) obj[col] = coerce(row[idx]);
        return obj;
      });

      let inserted = 0;
      const BATCH = 50;
      const errors = [];
      for (let b = 0; b < rows.length; b += BATCH) {
        const batch = rows.slice(b, b + BATCH);
        try {
          await insertBatch(table, batch);
          inserted += batch.length;
        } catch (err) {
          errors.push(`batch ${b}: ${err.message.substring(0, 200)}`);
        }
      }
      const status = errors.length ? `⚠️  ${inserted}/${dataRows.length}` : `✅ ${inserted}`;
      console.log(`  ${table}: ${status} rows`);
      for (const e of errors) console.log(`    ${e}`);
      results.push({ table, count: inserted, total: dataRows.length, errors });
    } catch (err) {
      console.error(`  ❌ ${table}: ${err.message}`);
      results.push({ table, count: 0, error: err.message });
    }
  }

  console.log('\n=== SUMMARY ===');
  let total = 0;
  for (const r of results) { total += r.count; console.log(`  ${r.table}: ${r.count} rows`); }
  console.log(`\nTotal: ${total} rows imported`);
}

main().catch(console.error);
