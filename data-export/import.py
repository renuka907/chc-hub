#!/usr/bin/env python3
import csv, json, requests

SUPA = "https://xtalelqzucijanmnpkol.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YWxlbHF6dWNpamFubW5wa29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDE4NDgsImV4cCI6MjA4Njc3Nzg0OH0.ikyqUV85rLFE9lZOOe74LOAGIpGnRgshyH5B5ufbwLo"
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

SKIP_COLS = {"id", "created_by_id", "created_by", "is_sample"}
RENAME = {"created_date": "created_at", "updated_date": "updated_at", "last_reviewed": "last_reviewed", "change_summary": "change_summary"}

# Supabase table columns (from OpenAPI spec)
TABLE_COLS = {
    "education_topics": {'title','summary','content','category','image_url','medical_references','header','is_favorite','version','created_at','updated_at'},
    "library_documents": {'document_name','document_url','file_urls','category','description','file_type','tags','is_favorite','created_at','updated_at'},
    "lab_test_info": {'test_name','test_code','category','tube_type','specimen_type','collection_instructions','storage_requirements','volume_required','quest_url','notes','is_favorite','panel_id','panel_ids','diagnosis_codes','created_at','updated_at'},
    "panels": {'panel_name','description','status','created_at','updated_at'},
    "procedures": {'procedure_name','description','category','cpt_code','icd10_codes','estimated_duration','average_cost','instructions','warnings','is_favorite','created_at','updated_at'},
    "providers": {'full_name','credentials','specialty','npi','phone','fax','email','address','city','state','zip','notes','status','taxonomy_code','created_at','updated_at'},
    "faqs": {'question','answer','category','sort_order','is_published','created_at','updated_at'},
}

IMPORTS = [
    ("education_topics", "EducationTopic_export.csv"),
    ("library_documents", "LibraryDocument_export.csv"),
    ("lab_test_info", "LabTestInfo_export.csv"),
    ("panels", "Panel_export.csv"),
    ("procedures", "Procedure_export.csv"),
    ("providers", "Provider_export.csv"),
    ("faqs", "FAQ_export.csv"),
]

def parse_val(v, key=None):
    if v == "": return None
    if v.lower() == "true": return True
    if v.lower() == "false": return False
    # Convert numeric strings
    try:
        f = float(v)
        if f == int(f) or key == 'version': return int(f)
        return f
    except: pass
    return v

def import_table(table, csv_file):
    valid_cols = TABLE_COLS[table]
    rows = []
    with open(csv_file, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            mapped = {}
            for k, v in row.items():
                k2 = RENAME.get(k, k)
                if k in SKIP_COLS or k2 not in valid_cols:
                    continue
                mapped[k2] = parse_val(v, k2)
                # Parse JSON arrays/objects
                if mapped[k2] and isinstance(mapped[k2], str) and mapped[k2].startswith('['):
                    try: mapped[k2] = json.loads(mapped[k2])
                    except: pass
                if mapped[k2] and isinstance(mapped[k2], str) and mapped[k2].startswith('{'):
                    try: mapped[k2] = json.loads(mapped[k2])
                    except: pass
            # FAQ special: order -> sort_order
            if table == "faqs" and "order" in row:
                mapped["sort_order"] = parse_val(row["order"])
            rows.append(mapped)
    
    success = 0
    failed = 0
    bad_cols = set()
    
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        # Remove known bad columns
        if bad_cols:
            batch = [{k:v for k,v in r.items() if k not in bad_cols} for r in batch]
        
        resp = requests.post(f"{SUPA}/rest/v1/{table}", headers=HEADERS, json=batch)
        if resp.status_code == 201:
            success += len(batch)
        elif "column" in resp.text.lower():
            # Try to find bad column and retry
            err = resp.json().get("message", "")
            import re
            m = re.search(r"the '(\w+)' column", err, re.I)
            if m:
                bad_col = m.group(1)
                bad_cols.add(bad_col)
                print(f"  Removing column '{bad_col}', retrying batch...")
                batch = [{k:v for k,v in r.items() if k not in bad_cols} for r in batch]
                resp2 = requests.post(f"{SUPA}/rest/v1/{table}", headers=HEADERS, json=batch)
                if resp2.status_code == 201:
                    success += len(batch)
                else:
                    failed += len(batch)
                    print(f"  Retry failed: {resp2.status_code} {resp2.text[:200]}")
            else:
                failed += len(batch)
                print(f"  Error: {resp.status_code} {resp.text[:200]}")
        else:
            failed += len(batch)
            print(f"  Error: {resp.status_code} {resp.text[:200]}")
    
    print(f"{table}: {success} inserted, {failed} failed" + (f" (dropped cols: {bad_cols})" if bad_cols else ""))

for table, csv_name in IMPORTS:
    print(f"\nImporting {table}...")
    import_table(table, csv_name)
