import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, RotateCcw, Printer, Search, X, CheckCircle2 } from "lucide-react";

// ── Radiology Studies ──────────────────────────────────────────────────────
const STUDIES = [
  {
    id: "dexa",
    category: "Bone & Body Composition",
    name: "DEXA Scan — Bone Density",
    cptHint: "77080 (axial), 77081 (appendicular)",
    icd10Suggestions: [
      { code: "Z13.820", desc: "Encounter for screening for osteoporosis" },
      { code: "M81.0", desc: "Age-related osteoporosis without pathological fracture" },
      { code: "M85.80", desc: "Osteopenia / low bone density, unspecified site" },
      { code: "Z79.891", desc: "Long-term (current) use of corticosteroids" },
      { code: "E28.310", desc: "Symptomatic premature menopause (estrogen deficiency)" },
      { code: "Z90.710", desc: "Acquired absence of uterus and cervix (post-hysterectomy)" },
      { code: "M80.08XA", desc: "Age-related osteoporosis with pathological fracture, vertebra" },
      { code: "Z79.899", desc: "Long-term use of other medication (aromatase inhibitor)" },
    ],
    prepInstructions: [
      "Do NOT take calcium supplements for 24 hours before the scan.",
      "Avoid barium contrast studies or nuclear medicine tests within 7 days.",
      "Wear comfortable, loose-fitting clothing without metal zippers, buttons, or underwire bras.",
      "Remove all jewelry, piercings, and metal objects before the scan.",
      "Inform the technologist if you are pregnant or think you may be pregnant.",
      "The scan takes approximately 10–20 minutes. You will lie still on a padded table.",
      "No fasting required.",
    ],
    patientNote: "This is a low-radiation X-ray test that measures bone strength. It is painless and non-invasive.",
  },
  {
    id: "mammo_screening",
    category: "Breast Imaging",
    name: "Mammogram — Screening",
    cptHint: "77067 (bilateral screening)",
    icd10Suggestions: [
      { code: "Z12.31", desc: "Encounter for screening mammogram for malignant neoplasm of breast" },
      { code: "Z80.3", desc: "Family history of malignant neoplasm of breast" },
      { code: "Z85.3", desc: "Personal history of malignant neoplasm of breast" },
      { code: "Z79.890", desc: "Long-term use of hormone replacement therapy" },
    ],
    prepInstructions: [
      "Do NOT apply deodorant, antiperspirant, powder, lotion, or perfume to your underarms or breasts on the day of the exam.",
      "Wear a two-piece outfit — you will need to undress from the waist up.",
      "If you have had previous mammograms at a different facility, bring those images or request records transfer.",
      "Inform the technologist of any breast symptoms, surgeries, implants, or hormone use.",
      "Schedule your mammogram 1 week after your menstrual period to minimize breast tenderness.",
      "The exam takes approximately 15–20 minutes.",
    ],
    patientNote: "A screening mammogram is a routine X-ray to check for early signs of breast cancer before symptoms develop.",
  },
  {
    id: "mammo_diagnostic",
    category: "Breast Imaging",
    name: "Mammogram — Diagnostic",
    cptHint: "77066 (bilateral diagnostic), 77065 (unilateral)",
    icd10Suggestions: [
      { code: "N63.10", desc: "Unspecified lump in the right breast, unspecified quadrant" },
      { code: "N63.20", desc: "Unspecified lump in the left breast, unspecified quadrant" },
      { code: "N64.4", desc: "Mastodynia (breast pain)" },
      { code: "N64.51", desc: "Induration of breast" },
      { code: "N64.52", desc: "Nipple discharge" },
      { code: "Z85.3", desc: "Personal history of malignant neoplasm of breast" },
      { code: "R92.8", desc: "Other abnormal and inconclusive findings on diagnostic imaging of breast" },
    ],
    prepInstructions: [
      "Do NOT apply deodorant, antiperspirant, powder, lotion, or perfume to your underarms or breasts on the day of the exam.",
      "Wear a two-piece outfit — you will need to undress from the waist up.",
      "Bring any prior mammogram images or request records transfer from previous facilities.",
      "Inform the technologist of your specific symptoms, when they started, and which side is affected.",
      "A diagnostic mammogram is a more detailed exam that may take longer — plan for 30–60 minutes.",
    ],
    patientNote: "A diagnostic mammogram is ordered to evaluate a specific breast concern such as a lump, pain, nipple discharge, or follow-up on an abnormal screening result.",
  },
  {
    id: "breast_us",
    category: "Breast Imaging",
    name: "Breast Ultrasound",
    cptHint: "76641 (complete), 76642 (limited/targeted)",
    icd10Suggestions: [
      { code: "N63.10", desc: "Unspecified lump in the right breast, unspecified quadrant" },
      { code: "N63.20", desc: "Unspecified lump in the left breast, unspecified quadrant" },
      { code: "N64.4", desc: "Mastodynia (breast pain)" },
      { code: "N64.51", desc: "Induration of breast" },
      { code: "N64.52", desc: "Nipple discharge" },
      { code: "R92.8", desc: "Other abnormal and inconclusive findings on diagnostic imaging" },
      { code: "Z80.3", desc: "Family history of malignant neoplasm of breast" },
      { code: "Q83.9", desc: "Dense breast tissue evaluation" },
    ],
    prepInstructions: [
      "No special preparation is required for a breast ultrasound.",
      "Wear comfortable, loose-fitting clothing.",
      "Do NOT apply lotion or powder to the breast area on the day of the exam.",
      "You will lie on your back and side while gel is applied to the breast for the ultrasound wand.",
      "The exam is painless and takes approximately 15–30 minutes.",
    ],
    patientNote: "Breast ultrasound uses sound waves (no radiation) to evaluate breast tissue, especially useful for dense breasts or evaluating a lump found on physical exam or mammogram.",
  },
  {
    id: "kidney_us",
    category: "Abdominal / Urologic",
    name: "Kidney Ultrasound (Renal)",
    cptHint: "76770 (complete retroperitoneal), 76775 (limited)",
    icd10Suggestions: [
      { code: "N28.9", desc: "Kidney disorder, unspecified" },
      { code: "R31.9", desc: "Hematuria, unspecified" },
      { code: "N20.0", desc: "Calculus of kidney (kidney stone)" },
      { code: "N13.30", desc: "Unilateral hydronephrosis without obstruction" },
      { code: "R80.9", desc: "Proteinuria, unspecified" },
      { code: "I10", desc: "Essential (primary) hypertension — renovascular evaluation" },
      { code: "N18.9", desc: "Chronic kidney disease, unspecified" },
      { code: "Z87.442", desc: "Personal history of urinary calculi" },
    ],
    prepInstructions: [
      "Drink 32 oz (4 glasses) of water 1 hour before the exam and do NOT urinate until after the scan.",
      "A full bladder helps provide better imaging of the kidneys and bladder.",
      "Do NOT eat or drink anything other than water for 4 hours before the exam.",
      "Wear comfortable, loose-fitting clothing.",
      "The exam is painless and takes approximately 20–30 minutes.",
      "Inform the technologist of any relevant symptoms (pain, blood in urine, frequent infections).",
    ],
    patientNote: "This is a painless ultrasound exam that uses sound waves to evaluate your kidneys and bladder for stones, cysts, or other abnormalities. No radiation is used.",
  },
  {
    id: "thyroid_us",
    category: "Head & Neck",
    name: "Thyroid Ultrasound",
    cptHint: "76536",
    icd10Suggestions: [
      { code: "E04.9", desc: "Nontoxic goiter, unspecified (thyroid enlargement)" },
      { code: "E04.1", desc: "Nontoxic single thyroid nodule" },
      { code: "E04.2", desc: "Nontoxic multinodular goiter" },
      { code: "R22.1", desc: "Localized swelling, mass and lump, neck" },
      { code: "E05.90", desc: "Thyrotoxicosis, unspecified, without thyrotoxic crisis" },
      { code: "E06.3", desc: "Autoimmune thyroiditis (Hashimoto's)" },
      { code: "E03.9", desc: "Hypothyroidism, unspecified" },
      { code: "Z85.850", desc: "Personal history of malignant neoplasm of thyroid" },
      { code: "D34", desc: "Benign neoplasm of thyroid gland" },
    ],
    prepInstructions: [
      "No special preparation is required.",
      "Wear comfortable, loose-fitting clothing with an open or low neckline.",
      "Remove all necklaces and neck jewelry before the exam.",
      "The exam involves lying on your back with a small pillow under your neck/shoulders.",
      "Gel will be applied to your neck and a small wand will be moved across the area.",
      "The exam is painless and takes approximately 15–30 minutes.",
    ],
    patientNote: "A thyroid ultrasound uses sound waves (no radiation) to evaluate the size, shape, and structure of your thyroid gland and detect nodules or abnormalities.",
  },
  {
    id: "parathyroid_us",
    category: "Head & Neck",
    name: "Parathyroid Ultrasound",
    cptHint: "76536 (same code, note parathyroid in order)",
    icd10Suggestions: [
      { code: "E21.0", desc: "Primary hyperparathyroidism" },
      { code: "E21.1", desc: "Secondary hyperparathyroidism, not elsewhere classified" },
      { code: "E83.52", desc: "Hypercalcemia (elevated calcium)" },
      { code: "E21.3", desc: "Hyperparathyroidism, unspecified" },
      { code: "D35.1", desc: "Benign neoplasm of parathyroid gland (adenoma)" },
    ],
    prepInstructions: [
      "No special preparation is required.",
      "Wear comfortable, loose-fitting clothing with an open or low neckline.",
      "Remove all necklaces and neck jewelry before the exam.",
      "Inform the technologist if you have had prior neck surgery or a known parathyroid adenoma.",
      "The exam is painless and takes approximately 20–30 minutes.",
      "Note: This study specifically evaluates for parathyroid gland enlargement — please indicate this on the requisition.",
    ],
    patientNote: "A parathyroid ultrasound looks for enlarged parathyroid glands that may be causing elevated calcium or parathyroid hormone (PTH) levels.",
  },
  {
    id: "pelvic_us",
    category: "Pelvic / GYN",
    name: "Pelvic Ultrasound (Transabdominal)",
    cptHint: "76856 (complete), 76857 (limited)",
    icd10Suggestions: [
      { code: "N93.9", desc: "Abnormal uterine bleeding, unspecified" },
      { code: "D25.9", desc: "Leiomyoma of uterus, unspecified (fibroids)" },
      { code: "N83.20", desc: "Unspecified ovarian cysts" },
      { code: "N94.6", desc: "Dysmenorrhea, unspecified (pelvic pain)" },
      { code: "N80.9", desc: "Endometriosis, unspecified" },
      { code: "R10.2", desc: "Pelvic and perineal pain" },
      { code: "Z12.72", desc: "Encounter for screening for malignant neoplasm of vagina" },
    ],
    prepInstructions: [
      "Drink 32 oz (4 glasses) of water 1 hour before the exam and do NOT urinate until after the scan.",
      "A full bladder is required for transabdominal pelvic ultrasound — this helps visualize the uterus and ovaries.",
      "Do NOT eat or drink (other than water for bladder preparation) for 2 hours before the exam.",
      "Wear comfortable, loose-fitting two-piece clothing.",
      "The exam takes approximately 20–30 minutes.",
    ],
    patientNote: "A pelvic ultrasound uses sound waves (no radiation) to evaluate the uterus, ovaries, and pelvis. You must have a full bladder for this exam.",
  },
  {
    id: "tv_us",
    category: "Pelvic / GYN",
    name: "Pelvic Ultrasound (Transvaginal)",
    cptHint: "76830",
    icd10Suggestions: [
      { code: "N93.9", desc: "Abnormal uterine bleeding, unspecified" },
      { code: "N83.20", desc: "Unspecified ovarian cysts" },
      { code: "D25.9", desc: "Leiomyoma of uterus, unspecified (fibroids)" },
      { code: "N80.9", desc: "Endometriosis, unspecified" },
      { code: "R10.2", desc: "Pelvic and perineal pain" },
      { code: "N85.00", desc: "Endometrial hyperplasia, unspecified" },
    ],
    prepInstructions: [
      "Empty your bladder completely before the exam (opposite of transabdominal US).",
      "You will be asked to undress from the waist down and covered with a drape.",
      "A small, smooth ultrasound probe covered with a protective cover and gel will be gently inserted.",
      "The exam is generally well tolerated and takes approximately 15–20 minutes.",
      "Inform the technologist of any discomfort during the exam.",
      "You may feel mild pressure but should not feel significant pain.",
    ],
    patientNote: "A transvaginal ultrasound provides a clearer, more detailed view of the uterus and ovaries from the inside. Please empty your bladder completely before arriving.",
  },
  {
    id: "carotid_us",
    category: "Vascular",
    name: "Carotid Duplex Ultrasound",
    cptHint: "93880 (complete bilateral), 93882 (unilateral/limited)",
    icd10Suggestions: [
      { code: "I65.29", desc: "Occlusion and stenosis of unspecified carotid artery" },
      { code: "I73.9", desc: "Peripheral vascular disease, unspecified" },
      { code: "I10", desc: "Essential hypertension with cardiovascular risk" },
      { code: "E78.5", desc: "Hyperlipidemia, unspecified" },
      { code: "Z82.49", desc: "Family history of ischemic heart disease and other diseases of the circulatory system" },
      { code: "G45.9", desc: "Transient cerebral ischemic attack, unspecified (TIA)" },
    ],
    prepInstructions: [
      "No special preparation is required.",
      "Wear comfortable, loose-fitting clothing with an open or low neckline.",
      "Remove all necklaces and neck jewelry.",
      "Avoid smoking for at least 2 hours before the exam.",
      "Continue taking all medications as prescribed unless your provider says otherwise.",
      "The exam takes approximately 30–45 minutes.",
    ],
    patientNote: "A carotid duplex ultrasound checks blood flow through the arteries in your neck that supply blood to your brain. This test helps assess risk for stroke.",
  },
  {
    id: "abdominal_us",
    category: "Abdominal / Urologic",
    name: "Abdominal Ultrasound (Complete)",
    cptHint: "76700 (complete), 76705 (limited)",
    icd10Suggestions: [
      { code: "R10.9", desc: "Unspecified abdominal pain" },
      { code: "K75.9", desc: "Inflammatory liver disease, unspecified" },
      { code: "K76.0", desc: "Fatty (change of) liver, not elsewhere classified (fatty liver / NAFLD)" },
      { code: "K80.20", desc: "Calculus of gallbladder without cholecystitis" },
      { code: "R16.0", desc: "Hepatomegaly, not elsewhere classified" },
      { code: "R16.1", desc: "Splenomegaly, not elsewhere classified" },
      { code: "K86.1", desc: "Other chronic pancreatitis" },
      { code: "E78.5", desc: "Hyperlipidemia (metabolic workup)" },
    ],
    prepInstructions: [
      "Do NOT eat or drink anything (except water) for 6–8 hours before the exam (NPO).",
      "You may take medications with a small sip of water.",
      "Avoid gum, hard candy, and smoking before the exam.",
      "Wear comfortable, loose-fitting two-piece clothing.",
      "The exam takes approximately 20–45 minutes depending on complexity.",
    ],
    patientNote: "An abdominal ultrasound evaluates your liver, gallbladder, spleen, pancreas, and kidneys. Fasting is required for the best image quality.",
  },
  {
    id: "ct_calcium",
    category: "Cardiac",
    name: "CT Calcium Score (Coronary Artery Calcium)",
    cptHint: "75571",
    icd10Suggestions: [
      { code: "Z13.6", desc: "Encounter for screening for cardiovascular disorders" },
      { code: "I25.10", desc: "Atherosclerotic heart disease of native coronary artery without angina pectoris" },
      { code: "Z82.49", desc: "Family history of ischemic heart disease and other diseases of the circulatory system" },
      { code: "E78.5", desc: "Hyperlipidemia, unspecified" },
      { code: "I10", desc: "Essential (primary) hypertension" },
      { code: "E11.9", desc: "Type 2 diabetes mellitus without complications" },
      { code: "F17.210", desc: "Nicotine dependence, cigarettes, uncomplicated (smoking history)" },
      { code: "E66.9", desc: "Obesity, unspecified (BMI ≥30)" },
      { code: "Z87.891", desc: "Personal history of nicotine dependence" },
    ],
    prepInstructions: [
      "Do NOT consume caffeine (coffee, tea, energy drinks, soda) for 4 hours before the exam.",
      "Avoid strenuous exercise for 4 hours before the exam — elevated heart rate affects image quality.",
      "Continue all medications as prescribed unless your provider instructs otherwise.",
      "You do NOT need to fast for this test.",
      "Wear comfortable, loose-fitting clothing without metal buttons or zippers.",
      "Remove all jewelry, underwire bras, and metal objects before the scan.",
      "Inform the technologist if you have a pacemaker, defibrillator, or other implanted device.",
      "The scan takes approximately 10–15 minutes. You will be asked to hold your breath briefly during the scan.",
      "No IV contrast (dye) is used for this test.",
    ],
    patientNote: "A CT calcium score is a painless, non-invasive CT scan that measures calcium deposits in the arteries of your heart. Your score helps determine your risk for a heart attack — a score of 0 means no detectable plaque.",
  },
  {
    id: "cta_coronary",
    category: "Cardiac",
    name: "CTA — Coronary (CT Angiography)",
    cptHint: "75574 (with contrast, including 3D rendering)",
    icd10Suggestions: [
      { code: "I25.10", desc: "Atherosclerotic heart disease of native coronary artery without angina pectoris" },
      { code: "R07.9", desc: "Chest pain, unspecified" },
      { code: "R07.89", desc: "Other chest pain (atypical chest pain)" },
      { code: "I20.9", desc: "Angina pectoris, unspecified" },
      { code: "Z82.49", desc: "Family history of ischemic heart disease" },
      { code: "I25.110", desc: "Atherosclerotic heart disease of native coronary artery with unstable angina pectoris" },
      { code: "R00.8", desc: "Other abnormalities of heart beat (palpitations)" },
      { code: "Z13.6", desc: "Encounter for screening for cardiovascular disorders" },
    ],
    prepInstructions: [
      "Do NOT consume caffeine for at least 12 hours before the exam (coffee, tea, energy drinks, chocolate, soda).",
      "Avoid strenuous exercise for 12 hours before the exam.",
      "Do NOT eat or drink anything for 4 hours before the exam (NPO), except small sips of water for medications.",
      "Continue all medications as prescribed — beta-blockers are especially important to take as directed.",
      "Inform your provider and the facility if you have kidney disease, diabetes on metformin, or prior contrast reactions — IV contrast (dye) IS used for this exam.",
      "If you take metformin, you may need to hold it for 48 hours after the scan (facility will advise).",
      "You will have an IV placed in your arm for the contrast injection.",
      "Remove all jewelry, underwire bras, and metal objects before the scan.",
      "The scan takes approximately 15–30 minutes. You will be asked to hold your breath briefly.",
      "Your heart rate needs to be below 65 bpm for optimal images — a beta-blocker may be given before the scan.",
    ],
    patientNote: "A coronary CTA uses CT imaging with IV contrast to create detailed 3D images of the arteries supplying your heart. It is used to evaluate blockages or narrowing. IV dye is required — please inform the facility of any prior dye reactions or kidney concerns.",
  },
  {
    id: "cta_chest",
    category: "Vascular",
    name: "CTA — Chest (Pulmonary / Aorta)",
    cptHint: "71275 (with contrast, pulmonary), 71270 (chest CT with contrast)",
    icd10Suggestions: [
      { code: "I26.99", desc: "Other pulmonary embolism without acute cor pulmonale (PE)" },
      { code: "R06.09", desc: "Other forms of dyspnea (shortness of breath)" },
      { code: "I71.2", desc: "Thoracic aortic aneurysm, without rupture" },
      { code: "R07.9", desc: "Chest pain, unspecified" },
      { code: "I71.4", desc: "Abdominal aortic aneurysm, without rupture" },
      { code: "R09.89", desc: "Other specified symptoms and signs involving the circulatory and respiratory systems" },
      { code: "Z82.49", desc: "Family history of cardiovascular disease" },
    ],
    prepInstructions: [
      "Inform the facility of any prior contrast (dye) reactions, kidney disease, or diabetes on metformin.",
      "Do NOT eat or drink for 4 hours before the exam except small sips of water for medications.",
      "Continue all medications as prescribed unless instructed otherwise.",
      "You will have an IV placed in your arm for the contrast injection.",
      "Remove all jewelry, underwire bras, and metal objects before the scan.",
      "Inform the technologist if you are pregnant or think you may be pregnant.",
      "You will be asked to hold your breath briefly during the scan.",
      "The scan takes approximately 15–20 minutes.",
      "If you take metformin, you may need to hold it for 48 hours after the scan.",
    ],
    patientNote: "A chest CTA uses CT imaging with IV contrast to evaluate the blood vessels in your chest, including the pulmonary arteries (for clots) and the aorta. IV dye is required — please notify the facility of any kidney concerns or prior dye reactions.",
  },
  {
    id: "echocardiogram",
    category: "Cardiac",
    name: "Echocardiogram (Transthoracic)",
    cptHint: "93306 (complete with Doppler), 93307 (without Doppler)",
    icd10Suggestions: [
      { code: "I51.9", desc: "Heart disease, unspecified — cardiac evaluation" },
      { code: "I10", desc: "Essential hypertension — cardiac monitoring" },
      { code: "R00.8", desc: "Other abnormalities of heart beat (palpitations)" },
      { code: "R06.09", desc: "Other forms of dyspnea (shortness of breath)" },
      { code: "I42.9", desc: "Cardiomyopathy, unspecified" },
      { code: "Z82.49", desc: "Family history of cardiovascular disease" },
    ],
    prepInstructions: [
      "No special preparation is required in most cases.",
      "Wear comfortable, loose-fitting clothing.",
      "Continue taking all medications as prescribed.",
      "You will lie on your left side on an exam table.",
      "Electrodes (small stickers) will be placed on your chest to monitor your heart rhythm.",
      "The exam takes approximately 30–60 minutes.",
      "Avoid heavy meals just before the exam if possible.",
    ],
    patientNote: "An echocardiogram uses sound waves to create detailed images of your heart's structure and how it is pumping. It is painless and does not use radiation.",
  },
];

const CATEGORIES = [...new Set(STUDIES.map(s => s.category))];

const FACILITY = {
  name: "Regional Radiology / RadNet",
  address: "Fort Myers, FL",
  phone: "(239) 000-0000",
  fax: "(239) 000-0001",
};

const CHC = {
  name: "Contemporary Health Center",
  address: "6150 Diamond Center Court #400, Fort Myers, FL 33912",
  phone: "239-561-9191",
  fax: "239-561-9188",
};

// ── BI-RADS Follow-Up Logic ─────────────────────────────────────────
const BIRADS_DATA = [
  {
    score: "0",
    label: "BI-RADS 0 — Incomplete",
    malignancy: "N/A",
    color: "gray",
    meaning: "The mammogram is incomplete. Additional imaging is needed before a final assessment can be made.",
    nextSteps: [
      "Order diagnostic mammogram with additional views (spot compression, magnification, or rolled views).",
      "Add breast ultrasound if a mass, asymmetry, or architectural distortion is the concern.",
      "Obtain prior mammograms for comparison if not already available.",
      "Patient should be seen at a diagnostic breast imaging center — not a screening facility.",
    ],
    orderStudy: "mammo_diagnostic",
    orderLabel: "Order Diagnostic Mammogram",
    urgency: "Within 1–2 weeks",
    urgencyColor: "orange",
    patientMsg: "Your mammogram needs additional images to be completed. This is common and does not mean cancer was found. We are ordering a follow-up exam to get a clearer picture.",
  },
  {
    score: "1",
    label: "BI-RADS 1 — Negative",
    malignancy: "Essentially 0%",
    color: "green",
    meaning: "The mammogram is completely normal. No masses, calcifications, or other abnormalities were found.",
    nextSteps: [
      "Continue routine annual screening mammogram.",
      "No additional imaging or follow-up needed at this time.",
      "Counsel patient on breast self-awareness and report any new symptoms promptly.",
    ],
    orderStudy: null,
    urgency: "Routine annual screening",
    urgencyColor: "green",
    patientMsg: "Your mammogram is normal. Continue your annual screening mammogram as recommended.",
  },
  {
    score: "2",
    label: "BI-RADS 2 — Benign",
    malignancy: "Essentially 0%",
    color: "green",
    meaning: "A benign (non-cancerous) finding was identified — such as a cyst, calcification, or lymph node. This is recorded for reference but requires no intervention.",
    nextSteps: [
      "Continue routine annual screening mammogram.",
      "No biopsy or additional imaging needed.",
      "Document the benign finding in the chart for future comparison.",
      "Counsel patient on the benign nature of the finding.",
    ],
    orderStudy: null,
    urgency: "Routine annual screening",
    urgencyColor: "green",
    patientMsg: "Your mammogram shows a benign (non-cancerous) finding. This is nothing to worry about. Continue your annual mammogram as scheduled.",
  },
  {
    score: "3",
    label: "BI-RADS 3 — Probably Benign",
    malignancy: "< 2%",
    color: "yellow",
    meaning: "A probably benign finding requires short-interval follow-up to confirm stability. Biopsy is not recommended at this time unless the patient has high-risk features.",
    nextSteps: [
      "Order 6-month follow-up diagnostic mammogram (same side, targeted views).",
      "If stable at 6 months → repeat at 12 months, then 24 months before returning to annual screening.",
      "Consider biopsy if patient is high-risk (BRCA+, strong family history, prior breast cancer) or patient preference after shared decision-making.",
      "Add breast ultrasound if a mass or asymmetry is the finding and dense breasts are present.",
      "Do NOT delay follow-up — document clearly in chart and schedule patient before they leave.",
    ],
    orderStudy: "mammo_diagnostic",
    orderLabel: "Order 6-Month Follow-Up Mammogram",
    urgency: "6-month follow-up (do not delay)",
    urgencyColor: "yellow",
    patientMsg: "Your mammogram shows a finding that is probably benign (very likely not cancer). We need a follow-up mammogram in 6 months to confirm it hasn\'t changed. Please do not skip this appointment.",
  },
  {
    score: "4",
    label: "BI-RADS 4 — Suspicious",
    malignancy: "2–95% (varies by 4A/4B/4C)",
    color: "orange",
    meaning: "A suspicious finding that requires tissue sampling (biopsy). BI-RADS 4 is subdivided:\n4A: Low suspicion (2–10%) | 4B: Moderate (10–50%) | 4C: High (50–95%)",
    nextSteps: [
      "Refer to breast surgery or interventional radiology for tissue biopsy — do not wait.",
      "Stereotactic, ultrasound-guided, or MRI-guided core needle biopsy depending on lesion visibility.",
      "If ultrasound-visible: order breast ultrasound to guide biopsy planning.",
      "If mammogram-only finding: stereotactic core biopsy required — refer to breast center.",
      "Discuss findings with patient using shared decision-making. Provide written materials.",
      "Document referral and follow-up plan clearly. Set a 2-week callback if biopsy not scheduled.",
      "4C findings: expedite referral — treat with same urgency as BI-RADS 5.",
    ],
    orderStudy: "breast_us",
    orderLabel: "Order Breast Ultrasound (for biopsy planning)",
    urgency: "Biopsy within 2–4 weeks",
    urgencyColor: "red",
    patientMsg: "Your mammogram shows a finding that needs to be evaluated further with a biopsy — a small tissue sample. Most biopsies are benign, but we need to be sure. We are referring you to a specialist who will guide you through next steps.",
  },
  {
    score: "5",
    label: "BI-RADS 5 — Highly Suggestive of Malignancy",
    malignancy: "≥ 95%",
    color: "red",
    meaning: "The finding has a very high likelihood of being cancer. Tissue biopsy is required and treatment planning should begin.",
    nextSteps: [
      "URGENT: Refer immediately to breast surgery or breast oncology.",
      "Core needle biopsy must be performed — do not delay.",
      "Order breast ultrasound to assess full extent and axillary lymph nodes.",
      "Consider MRI breast for surgical planning (tumor size, multifocality, contralateral breast).",
      "Contact patient directly — do not leave a routine voicemail.",
      "Document the urgent referral and conversation in the chart.",
      "Offer patient navigation support or social work if available.",
    ],
    orderStudy: "breast_us",
    orderLabel: "Order Breast Ultrasound (urgent)",
    urgency: "URGENT — same week referral",
    urgencyColor: "red",
    patientMsg: "Your mammogram shows a finding that is highly concerning for cancer. I know this is frightening — we are here for you. We are referring you urgently to a breast specialist who will perform a biopsy and guide your care. You are not alone in this.",
  },
  {
    score: "6",
    label: "BI-RADS 6 — Known Malignancy",
    malignancy: "100% (biopsy-proven)",
    color: "red",
    meaning: "Biopsy-proven cancer is present. This category is used for imaging performed after biopsy confirmation but before definitive treatment.",
    nextSteps: [
      "Patient should already be in active treatment or under breast oncology care.",
      "Order MRI breast if not already done — pre-surgical staging and extent of disease.",
      "Ensure surgical oncology, radiation oncology, and medical oncology referrals are in place.",
      "Coordinate care with treatment team. Review pathology report in chart.",
      "Screen contralateral breast per oncology protocol.",
    ],
    orderStudy: null,
    urgency: "Active oncology coordination",
    urgencyColor: "red",
    patientMsg: "You have a confirmed breast cancer diagnosis. Your care team is coordinating your treatment plan. Please keep all your appointments and reach out with any questions — we are here to support you through this.",
  },
];

// ── Breast Imaging Decision Logic ─────────────────────────────────────────
const BREAST_QUESTIONS = [
  { id: "symptoms", q: "Does the patient have any breast symptoms?", options: [
    { label: "Yes — lump, pain, nipple discharge, skin changes, or asymmetry", value: "yes" },
    { label: "No — routine/preventive visit only", value: "no" },
  ]},
  { id: "prior_mammo", q: "Has the patient had a prior mammogram?", options: [
    { label: "Yes", value: "yes" },
    { label: "No — first mammogram", value: "no" },
    { label: "Unsure", value: "unsure" },
  ]},
  { id: "prior_abnormal", q: "Was the prior mammogram abnormal or incomplete?", options: [
    { label: "Yes — BI-RADS 0, 3, 4, or 5 / callback", value: "yes" },
    { label: "No — normal (BI-RADS 1 or 2)", value: "no" },
    { label: "N/A — no prior mammogram", value: "na" },
  ]},
  { id: "age", q: "Patient age?", options: [
    { label: "Under 30", value: "under30" },
    { label: "30–39", value: "30_39" },
    { label: "40 or older", value: "40plus" },
  ]},
  { id: "density", q: "Known breast density (if available from prior report)?", options: [
    { label: "Dense breasts (C or D — heterogeneously or extremely dense)", value: "dense" },
    { label: "Non-dense (A or B — almost entirely fatty or scattered)", value: "not_dense" },
    { label: "Unknown / first mammogram", value: "unknown" },
  ]},
  { id: "implants", q: "Does the patient have breast implants?", options: [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
  ]},
  { id: "hx_cancer", q: "Personal or strong family history of breast cancer?", options: [
    { label: "Yes — personal history or first-degree relative (BRCA, etc.)", value: "yes" },
    { label: "No", value: "no" },
  ]},
];

function getBreastRecommendation(answers) {
  const { symptoms, prior_abnormal, age, density, implants, hx_cancer } = answers;
  const recs = [];

  // DIAGNOSTIC pathway
  if (symptoms === "yes") {
    recs.push({
      study: "mammo_diagnostic",
      label: "Diagnostic Mammogram",
      reason: "Patient has active breast symptoms. Diagnostic mammogram is indicated regardless of age or prior history.",
      urgent: true,
    });
    recs.push({
      study: "breast_us",
      label: "Breast Ultrasound",
      reason: "Ultrasound should accompany diagnostic mammogram for symptomatic patients — especially for a palpable lump, focal pain, or nipple discharge. Targeted US can characterize a lesion not seen on mammogram.",
      urgent: false,
    });
    return recs;
  }

  // CALLBACK / ABNORMAL PRIOR
  if (prior_abnormal === "yes") {
    recs.push({
      study: "mammo_diagnostic",
      label: "Diagnostic Mammogram",
      reason: "Prior mammogram was abnormal or incomplete (BI-RADS 0/3/4/5). Diagnostic follow-up is required.",
      urgent: true,
    });
    recs.push({
      study: "breast_us",
      label: "Breast Ultrasound (if applicable)",
      reason: "If the callback involved a mass, asymmetry, or the patient has dense breasts, add targeted ultrasound.",
      urgent: false,
    });
    return recs;
  }

  // UNDER 30 — mammogram rarely indicated
  if (age === "under30" && symptoms !== "yes") {
    recs.push({
      study: "breast_us",
      label: "Breast Ultrasound",
      reason: "For patients under 30, ultrasound is the preferred first-line imaging. Mammogram is generally not recommended unless there is a strong clinical concern or high-risk genetics.",
      urgent: false,
    });
    return recs;
  }

  // SCREENING pathway (no symptoms, age 30+)
  recs.push({
    study: "mammo_screening",
    label: "Screening Mammogram",
    reason: age === "30_39"
      ? "Annual screening mammogram is recommended starting at 40. For age 30–39 with average risk, begin screening if there is family history or patient/provider preference."
      : "Annual screening mammogram is recommended for all average-risk women age 40 and older.",
    urgent: false,
  });

  // Dense breasts — add US supplement
  if (density === "dense") {
    recs.push({
      study: "breast_us",
      label: "Supplemental Screening Ultrasound",
      reason: "Dense breast tissue (BI-RADS C or D) reduces mammogram sensitivity. Supplemental whole-breast ultrasound increases cancer detection. Florida law requires notification of dense breasts.",
      urgent: false,
    });
  }

  // Implants — needs implant displacement views
  if (implants === "yes") {
    recs[0] = {
      ...recs[0],
      label: "Screening Mammogram (with implant displacement views)",
      reason: recs[0].reason + " Patient has implants — order specifically requires implant displacement (Eklund) views. Notify facility at time of scheduling.",
    };
    recs.push({
      study: "breast_us",
      label: "Breast Ultrasound",
      reason: "Ultrasound is strongly recommended alongside mammogram for patients with implants to evaluate peri-implant tissue and assess for rupture or silicone leak.",
      urgent: false,
    });
  }

  // High risk
  if (hx_cancer === "yes") {
    recs.push({
      study: null,
      label: "Consider MRI Breast (refer to radiology)",
      reason: "Personal history of breast cancer or high-risk genetics (BRCA1/2, first-degree relative) — annual breast MRI with contrast is recommended in addition to mammogram per ACR guidelines.",
      urgent: false,
      isMRI: true,
    });
  }

  return recs;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function RadiologyOrderingWizard() {
  const [step, setStep] = useState(1); // 0=breast guide, 1=select study, 2=patient+indications, 3=review+print
  const [showBreastGuide, setShowBreastGuide] = useState(false);
  const [breastAnswers, setBreastAnswers] = useState({});
  const [breastQStep, setBreastQStep] = useState(0);
  const [breastRecs, setBreastRecs] = useState(null);
  const [showBiradsGuide, setShowBiradsGuide] = useState(false);
  const [selectedBirads, setSelectedBirads] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [selectedICD10, setSelectedICD10] = useState([]);
  const [customICD10, setCustomICD10] = useState("");
  const [icdSearch, setIcdSearch] = useState("");
  const [patient, setPatient] = useState({ name: "", dob: "", mrn: "" });
  const [provider, setProvider] = useState("Renuka Jackson, NP");
  const [orderDate, setOrderDate] = useState(new Date().toLocaleDateString("en-US"));
  const [priority, setPriority] = useState("routine");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [studySearch, setStudySearch] = useState("");
  const printRef = useRef();

  const filteredStudies = STUDIES.filter(s =>
    (categoryFilter === "All" || s.category === categoryFilter) &&
    (s.name.toLowerCase().includes(studySearch.toLowerCase()) || s.category.toLowerCase().includes(studySearch.toLowerCase()))
  );

  const toggleICD10 = (code) => {
    setSelectedICD10(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const addCustomICD10 = () => {
    const val = customICD10.trim().toUpperCase();
    if (val && !selectedICD10.includes(val)) {
      setSelectedICD10(prev => [...prev, val]);
      setCustomICD10("");
    }
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=850,height=1100");
    win.document.write(`
      <!DOCTYPE html><html><head><title>Radiology Order</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 32px; color: #1a1a1a; }
        h1 { font-size: 18px; color: #1a3a5c; margin: 0 0 2px; }
        h2 { font-size: 13px; color: #1a3a5c; border-bottom: 2px solid #1a3a5c; padding-bottom: 4px; margin: 16px 0 8px; }
        h3 { font-size: 11px; font-weight: 700; margin: 10px 0 4px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .header-left p, .header-right p { margin: 1px 0; font-size: 10px; color: #555; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
        .field { margin: 3px 0; }
        .field b { display: inline-block; min-width: 90px; color: #444; }
        .icd-pill { display: inline-block; background: #eef4fb; border: 1px solid #b0c8e8; padding: 2px 8px; border-radius: 4px; margin: 2px; font-size: 10px; }
        .prep-item { margin: 3px 0; padding-left: 14px; position: relative; }
        .prep-item::before { content: "•"; position: absolute; left: 0; color: #1a3a5c; }
        .priority-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-weight: 700; font-size: 10px; }
        .urgent { background: #fee2e2; color: #b91c1c; }
        .routine { background: #e0f2fe; color: #0369a1; }
        .stat { background: #fef3c7; color: #b45309; }
        .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; }
        .signature-area { margin-top: 24px; border-top: 1px solid #ccc; padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sig-line { border-bottom: 1px solid #888; height: 28px; margin-bottom: 4px; }
        .sig-label { font-size: 9px; color: #666; }
        .patient-note { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 6px 10px; margin-top: 8px; font-style: italic; font-size: 10px; color: #78350f; }
        @media print { body { margin: 20px; } }
      </style></head><body>${printContents}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const reset = () => {
    setStep(1); setSelectedStudy(null); setSelectedICD10([]);
    setCustomICD10(""); setPatient({ name: "", dob: "", mrn: "" });
    setPriority("routine"); setClinicalNotes(""); setStudySearch("");
    setCategoryFilter("All");
  };

  // ── BI-RADS GUIDE ─────────────────────────────────────────────────────
  if (showBiradsGuide) {
    const urgencyBg = { green: "bg-green-50 border-green-300", yellow: "bg-yellow-50 border-yellow-300", orange: "bg-orange-50 border-orange-300", red: "bg-red-50 border-red-300", gray: "bg-gray-50 border-gray-300" };
    const urgencyText = { green: "text-green-800", yellow: "text-yellow-800", orange: "text-orange-800", red: "text-red-800", gray: "text-gray-700" };
    const scoreBg = { green: "bg-green-100 text-green-800", yellow: "bg-yellow-100 text-yellow-800", orange: "bg-orange-100 text-orange-800", red: "bg-red-100 text-red-800", gray: "bg-gray-100 text-gray-700" };

    if (!selectedBirads) {
      return (
        <div className="p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setShowBiradsGuide(false)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">BI-RADS Follow-Up Guide</h1>
              <p className="text-sm text-gray-500">Select the BI-RADS score from the mammogram report</p>
            </div>
          </div>
          <div className="space-y-2">
            {BIRADS_DATA.map(b => (
              <button key={b.score} onClick={() => setSelectedBirads(b)}
                className={`w-full text-left p-4 rounded-xl border-2 hover:shadow-md transition-all ${urgencyBg[b.color]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`inline-block font-bold text-sm px-2 py-0.5 rounded mr-2 ${scoreBg[b.color]}`}>BI-RADS {b.score}</span>
                    <span className={`font-semibold text-sm ${urgencyText[b.color]}`}>{b.label.split('—')[1]?.trim()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Malignancy risk: </span>
                    <span className={`text-xs font-bold ${urgencyText[b.color]}`}>{b.malignancy}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Detail view
    const b = selectedBirads;
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setSelectedBirads(null)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{b.label}</h1>
            <p className="text-xs text-gray-500">Malignancy risk: <strong>{b.malignancy}</strong></p>
          </div>
        </div>

        {/* Urgency banner */}
        <div className={`rounded-xl border-2 p-3 mb-4 flex items-center gap-2 ${urgencyBg[b.urgencyColor]}`}>
          <span className="text-lg">{b.urgencyColor === "green" ? "✅" : b.urgencyColor === "yellow" ? "⚠️" : "🚨"}</span>
          <div>
            <p className={`font-bold text-sm ${urgencyText[b.urgencyColor]}`}>Timeline: {b.urgency}</p>
            <p className={`text-xs ${urgencyText[b.urgencyColor]}`}>{b.meaning}</p>
          </div>
        </div>

        {/* Next Steps */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Recommended Next Steps</p>
            <div className="space-y-2">
              {b.nextSteps.map((step, i) => (
                <div key={i} className="flex gap-2.5 text-sm">
                  <span className="text-blue-600 font-bold flex-shrink-0 w-5">{i + 1}.</span>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient language */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">🗣 What to Tell Your Patient</p>
            <p className="text-sm text-gray-700 italic leading-relaxed">"{b.patientMsg}"</p>
          </CardContent>
        </Card>

        {/* Order button */}
        {b.orderStudy && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
            onClick={() => {
              const study = STUDIES.find(s => s.id === b.orderStudy);
              if (study) { setSelectedStudy(study); setSelectedICD10([]); setStep(2); setShowBiradsGuide(false); setSelectedBirads(null); }
            }}
          >
            {b.orderLabel} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}

        <Button variant="outline" className="w-full" onClick={() => setSelectedBirads(null)}>
          ← Back to BI-RADS List
        </Button>
      </div>
    );
  }

  // ── BREAST GUIDE ───────────────────────────────────────────────────────
  if (showBreastGuide) {
    const currentQ = BREAST_QUESTIONS[breastQStep];
    const allAnswered = breastQStep >= BREAST_QUESTIONS.length;

    if (allAnswered && !breastRecs) {
      setBreastRecs(getBreastRecommendation(breastAnswers));
    }

    if (allAnswered && breastRecs) {
      return (
        <div className="p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setShowBreastGuide(false); setBreastAnswers({}); setBreastQStep(0); setBreastRecs(null); }} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Breast Imaging Recommendation</h1>
              <p className="text-sm text-gray-500">Based on your clinical responses</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {breastRecs.map((rec, i) => (
              <div key={i} className={`rounded-xl border-2 p-4 ${rec.isMRI ? "border-purple-300 bg-purple-50" : rec.urgent ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${rec.isMRI ? "text-purple-800" : rec.urgent ? "text-red-800" : "text-blue-800"}`}>
                      {rec.urgent && <span className="mr-1">⚠️</span>}{rec.label}
                    </p>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">{rec.reason}</p>
                  </div>
                  {rec.study && (
                    <Button
                      size="sm"
                      className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      onClick={() => {
                        const study = STUDIES.find(s => s.id === rec.study);
                        if (study) { setSelectedStudy(study); setSelectedICD10([]); setStep(2); setShowBreastGuide(false); }
                      }}
                    >
                      Order This <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setBreastAnswers({}); setBreastQStep(0); setBreastRecs(null); }}>
              <RotateCcw className="h-4 w-4 mr-1" /> Start Over
            </Button>
            <Button variant="outline" onClick={() => { setShowBreastGuide(false); setBreastAnswers({}); setBreastQStep(0); setBreastRecs(null); }}>
              Back to All Studies
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setShowBreastGuide(false); setBreastAnswers({}); setBreastQStep(0); }} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Breast Imaging Guide</h1>
            <p className="text-sm text-gray-500">Question {breastQStep + 1} of {BREAST_QUESTIONS.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${((breastQStep) / BREAST_QUESTIONS.length) * 100}%` }} />
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="font-semibold text-gray-800 mb-4">{currentQ.q}</p>
            <div className="space-y-2">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const newAnswers = { ...breastAnswers, [currentQ.id]: opt.value };
                    setBreastAnswers(newAnswers);
                    if (breastQStep + 1 >= BREAST_QUESTIONS.length) {
                      setBreastRecs(getBreastRecommendation(newAnswers));
                      setBreastQStep(breastQStep + 1);
                    } else {
                      setBreastQStep(breastQStep + 1);
                    }
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {breastQStep > 0 && (
          <button onClick={() => setBreastQStep(q => q - 1)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to previous question
          </button>
        )}
      </div>
    );
  }

  // ── STEP 1: Select Study ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold">1</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Radiology Ordering Wizard</h1>
            <p className="text-sm text-gray-500">Step 1 of 3 — Select imaging study</p>
          </div>
        </div>

        {/* BI-RADS Follow-Up Banner */}
        <div className="mb-3 rounded-xl border-2 border-orange-200 bg-orange-50 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm text-orange-800">📊 Received an abnormal mammogram result?</p>
            <p className="text-xs text-orange-700 mt-0.5">Look up BI-RADS 0–6 for next steps, biopsy guidance, timeline, and what to tell your patient.</p>
          </div>
          <Button
            size="sm"
            className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => { setShowBiradsGuide(true); setSelectedBirads(null); }}
          >
            BI-RADS Guide →
          </Button>
        </div>

        {/* Breast Guide Banner */}
        <div className="mb-4 rounded-xl border-2 border-pink-200 bg-pink-50 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm text-pink-800">🩺 Not sure which breast imaging to order?</p>
            <p className="text-xs text-pink-700 mt-0.5">Answer 7 quick questions and get an evidence-based recommendation (screening vs. diagnostic vs. ultrasound).</p>
          </div>
          <Button
            size="sm"
            className="flex-shrink-0 bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => { setShowBreastGuide(true); setBreastAnswers({}); setBreastQStep(0); setBreastRecs(null); }}
          >
            Start Guide →
          </Button>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search studies..."
              value={studySearch}
              onChange={e => setStudySearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All", ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredStudies.map(study => (
            <div
              key={study.id}
              onClick={() => { setSelectedStudy(study); setSelectedICD10([]); setStep(2); }}
              className="cursor-pointer border rounded-xl p-4 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-700">{study.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{study.category}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{study.cptHint}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP 2: Patient + ICD-10 ──────────────────────────────────────────
  if (step === 2) {
    const filtered = selectedStudy.icd10Suggestions.filter(i =>
      icdSearch === "" ||
      i.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
      i.desc.toLowerCase().includes(icdSearch.toLowerCase())
    );

    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold">2</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{selectedStudy.name}</h1>
            <p className="text-sm text-gray-500">Step 2 of 3 — Patient info & indications</p>
          </div>
        </div>

        {/* Patient Info */}
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-gray-700">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Patient Name</Label>
              <Input placeholder="Last, First" value={patient.name} onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Date of Birth</Label>
              <Input placeholder="MM/DD/YYYY" value={patient.dob} onChange={e => setPatient(p => ({ ...p, dob: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">MRN (optional)</Label>
              <Input placeholder="Patient MRN" value={patient.mrn} onChange={e => setPatient(p => ({ ...p, mrn: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Ordering Provider</Label>
              <Input value={provider} onChange={e => setProvider(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Order Date</Label>
              <Input value={orderDate} onChange={e => setOrderDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-3 mt-1">
                {["routine", "urgent", "stat"].map(p => (
                  <div key={p} className="flex items-center gap-1">
                    <RadioGroupItem value={p} id={`pri-${p}`} />
                    <label htmlFor={`pri-${p}`} className="text-xs capitalize cursor-pointer">{p}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* ICD-10 Selection */}
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-gray-700">ICD-10 Diagnosis Codes</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input className="pl-8 h-8 text-xs" placeholder="Search codes..." value={icdSearch} onChange={e => setIcdSearch(e.target.value)} />
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filtered.map(({ code, desc }) => (
                <div
                  key={code}
                  onClick={() => toggleICD10(code)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-all text-xs ${
                    selectedICD10.includes(code)
                      ? "bg-blue-50 border-blue-400"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <Checkbox checked={selectedICD10.includes(code)} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-mono font-bold text-blue-700">{code}</span>
                    <span className="text-gray-600 ml-2">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Custom ICD-10 */}
            <div className="flex gap-2 mt-3">
              <Input
                className="h-8 text-xs font-mono"
                placeholder="Add custom ICD-10 code (e.g. M85.80)"
                value={customICD10}
                onChange={e => setCustomICD10(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCustomICD10()}
              />
              <Button size="sm" onClick={addCustomICD10} variant="outline">Add</Button>
            </div>
            {selectedICD10.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedICD10.map(code => (
                  <span key={code} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-mono px-2 py-0.5 rounded">
                    {code}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleICD10(code)} />
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clinical Notes */}
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-gray-700">Clinical Notes / Additional Instructions (optional)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <textarea
              className="w-full border rounded-lg p-2.5 text-xs resize-none h-20 outline-none focus:border-blue-400"
              placeholder="e.g. Right breast lump x 2 weeks, patient on HRT, compare to prior 2022 mammogram..."
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white">
            Review Order <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── STEP 3: Review + Print ────────────────────────────────────────────
  const prioStyle = {
    routine: "bg-blue-100 text-blue-800",
    urgent: "bg-red-100 text-red-800",
    stat: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(2)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Order Ready</h1>
            <p className="text-sm text-gray-500">Step 3 of 3 — Review & print</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} size="sm">
            <RotateCcw className="h-4 w-4 mr-1" /> New Order
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
            <Printer className="h-4 w-4 mr-1" /> Print Order
          </Button>
        </div>
      </div>

      {/* Printable area */}
      <div ref={printRef}>
        {/* Header */}
        <div className="header" style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a3a5c" }}>{CHC.name}</div>
            <div style={{ fontSize: 10, color: "#555" }}>{CHC.address}</div>
            <div style={{ fontSize: 10, color: "#555" }}>Ph: {CHC.phone} | Fx: {CHC.fax}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a3a5c" }}>RADIOLOGY ORDER</div>
            <div style={{ fontSize: 10, color: "#555" }}>Date: {orderDate}</div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${prioStyle[priority]}`}>{priority.toUpperCase()}</span>
          </div>
        </div>

        <hr className="my-3 border-gray-300" />

        {/* Patient + Study */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Patient</p>
              <p className="font-semibold text-sm">{patient.name || <span className="text-gray-400">_______________</span>}</p>
              <p className="text-xs text-gray-600">DOB: {patient.dob || "___________"}</p>
              {patient.mrn && <p className="text-xs text-gray-600">MRN: {patient.mrn}</p>}
              <p className="text-xs text-gray-600 mt-1">Provider: {provider}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Imaging Study</p>
              <p className="font-semibold text-sm text-blue-700">{selectedStudy.name}</p>
              <p className="text-xs text-gray-500">{selectedStudy.category}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{selectedStudy.cptHint}</p>
              <p className="text-xs text-gray-600 mt-1">Send to: {FACILITY.name}</p>
            </CardContent>
          </Card>
        </div>

        {/* ICD-10 */}
        {selectedICD10.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">ICD-10 Diagnosis Codes</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedICD10.map(code => {
                  const match = selectedStudy.icd10Suggestions.find(i => i.code === code);
                  return (
                    <span key={code} className="icd-pill bg-blue-50 border border-blue-200 text-xs px-2 py-0.5 rounded font-mono text-blue-800">
                      {code}{match ? ` — ${match.desc}` : ""}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clinical notes */}
        {clinicalNotes && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Clinical Notes</p>
              <p className="text-xs text-gray-700">{clinicalNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Patient Instructions */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Patient Preparation Instructions</p>
            <div className="space-y-1">
              {selectedStudy.prepInstructions.map((inst, i) => (
                <p key={i} className="text-xs text-gray-700 flex gap-2">
                  <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                  {inst}
                </p>
              ))}
            </div>
            <div className="mt-2 bg-amber-50 border-l-2 border-amber-400 p-2 rounded text-xs text-amber-800 italic">
              {selectedStudy.patientNote}
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-200">
          <div>
            <div className="border-b border-gray-400 h-8 mb-1" />
            <p className="text-xs text-gray-500">Provider Signature</p>
            <p className="text-xs text-gray-700 font-medium mt-0.5">{provider}</p>
          </div>
          <div>
            <div className="border-b border-gray-400 h-8 mb-1" />
            <p className="text-xs text-gray-500">Date Signed</p>
            <p className="text-xs text-gray-700 font-medium mt-0.5">{orderDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
