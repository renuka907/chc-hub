-- Lab Network Lookup tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/xtalelqzucijanmnpkol/sql/new

-- =============================================================
-- 1. insurance_lab_networks
--    Maps an insurance plan -> preferred lab (LabCorp / Quest / Both / Other)
-- =============================================================
CREATE TABLE IF NOT EXISTS insurance_lab_networks (
    id uuid primary key default gen_random_uuid(),
    carrier text not null,             -- e.g. "Aetna", "Florida Blue", "UnitedHealthcare", "Cigna"
    plan_type text,                    -- "PPO", "HMO", "EPO", "Medicare Advantage", "Medicaid", "Tricare", "Any"
    state text default 'FL',           -- 2-letter state code; 'ALL' for nationwide rules
    preferred_lab text not null,       -- "LabCorp", "Quest", "Both", "Other"
    secondary_lab text,                -- backup option, if any
    notes text,                        -- free-form: contract details, exceptions, caveats
    source_url text,                   -- where this rule was verified
    last_verified date,
    status text default 'active',      -- 'active' | 'inactive'
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_lab_carrier ON insurance_lab_networks(carrier);
CREATE INDEX IF NOT EXISTS idx_insurance_lab_state ON insurance_lab_networks(state);

ALTER TABLE insurance_lab_networks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_read_insurance_lab" ON insurance_lab_networks;
CREATE POLICY "anyone_read_insurance_lab" ON insurance_lab_networks FOR SELECT USING (true);
DROP POLICY IF EXISTS "anyone_write_insurance_lab" ON insurance_lab_networks;
CREATE POLICY "anyone_write_insurance_lab" ON insurance_lab_networks FOR ALL USING (true) WITH CHECK (true);

-- =============================================================
-- 2. lab_test_frequencies
--    How often a payer covers a given test (per patient)
-- =============================================================
CREATE TABLE IF NOT EXISTS lab_test_frequencies (
    id uuid primary key default gen_random_uuid(),
    test_name text not null,           -- "Lipid Panel", "HbA1c", "TSH", "Pap Smear", "Mammogram", "Vitamin D"
    test_codes text,                   -- comma-separated CPT codes (e.g. "80061, 82465, 83718, 84478, 84479")
    carrier text,                      -- "Medicare", "Aetna", "Florida Blue", or "All" for general guidelines
    plan_type text,                    -- "Medicare", "Commercial", "Medicaid", "All"
    frequency text not null,           -- "Annual", "Every 2 years", "Every 3 years", "Every 5 years", "One-time", "As medically necessary"
    interval_months integer,           -- numeric form of frequency for math (12, 24, 36, 60, null)
    age_min integer,                   -- minimum age criteria (null = any)
    age_max integer,                   -- max age (null = any)
    gender text,                       -- 'F', 'M', 'Any'
    conditions text,                   -- "Diabetes diagnosis required", "Family hx", etc.
    diagnosis_required text,           -- ICD-10 codes that justify coverage
    notes text,
    source_url text,
    last_verified date,
    status text default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_lab_freq_test ON lab_test_frequencies(test_name);
CREATE INDEX IF NOT EXISTS idx_lab_freq_carrier ON lab_test_frequencies(carrier);

ALTER TABLE lab_test_frequencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_read_lab_freq" ON lab_test_frequencies;
CREATE POLICY "anyone_read_lab_freq" ON lab_test_frequencies FOR SELECT USING (true);
DROP POLICY IF EXISTS "anyone_write_lab_freq" ON lab_test_frequencies;
CREATE POLICY "anyone_write_lab_freq" ON lab_test_frequencies FOR ALL USING (true) WITH CHECK (true);

-- =============================================================
-- SEED DATA: Florida-focused insurance -> lab mappings
-- =============================================================
INSERT INTO insurance_lab_networks (carrier, plan_type, state, preferred_lab, secondary_lab, notes, last_verified) VALUES
('Aetna', 'PPO', 'FL', 'LabCorp', 'Quest', 'Both in-network nationally. LabCorp is Aetna''s preferred national lab.', current_date),
('Aetna', 'HMO', 'FL', 'LabCorp', 'Quest', 'Both typically in-network. Verify with member ID for HMO products.', current_date),
('Aetna', 'Medicare Advantage', 'FL', 'LabCorp', 'Quest', 'Both labs cover Aetna MA plans.', current_date),
('Florida Blue', 'PPO', 'FL', 'LabCorp', 'Quest', 'BlueCross BlueShield of Florida — LabCorp preferred provider.', current_date),
('Florida Blue', 'HMO', 'FL', 'LabCorp', null, 'BlueOptions/BlueSelect HMO networks favor LabCorp. Quest may be out-of-network for some HMO plans.', current_date),
('Florida Blue', 'BlueMedicare', 'FL', 'LabCorp', 'Quest', 'Medicare Advantage — both usually covered.', current_date),
('UnitedHealthcare', 'PPO', 'FL', 'Quest', 'LabCorp', 'UHC has exclusive contract with Quest for many commercial plans — Quest is preferred. LabCorp in-network for some plans.', current_date),
('UnitedHealthcare', 'HMO', 'FL', 'Quest', null, 'UHC HMO products often REQUIRE Quest — verify before drawing at LabCorp.', current_date),
('UnitedHealthcare', 'Medicare Advantage', 'FL', 'Quest', 'LabCorp', 'AARP/UHC MA plans — Quest preferred. LabCorp may be in-network depending on plan.', current_date),
('Cigna', 'PPO', 'FL', 'LabCorp', 'Quest', 'Both in-network nationally for Cigna commercial.', current_date),
('Cigna', 'HMO', 'FL', 'LabCorp', 'Quest', 'Both typically in-network.', current_date),
('Humana', 'PPO', 'FL', 'LabCorp', 'Quest', 'Both in-network. Humana has national agreements with both.', current_date),
('Humana', 'Medicare Advantage', 'FL', 'LabCorp', 'Quest', 'Humana Gold Plus / Choice — both covered.', current_date),
('Tricare', 'Prime', 'FL', 'LabCorp', 'Quest', 'Both covered. Use any network provider.', current_date),
('Tricare', 'Select', 'FL', 'LabCorp', 'Quest', 'Both covered.', current_date),
('Medicare', 'Original', 'ALL', 'LabCorp', 'Quest', 'Both accept assignment. No referral required for routine labs.', current_date),
('Medicaid', 'Florida Medicaid', 'FL', 'LabCorp', 'Quest', 'FL Medicaid generally covers both. MMA plans may have plan-specific preferences.', current_date),
('Sunshine Health', 'Medicaid MMA', 'FL', 'LabCorp', 'Quest', 'Centene plan — verify with member ID. LabCorp typically preferred.', current_date),
('Simply Healthcare', 'Medicaid MMA', 'FL', 'LabCorp', null, 'Anthem subsidiary — LabCorp preferred.', current_date),
('WellCare', 'Medicaid MMA', 'FL', 'Quest', 'LabCorp', 'WellCare/Centene — Quest commonly preferred for Medicaid.', current_date),
('Molina Healthcare', 'Medicaid', 'FL', 'LabCorp', 'Quest', 'Both typically in-network.', current_date),
('Anthem', 'PPO', 'FL', 'LabCorp', 'Quest', 'LabCorp preferred for Anthem BCBS plans nationally.', current_date),
('Oscar', 'Marketplace', 'FL', 'LabCorp', null, 'LabCorp is Oscar''s preferred lab partner.', current_date),
('Ambetter', 'Marketplace', 'FL', 'Quest', 'LabCorp', 'Centene-owned — Quest typically preferred.', current_date),
('Bright Health', 'Marketplace', 'FL', 'LabCorp', 'Quest', 'Both in-network typically.', current_date)
ON CONFLICT DO NOTHING;

-- =============================================================
-- SEED DATA: Common test frequency rules (Medicare-aligned, widely used)
-- =============================================================
INSERT INTO lab_test_frequencies (test_name, test_codes, carrier, plan_type, frequency, interval_months, age_min, age_max, gender, conditions, diagnosis_required, notes, last_verified) VALUES
-- Cardiovascular / Lipids
('Lipid Panel', '80061, 82465, 83718, 84478', 'Medicare', 'Medicare', 'Every 5 years (screening)', 60, 20, null, 'Any', 'Screening for healthy adults', 'Z13.220', 'More frequent if abnormal or on statin therapy (every 6-12 mo).', current_date),
('Lipid Panel', '80061', 'All', 'Commercial', 'Annual', 12, 20, null, 'Any', 'Annual under most commercial preventive care benefits (ACA-compliant)', null, 'ACA covers without cost-share for adults at risk.', current_date),

-- Diabetes
('HbA1c', '83036', 'Medicare', 'Medicare', 'Every 3 months (diabetic)', 3, null, null, 'Any', 'Diabetes diagnosis required', 'E11.9, E10.9', 'Up to 4x/year for diabetics. Pre-diabetes: every 6-12 mo.', current_date),
('HbA1c Screening', '83036', 'Medicare', 'Medicare', 'Annual (screening)', 12, 40, 70, 'Any', 'Diabetes screening — high risk or BMI >25', 'Z13.1', 'Medicare covers annual diabetes screening for at-risk adults.', current_date),
('Fasting Glucose', '82947', 'Medicare', 'Medicare', 'Annual (screening)', 12, 40, 70, 'Any', 'Diabetes screening', 'Z13.1', null, current_date),

-- Thyroid
('TSH', '84443', 'All', 'All', 'Annual (with diagnosis)', 12, null, null, 'Any', 'Routine screening NOT covered without symptoms — diagnosis required.', 'E03.9, E07.9, R63.5', 'Often denied without supporting dx code. Add fatigue/weight change codes if appropriate.', current_date),

-- Cancer screening - Women
('Pap Smear', '88142, 88143, 88164, 88165', 'Medicare', 'Medicare', 'Every 2 years (low risk)', 24, 21, 65, 'F', 'Low-risk women age 21-65', 'Z12.4', 'Annual if high-risk. Co-test with HPV every 5 years preferred age 30-65.', current_date),
('Pap Smear', '88142', 'All', 'Commercial', 'Every 3 years (low risk)', 36, 21, 65, 'F', 'ACA preventive — every 3 years for low-risk women 21-65.', 'Z12.4', 'Co-testing with HPV every 5 years for 30-65.', current_date),
('HPV Co-test', '87624', 'All', 'All', 'Every 5 years', 60, 30, 65, 'F', 'Cervical cancer screening — co-test with Pap.', 'Z11.51', null, current_date),
('Mammogram (screening)', '77067', 'Medicare', 'Medicare', 'Annual', 12, 40, null, 'F', 'Annual screening mammogram', 'Z12.31', 'Medicare covers annual screening starting age 40.', current_date),
('Mammogram (screening)', '77067', 'All', 'Commercial', 'Annual', 12, 40, null, 'F', 'ACA preventive — annual.', 'Z12.31', null, current_date),

-- Cancer screening - Men
('PSA', '84153', 'Medicare', 'Medicare', 'Annual', 12, 50, null, 'M', 'Prostate cancer screening — men 50+', 'Z12.5', 'Medicare covers annual PSA starting age 50.', current_date),
('PSA', '84153', 'All', 'Commercial', 'Annual', 12, 50, null, 'M', null, 'Z12.5', null, current_date),

-- Cancer screening - Colorectal
('Colonoscopy (screening)', '45378, G0121', 'Medicare', 'Medicare', 'Every 10 years', 120, 45, 85, 'Any', 'Average risk', 'Z12.11', 'Every 2 years if high-risk. After polyp removal, surveillance interval varies.', current_date),
('FIT/FOBT', '82270, 81528', 'All', 'All', 'Annual', 12, 45, 85, 'Any', 'Colorectal cancer screening alternative to colonoscopy', 'Z12.11', null, current_date),

-- Bone density
('DEXA Scan', '77080', 'Medicare', 'Medicare', 'Every 2 years', 24, 65, null, 'F', 'Women 65+ or postmenopausal high-risk', 'Z13.820', 'Earlier if estrogen-deficient or fracture hx. Men 70+ also covered.', current_date),
('DEXA Scan', '77080', 'Medicare', 'Medicare', 'Every 2 years', 24, 70, null, 'M', 'Men 70+', 'Z13.820', null, current_date),

-- Vitamins / Nutritional
('Vitamin D', '82306', 'Medicare', 'Medicare', 'Only with diagnosis', null, null, null, 'Any', 'NOT covered for routine screening. Requires specific diagnosis (osteoporosis, malabsorption, CKD, etc.)', 'E55.9, M81.0, N18', 'Medicare frequently denies without diagnosis. Patient may be billed.', current_date),
('Vitamin B12', '82607', 'All', 'All', 'Annual (with symptoms)', 12, null, null, 'Any', 'Anemia, neuropathy, or deficiency symptoms required', 'D51.9, E53.8', null, current_date),
('Ferritin', '82728', 'All', 'All', 'As medically necessary', null, null, null, 'Any', 'Anemia workup, iron deficiency suspected', 'D50.9, R53.83', null, current_date),
('Iron Panel', '83540, 83550, 84466', 'All', 'All', 'As medically necessary', null, null, null, 'Any', 'Anemia evaluation', 'D50.9', null, current_date),

-- Hormone testing (relevant for HRT practice)
('Estradiol', '82670', 'All', 'All', 'As medically necessary', null, null, null, 'F', 'Menopause symptoms, HRT monitoring, infertility workup', 'N95.1, E28.39', 'Coverage varies — link to clinical indication. Often denied for HRT monitoring without symptoms documented.', current_date),
('Testosterone, Total', '84403', 'All', 'All', 'As medically necessary', null, null, null, 'Any', 'Hypogonadism workup or monitoring TRT', 'E29.1, E29.9', 'For women: symptoms must be documented. Men: low T symptoms required.', current_date),
('Testosterone, Free', '84402', 'All', 'All', 'As medically necessary', null, null, null, 'Any', 'Hypogonadism — typically with total T', 'E29.1', null, current_date),
('FSH/LH', '83001, 83002', 'All', 'All', 'As medically necessary', null, null, null, 'Any', 'Menopause confirmation, fertility, hypogonadism', 'N95.1, E28.39, E29.1', null, current_date),
('SHBG', '84270', 'All', 'All', 'As medically necessary', null, null, null, 'Any', 'Hormone evaluation', 'E29.9, E28.39', 'Coverage varies — bundle with rationale.', current_date),
('Progesterone', '84144', 'All', 'All', 'As medically necessary', null, null, null, 'F', 'Fertility workup, abnormal bleeding, HRT', 'N91.5, N92.6', null, current_date),

-- Other common
('CBC', '85025', 'All', 'All', 'Annual (with diagnosis) or as needed', 12, null, null, 'Any', 'No routine screening — requires symptoms or diagnosis', 'D64.9, R53.83', 'Almost always covered with appropriate dx.', current_date),
('CMP', '80053', 'All', 'All', 'Annual (with diagnosis) or as needed', 12, null, null, 'Any', 'Requires diagnosis for coverage', 'E11.9, I10, N18.9', null, current_date),
('UA', '81003', 'All', 'All', 'As medically necessary', null, null, null, 'Any', 'UTI symptoms, pregnancy, diabetes monitoring', 'R30.0, N39.0', null, current_date),
('Hepatitis C Screen', '86803', 'Medicare', 'Medicare', 'One-time (universal screening)', null, 18, 79, 'Any', 'USPSTF universal one-time screen', 'Z11.59', 'Annual for high-risk (IVDU).', current_date),
('HIV Screen', '86703', 'All', 'All', 'Annual (at-risk)', 12, 15, 65, 'Any', 'USPSTF — at least once 15-65, annually if at-risk', 'Z11.4', null, current_date)
ON CONFLICT DO NOTHING;
