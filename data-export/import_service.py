#!/usr/bin/env python3
"""Import CSV data into CHC Hub Supabase tables using service_role key."""

import csv
import json
import urllib.request
import urllib.error
import os

SUPABASE_URL = "https://xtalelqzucijanmnpkol.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YWxlbHF6dWNpamFubW5wa29sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIwMTg0OCwiZXhwIjoyMDg2Nzc3ODQ4fQ.gxpivIg5Alf6Co-XWQvAO9mnyXKGiK8yrN3pMoZ5V_I"

SKIP_COLS = {"id", "created_by_id", "created_by", "is_sample"}
RENAME = {"created_date": "created_at", "updated_date": "updated_at"}

BASE = os.path.dirname(os.path.abspath(__file__))

TABLES = [
    ("education_topics", "EducationTopic_export.csv"),
    ("library_documents", "LibraryDocument_export.csv"),
    ("lab_test_info", "LabTestInfo_export.csv"),
    ("panels", "Panel_export.csv"),
    ("procedures", "Procedure_export.csv"),
    ("providers", "Provider_export.csv"),
    ("faqs", "FAQ_export.csv"),
]

def parse_value(v):
    if v == "": return None
    if v.lower() == "true": return True
    if v.lower() == "false": return False
    return v

def load_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            clean = {}
            for k, v in row.items():
                if k in SKIP_COLS: continue
                col = RENAME.get(k, k)
                clean[col] = parse_value(v)
            rows.append(clean)
        return rows

def post_batch(table, rows, skip_cols=None):
    if skip_cols:
        rows = [{k: v for k, v in r.items() if k not in skip_cols} for r in rows]
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    urllib.request.urlopen(req)

def import_table(table, csv_file):
    path = os.path.join(BASE, csv_file)
    rows = load_csv(path)
    if not rows:
        print(f"  {table}: 0 rows (empty CSV)")
        return 0

    # Discover bad columns by trying first row
    skip_cols = set()
    test_row = [rows[0]]
    while True:
        try:
            post_batch(table, test_row, skip_cols)
            # Delete the test row? No - just count it as inserted
            break
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            # Look for column not found error
            if e.code == 400 and "column" in body.lower():
                err = json.loads(body)
                msg = err.get("message", "")
                # Extract column name from message like "Could not find column 'xxx'"
                for col in list(test_row[0].keys()):
                    if col in msg and col not in skip_cols:
                        skip_cols.add(col)
                        break
                else:
                    print(f"  {table}: ERROR {body}")
                    return 0
                print(f"  {table}: skipping column from error: {skip_cols}")
            else:
                print(f"  {table}: ERROR {e.code} {body}")
                return 0

    # Insert remaining rows in batches (first row already inserted)
    remaining = rows[1:]
    inserted = 1
    for i in range(0, len(remaining), 50):
        batch = remaining[i:i+50]
        try:
            post_batch(table, batch, skip_cols)
            inserted += len(batch)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  {table}: batch error at {i}: {body}")
    
    print(f"  {table}: {inserted}/{len(rows)} rows inserted (skipped cols: {skip_cols or 'none'})")
    return inserted

if __name__ == "__main__":
    total = 0
    for table, csv_file in TABLES:
        count = import_table(table, csv_file)
        total += count
    print(f"\nTotal: {total} rows imported across {len(TABLES)} tables")
