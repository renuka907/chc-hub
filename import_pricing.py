import csv, json, requests

SUPABASE_URL = "https://xtalelqzucijanmnpkol.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YWxlbHF6dWNpamFubW5wa29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDE4NDgsImV4cCI6MjA4Njc3Nzg0OH0.ikyqUV85rLFE9lZOOe74LOAGIpGnRgshyH5B5ufbwLo"
CSV_PATH = "/Users/rosiejoy/.openclaw/workspace/apps/chc-hub/data-export/PricingItem_export.csv"

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Schema: name, description, category, price, member_price, unit, status, is_favorite, location_ids, created_at, updated_at

rows = []
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        row = {}
        row['name'] = r['name'] or 'Unnamed'
        row['description'] = r['description'] or None
        row['status'] = r['status'] if r['status'] in ('active', 'inactive') else 'active'
        row['is_favorite'] = r['is_favorite'].lower() == 'true'
        
        # categories → category (take first from JSON array)
        if r['categories'].strip():
            try:
                cats = json.loads(r['categories'])
                row['category'] = cats[0] if cats else 'General'
            except:
                row['category'] = r['categories']
        else:
            row['category'] = 'General'
        
        # pricing_tiers → extract price
        if r['pricing_tiers'].strip():
            try:
                tiers = json.loads(r['pricing_tiers'])
                if tiers:
                    row['price'] = tiers[0].get('price')
            except:
                pass
        
        # clinic_location_ids → location_ids
        if r['clinic_location_ids'].strip():
            try:
                row['location_ids'] = json.loads(r['clinic_location_ids'])
            except:
                row['location_ids'] = []
        else:
            row['location_ids'] = []
        
        # Dates
        row['created_at'] = r['created_date'] if r['created_date'] else None
        row['updated_at'] = r['updated_date'] if r['updated_date'] else None
        
        rows.append(row)

print(f"Parsed {len(rows)} rows")

# Need service role key for RLS. Try using the import-data.mjs approach or check if there's RLS bypass.
# First attempt - if RLS blocks, we'll need service key.

BATCH = 50
inserted = 0
for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    resp = requests.post(f"{SUPABASE_URL}/rest/v1/pricing_items", headers=HEADERS, json=batch)
    if resp.status_code == 201:
        inserted += len(batch)
        if (i // BATCH) % 5 == 0:
            print(f"  Batch {i//BATCH}: OK ({inserted} so far)")
    else:
        print(f"Error at batch {i//BATCH}: {resp.status_code} {resp.text[:500]}")
        break

print(f"\nInserted {inserted}/{len(rows)} rows")
