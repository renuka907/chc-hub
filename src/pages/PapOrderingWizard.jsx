import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, RotateCcw, FileText, Stethoscope } from "lucide-react";

// ICD-10 code descriptions
const ICD10_DESCRIPTIONS = {
    "Z12.4": "Encounter for screening for malignant neoplasm of cervix",
    "Z11.51": "Encounter for screening for human papillomavirus (HPV)",
    "Z77.22": "Contact with and (suspected) exposure to environmental tobacco smoke (acute) (chronic)",
    "Z12.72": "Encounter for screening for malignant neoplasm of vagina",
    "R87.611": "Atypical squamous cells of undetermined significance on cytological smear of cervix (ASC-US)",
    "R87.610": "Atypical squamous cells cannot exclude high grade squamous intraepithelial lesion on cytological smear of cervix (ASC-H)",
    "R87.612": "Low grade squamous intraepithelial lesion on cytological smear of cervix (LSIL)",
    "R87.613": "High grade squamous intraepithelial lesion on cytological smear of cervix (HSIL)",
    "R87.620": "Atypical cells on cytological smear of cervix — favor neoplastic (AGC)",
    "R87.810": "Cervical high risk human papillomavirus (HPV) DNA test positive",
    "R87.820": "Cervical high risk HPV DNA test positive — HPV 16/18 genotype",
    "Z86.001": "Personal history of in-situ neoplasm of cervix uteri (CIN history)",
    "Z85.41": "Personal history of malignant neoplasm of cervix uteri",
    "Z87.410": "Personal history of cervical dysplasia",
    "Z90.710": "Acquired absence of uterus and cervix",
    "Z90.711": "Acquired absence of uterus with remaining cervical stump",
    "Z01.419": "Encounter for gynecological examination (general) (routine) without abnormal findings",
    "Z01.411": "Encounter for gynecological examination (general) (routine) with abnormal findings",
    "N93.9": "Abnormal uterine and vaginal bleeding, unspecified",
    "N89.8": "Other specified noninflammatory disorders of vagina",
    "B20": "Human immunodeficiency virus [HIV] disease",
    "D89.9": "Disorder involving the immune mechanism, unspecified",
    "Z77.9": "Other contact with and (suspected) exposures hazardous to health",
    "N88.8": "Other specified noninflammatory disorders of cervix uteri",
    "N87.9": "Dysplasia of cervix uteri, unspecified",
    "Z91.89": "Other specified personal risk factors, not elsewhere classified"
};

export default function PapOrderingWizard() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        age: "",
        under21Indication: "",
        insurance: "",
        hysterectomyStatus: "",
        postHystHistory: "",
        reason: "",
        stiPanel: "",
        lmp: "",
        iudPresent: "",
        iudType: "",
        ovariesStatus: "",
        previousAbnormal: "",
        recentPapHPV: "",
        hadAbnormalResult: ""
    });

    const [result, setResult] = useState(null);

    const resetWizard = () => {
        setStep(1);
        setFormData({
            age: "",
            under21Indication: "",
            insurance: "",
            hysterectomyStatus: "",
            postHystHistory: "",
            reason: "",
            stiPanel: "",
            lmp: "",
            iudPresent: "",
            iudType: "",
            ovariesStatus: "",
            previousAbnormal: "",
            recentPapHPV: "",
            hadAbnormalResult: ""
        });
        setResult(null);
    };

    const calculateResult = () => {
        const age = parseInt(formData.age);
        const isUnder21 = age < 21;
        const hasLeeHealth = formData.insurance === "lee";
        const hasCervix = formData.hysterectomyStatus === "none" || formData.hysterectomyStatus === "supracervical";
        const needsSTI = formData.stiPanel === "full" || formData.stiPanel === "ctng";
        const isMedicare = formData.insurance === "medicare";
        const isHighRisk = formData.reason === "high-risk";
        const isHIV = formData.reason === "hiv";
        const isImmunocompromised = formData.reason === "immunocompromised";
        const isSpecialPopulation = isHIV || isImmunocompromised;
        const hadRecentPap = formData.recentPapHPV === "yes";
        const hasDysplasiaHistory = formData.postHystHistory === "dysplasia" || formData.postHystHistory === "cin" || formData.postHystHistory === "cancer";

        let labName = "";
        let testCodes = [];
        let cptCodes = [];
        let hcpcsCodes = [];
        let primaryICD10 = "";
        let secondaryICD10 = [];
        let optionalICD10 = [];
        let specimenSource = "";
        let warnings = [];
        let medicareWarnings = [];
        let denialWarnings = [];
        let requiresHPV = true;
        let questCodeName = "";
        let smartCodeNote = "";
        let cptReferenceNote = "";
        let frequencyReminder = "";
        let abnormalGuidance = null;
        let icd10Category = "screening"; // "screening" or "diagnostic"

        // Under 21 logic
        if (isUnder21) {
            requiresHPV = false;
            if (!formData.under21Indication || formData.under21Indication === "routine") {
                warnings.push("⚠️ ROUTINE SCREENING NOT RECOMMENDED UNDER 21 (per USPSTF/ACOG)");
                warnings.push("Insurance will likely DENY routine screening codes (Z12.4, Z01.419)");
                warnings.push("If parent insists: counsel not recommended AND likely not covered");
                return {
                    labName: "NOT RECOMMENDED",
                    testCodes: [],
                    cptCodes: [],
                    hcpcsCodes: [],
                    primaryICD10: "",
                    secondaryICD10: [],
                    specimenSource: "",
                    warnings,
                    medicareWarnings: [],
                    denialWarnings: [],
                    requiresHPV: false,
                    requiredFields: [],
                    questCodeName: "",
                    smartCodeNote: "",
                    cptReferenceNote: "",
                    frequencyReminder: ""
                };
            }

            // Diagnostic under 21
            labName = hasLeeHealth ? "AmeriPath" : "Quest Diagnostics";
            testCodes = hasLeeHealth ? ["Q0091"] : ["91384"];
            cptCodes = ["88175"];
            specimenSource = hasCervix ? "Cervix" : "Vaginal cuff";
            questCodeName = "ThinPrep Pap w/ Reflex to HPV DNA";

            switch (formData.under21Indication) {
                case "symptomatic":
                    primaryICD10 = "N93.9";
                    secondaryICD10 = ["N89.8"];
                    break;
                case "hiv":
                    primaryICD10 = "B20";
                    secondaryICD10 = ["Z12.4"];
                    break;
                case "immunocompromised":
                    primaryICD10 = "D89.9";
                    secondaryICD10 = ["Z12.4"];
                    break;
                case "des":
                    primaryICD10 = "Z77.9";
                    secondaryICD10 = ["Z12.4"];
                    break;
                case "visible-lesion":
                    primaryICD10 = "N88.8";
                    secondaryICD10 = ["N87.9"];
                    break;
                default:
                    primaryICD10 = "N93.9";
                    secondaryICD10 = ["N89.8"];
            }

            warnings.push("🔵 Use Quest Smart Code 91384 (age-based protocol built in) - HPV only bills if ASCUS");
            warnings.push("🔵 Use DIAGNOSTIC codes, not screening");
            warnings.push("🔵 Document clinical indication");
            denialWarnings.push("⚠️ HPV test NOT covered for ages <30 unless reflex from ASCUS — use Quest Smart Code 91384 — age-based logic is built in");
        }
        // Post-hysterectomy NO cervix
        else if (!hasCervix) {
            requiresHPV = false;
            labName = hasLeeHealth ? "AmeriPath" : "Quest Diagnostics";
            testCodes = hasLeeHealth ? ["Q0091"] : ["91384"];
            cptCodes = ["88175"];
            specimenSource = "Vaginal cuff";
            secondaryICD10 = ["Z90.710"];
            questCodeName = "ThinPrep Pap w/ Reflex to HPV DNA";

            if (formData.postHystHistory === "no-history") {
                warnings.push("⚠️ Pap NOT typically indicated per USPSTF (no history of dysplasia/cancer)");
                warnings.push("💡 If ordering anyway, use Z12.72 — NOT Z01.419. Z12.72 = vaginal cancer screening (correct for vaginal cuff Pap).");
                if (isMedicare) {
                    medicareWarnings.push("🚨 MEDICARE WILL NOT COVER screening Pap or HPV for post-hysterectomy patients without cervix and no history of dysplasia/cancer. Patient will be responsible for full cost.");
                    medicareWarnings.push("⚠️ Recommend NOT ordering — or obtain signed ABN (Advance Beneficiary Notice) before proceeding.");
                }
                primaryICD10 = "Z12.72";
            } else if (formData.postHystHistory === "dysplasia") {
                primaryICD10 = "Z12.72";
                secondaryICD10 = ["Z90.710", "Z87.410"];
                warnings.push("🔵 Z12.72 = screening for vaginal neoplasm (correct primary for vaginal cuff Pap). Z87.410 added as secondary for dysplasia history.");
                if (isMedicare) {
                    medicareWarnings.push("🔵 MEDICARE: Post-hysterectomy with dysplasia history — use Z12.72 as primary + Z87.410 secondary.");
                }
            } else if (formData.postHystHistory === "cin") {
                primaryICD10 = "Z12.72";
                secondaryICD10 = ["Z90.710", "Z86.001"];
                warnings.push("🔵 Z12.72 = screening for vaginal neoplasm. Z86.001 added as secondary for CIN history.");
                if (isMedicare) {
                    medicareWarnings.push("🔵 MEDICARE: Post-hysterectomy with CIN history — use Z12.72 as primary + Z86.001 secondary.");
                }
            } else {
                primaryICD10 = "Z12.72";
                secondaryICD10 = ["Z90.710", "Z85.41"];
                warnings.push("🔵 Z12.72 = screening for vaginal neoplasm. Z85.41 added as secondary for cervical cancer history.");
                if (isMedicare) {
                    medicareWarnings.push("🔵 MEDICARE: Post-hysterectomy with cervical cancer history — use Z12.72 as primary + Z85.41 secondary.");
                }
            }
        }
        // Standard screening with cervix
        else {
            specimenSource = formData.hysterectomyStatus === "supracervical" ? "Cervical stump" : "Cervix";

            if (formData.hysterectomyStatus === "supracervical") {
                secondaryICD10.push("Z90.711");
            }

            // Lee Health
            if (hasLeeHealth) {
                labName = "AmeriPath";

                if (formData.reason === "followup") {
                    testCodes = ["Q0091", "87625"];
                    cptCodes = ["88175", "87624", "87625"];
                    icd10Category = "diagnostic";

                    switch (formData.previousAbnormal) {
                        case "asc-us-normal-hpv":
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Repeat co-test in 3 years (no immediate colposcopy needed)", note: "This is a DIAGNOSTIC visit — use R87.611, NOT Z12.4" };
                            break;
                        case "asc-us-hpv-pos":
                            primaryICD10 = "R87.611";
                            secondaryICD10.push("R87.810");
                            abnormalGuidance = { recommendation: "Colposcopy recommended", note: "Refer for colposcopy per ASCCP guidelines" };
                            break;
                        case "asc-us":
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Follow-up based on HPV status", note: "This is a DIAGNOSTIC visit — use R87.611, NOT Z12.4" };
                            break;
                        case "asc-h":
                            primaryICD10 = "R87.610";
                            abnormalGuidance = { recommendation: "Colposcopy recommended regardless of HPV", note: "ASC-H requires colposcopy — do not wait for HPV" };
                            break;
                        case "lsil":
                            primaryICD10 = "R87.612";
                            abnormalGuidance = { recommendation: "Co-test or colposcopy depending on age/HPV status", note: "Ages 21-24: Repeat Pap in 12mo. Ages 25+: Colposcopy preferred" };
                            break;
                        case "hsil":
                            primaryICD10 = "R87.613";
                            abnormalGuidance = { recommendation: "Colposcopy required", note: "HSIL → Colposcopy required. If post-treatment surveillance: Z86.001", alternateCode: "Z86.001" };
                            break;
                        case "agc":
                            primaryICD10 = "R87.620";
                            abnormalGuidance = { recommendation: "Colposcopy + endocervical sampling", note: "AGC requires colposcopy AND endocervical sampling" };
                            break;
                        case "hpv":
                            primaryICD10 = "R87.810";
                            abnormalGuidance = { recommendation: "Repeat co-test in 1 year", note: "HPV+ with normal cytology: repeat in 12 months. If still HPV+, colposcopy" };
                            break;
                        case "hpv-16-18":
                            primaryICD10 = "R87.810";
                            secondaryICD10.push("R87.820");
                            abnormalGuidance = { recommendation: "Colposcopy recommended regardless of Pap", note: "HPV 16/18 → Colposcopy regardless of Pap result" };
                            break;
                        default:
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Follow ASCCP guidelines for management", note: "This is a DIAGNOSTIC visit — use diagnostic ICD-10 code, NOT Z12.4" };
                    }
                    denialWarnings.push("🚨 When following up an abnormal result: ALWAYS use the diagnostic ICD-10 code (R87.xxx or Z86.001), NOT Z12.4. Using Z12.4 for a diagnostic visit causes denials.");
                } else if (isHighRisk || isSpecialPopulation) {
                    testCodes = ["Q0091", "87625"];
                    cptCodes = ["88175", "87624", "87625"];
                    if (isHIV) {
                        primaryICD10 = "Z12.4";
                        secondaryICD10.push("B20");
                    } else if (isImmunocompromised) {
                        primaryICD10 = "Z12.4";
                        secondaryICD10.push("D89.9");
                    } else {
                        primaryICD10 = "Z91.89";
                    }
                    secondaryICD10.push("Z11.51");
                    frequencyReminder = "Screen annually (special population / high-risk)";
                } else {
                    testCodes = ["Q0091", "87625"];
                    cptCodes = ["88175", "87624", "87625"];
                    primaryICD10 = "Z12.4";
                    secondaryICD10.push("Z11.51");
                    if (age >= 21 && age <= 29) {
                        frequencyReminder = "Pap alone every 3 years (ages 21-29)";
                    } else if (age >= 30 && age <= 65) {
                        frequencyReminder = "Pap + HPV co-test every 5 years (ages 30-65)";
                    }
                }

                if (needsSTI) {
                    warnings.push('🟢 Type "Add STI panel" in order instructions field');
                }
            }
            // Medicare with cervix — COMPREHENSIVE COVERAGE RULES (NCD 210.2.1)
            else if (isMedicare) {
                labName = "Quest Diagnostics";

                // Medicare frequency check
                if (hadRecentPap && formData.reason !== "followup") {
                    if (isHighRisk || isSpecialPopulation) {
                        medicareWarnings.push("⚠️ MEDICARE HIGH-RISK: Pap covered every 12 months. Verify last Pap was >12 months ago.");
                    } else {
                        medicareWarnings.push("🚨 MEDICARE FREQUENCY: Screening Pap is covered once every 24 months. Patient had Pap/HPV in the last 24 months — this order will likely be DENIED. Patient will be responsible for full cost.");
                    }
                }

                // Medicare specimen collection
                hcpcsCodes.push("Q0091");
                warnings.push("📋 Medicare: Use Q0091 for specimen collection");

                if (formData.reason === "followup") {
                    // Follow-up is diagnostic, not screening — standard codes apply
                    testCodes = needsSTI ? ["91386"] : ["91384"];
                    cptCodes = needsSTI ? ["88175", "87624", "87625", "87494", "87661"] : ["88175", "87624"];
                    questCodeName = needsSTI ? "ThinPrep Pap+HPV+STI combo" : "ThinPrep Pap + HPV DNA Co-test w/ Reflex 16/18";
                    icd10Category = "diagnostic";

                    switch (formData.previousAbnormal) {
                        case "asc-us-normal-hpv":
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Repeat co-test in 3 years (no immediate colposcopy needed)", note: "This is a DIAGNOSTIC visit — use R87.611, NOT Z12.4" };
                            break;
                        case "asc-us-hpv-pos":
                            primaryICD10 = "R87.611";
                            secondaryICD10.push("R87.810");
                            abnormalGuidance = { recommendation: "Colposcopy recommended", note: "Refer for colposcopy per ASCCP guidelines" };
                            break;
                        case "asc-us":
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Follow-up based on HPV status", note: "This is a DIAGNOSTIC visit — use R87.611, NOT Z12.4" };
                            break;
                        case "asc-h":
                            primaryICD10 = "R87.610";
                            abnormalGuidance = { recommendation: "Colposcopy recommended regardless of HPV", note: "ASC-H requires colposcopy — do not wait for HPV" };
                            break;
                        case "lsil":
                            primaryICD10 = "R87.612";
                            abnormalGuidance = { recommendation: "Co-test or colposcopy depending on age/HPV status", note: "Ages 21-24: Repeat Pap in 12mo. Ages 25+: Colposcopy preferred" };
                            break;
                        case "hsil":
                            primaryICD10 = "R87.613";
                            abnormalGuidance = { recommendation: "Colposcopy required", note: "HSIL → Colposcopy required. If post-treatment surveillance: Z86.001", alternateCode: "Z86.001" };
                            break;
                        case "agc":
                            primaryICD10 = "R87.620";
                            abnormalGuidance = { recommendation: "Colposcopy + endocervical sampling", note: "AGC requires colposcopy AND endocervical sampling" };
                            break;
                        case "hpv":
                            primaryICD10 = "R87.810";
                            abnormalGuidance = { recommendation: "Repeat co-test in 1 year", note: "HPV+ with normal cytology: repeat in 12 months. If still HPV+, colposcopy" };
                            break;
                        case "hpv-16-18":
                            primaryICD10 = "R87.810";
                            secondaryICD10.push("R87.820");
                            abnormalGuidance = { recommendation: "Colposcopy recommended regardless of Pap", note: "HPV 16/18 → Colposcopy regardless of Pap result" };
                            break;
                        default:
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Follow ASCCP guidelines for management", note: "This is a DIAGNOSTIC visit — use diagnostic ICD-10 code, NOT Z12.4" };
                    }
                    warnings.push("🔵 MEDICARE: Follow-up is DIAGNOSTIC — standard CPT codes apply (not G0476).");
                    denialWarnings.push("🚨 When following up an abnormal result: ALWAYS use the diagnostic ICD-10 code (R87.xxx or Z86.001), NOT Z12.4. Using Z12.4 for a diagnostic visit causes denials.");
                }
                // Medicare 65 AND OLDER with cervix — Quest directive: use 58315
                else if (age >= 65) {
                    requiresHPV = false;
                    testCodes = ["58315"];
                    cptCodes = ["88175"];
                    questCodeName = "ThinPrep Automated Pap";
                    primaryICD10 = "Z11.51";
                    secondaryICD10.push("Z01.419");
                    medicareWarnings.push("🔵 QUEST 65+: Use test code 58315 (ThinPrep Automated Pap) per Quest directive.");
                    medicareWarnings.push("⚠️ MEDICARE DOES NOT COVER HPV SCREENING FOR PATIENTS OVER 65. HPV testing will be patient responsibility (~$150+).");
                    warnings.push("📋 ICD-10: Z11.51 (HPV screening) + Z01.419 (routine GYN exam, no abnormal findings). Use Z01.411 instead of Z01.419 if abnormal findings noted.");
                    if (!isHighRisk && !isSpecialPopulation && !hasDysplasiaHistory) {
                        warnings.push("⚠️ 65+: Consider stopping screening IF adequate prior screening AND no hx CIN2+ in last 25 years");
                        warnings.push("📋 Document medical necessity for continued screening");
                        denialWarnings.push("⚠️ Document medical necessity for continued screening after age 65");
                        frequencyReminder = "Pap every 24 months (Medicare standard risk)";
                    } else {
                        frequencyReminder = "Screen annually (high-risk / special population)";
                        medicareWarnings.push("📋 Document medical necessity for continued screening past 65");
                    }
                }
                // Medicare age 30-64 with cervix — HPV covered with G0476
                else if (age >= 30 && age < 65) {
                    testCodes = needsSTI ? ["91386"] : ["91384"];
                    cptCodes = ["88175"];
                    hcpcsCodes.push("G0476");
                    questCodeName = needsSTI ? "ThinPrep Pap+HPV+STI combo" : "ThinPrep Pap + HPV DNA Co-test w/ Reflex 16/18";

                    if (isHighRisk || isSpecialPopulation) {
                        if (isHIV) {
                            primaryICD10 = "Z12.4";
                            secondaryICD10.push("B20");
                        } else if (isImmunocompromised) {
                            primaryICD10 = "Z12.4";
                            secondaryICD10.push("D89.9");
                        } else {
                            primaryICD10 = "Z91.89";
                        }
                        secondaryICD10.push("Z11.51");
                        medicareWarnings.push("🔵 MEDICARE: Use G0476 for HPV screening. Do NOT bill 88175 + 87624 separately.");
                        medicareWarnings.push("🔵 MEDICARE HIGH-RISK: Pap+HPV covered every 12 months.");
                        warnings.push("📋 Dual diagnosis required: Z11.51 (HPV screening) + Z12.4 (cervical cancer screening)");
                        frequencyReminder = "Screen annually (high-risk / special population)";
                    } else {
                        primaryICD10 = "Z12.4";
                        secondaryICD10.push("Z11.51");
                        medicareWarnings.push("🔵 MEDICARE: Use G0476 for HPV screening. Do NOT bill 88175 + 87624 separately.");
                        medicareWarnings.push("📋 MEDICARE SCREENING: Pap+HPV covered once every 24 months. Ensure >24 months since last screening.");
                        warnings.push("📋 Medicare dual diagnosis: Primary Z12.4 + Secondary Z11.51");
                        frequencyReminder = "Pap + HPV co-test every 24 months (Medicare)";
                    }

                    denialWarnings.push("🚨 Do NOT bill 88175 + 87624 separately for Medicare — use G0476");
                }
                // Medicare under 30 with cervix — no HPV screening (not indicated <30)
                else {
                    requiresHPV = false;
                    testCodes = ["91384"];
                    cptCodes = ["88175"];
                    primaryICD10 = "Z12.4";
                    questCodeName = "ThinPrep Pap w/ Reflex to HPV DNA";
                    warnings.push("🔵 Patient under 30: HPV co-testing not recommended per guidelines");
                    medicareWarnings.push("📋 MEDICARE: Pap-only for patients under 30. Covered every 24 months (12 months if high-risk).");
                    denialWarnings.push("⚠️ HPV test NOT covered for ages <30 unless reflex from ASCUS — use Quest Smart Code 91384 — age-based logic is built in");
                    frequencyReminder = "Pap alone every 3 years (ages 21-29)";
                }

                if (needsSTI) {
                    warnings.push("🟣 Quest code includes STI panel (CT/GC/Trich) - ALL IN ONE");
                }
            }
            // Quest (non-Medicare)
            else {
                labName = "Quest Diagnostics";

                // Smart Code selection based on STI panel choice
                const smartCode = formData.stiPanel === "full" ? "91386" : formData.stiPanel === "ctng" ? "91385" : "91384";
                const smartCodeNames = {
                    "91384": "Image-Guided Pap + Age-Based Screening",
                    "91385": "Image-Guided Pap + Age-Based Screening + CT/NG",
                    "91386": "Image-Guided Pap + Age-Based Screening + CT/NG + Trich"
                };

                if (formData.reason === "followup") {
                    // Follow-up is DIAGNOSTIC — use specific codes, not Smart Codes
                    testCodes = ["91384"];
                    questCodeName = "Image-Guided Pap + Age-Based Screening";
                    cptCodes = age >= 30 ? ["88175", "87624", "87625"] : ["88175"];
                    icd10Category = "diagnostic";

                    switch (formData.previousAbnormal) {
                        case "asc-us-normal-hpv":
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Repeat co-test in 3 years (no immediate colposcopy needed)", note: "This is a DIAGNOSTIC visit — use R87.611, NOT Z12.4" };
                            break;
                        case "asc-us-hpv-pos":
                            primaryICD10 = "R87.611";
                            secondaryICD10.push("R87.810");
                            abnormalGuidance = { recommendation: "Colposcopy recommended", note: "Refer for colposcopy per ASCCP guidelines" };
                            break;
                        case "asc-us":
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Follow-up based on HPV status", note: "This is a DIAGNOSTIC visit — use R87.611, NOT Z12.4" };
                            break;
                        case "asc-h":
                            primaryICD10 = "R87.610";
                            abnormalGuidance = { recommendation: "Colposcopy recommended regardless of HPV", note: "ASC-H requires colposcopy — do not wait for HPV" };
                            break;
                        case "lsil":
                            primaryICD10 = "R87.612";
                            abnormalGuidance = { recommendation: "Co-test or colposcopy depending on age/HPV status", note: "Ages 21-24: Repeat Pap in 12mo. Ages 25+: Colposcopy preferred" };
                            break;
                        case "hsil":
                            primaryICD10 = "R87.613";
                            abnormalGuidance = { recommendation: "Colposcopy required", note: "HSIL → Colposcopy required. If post-treatment surveillance: Z86.001", alternateCode: "Z86.001" };
                            break;
                        case "agc":
                            primaryICD10 = "R87.620";
                            abnormalGuidance = { recommendation: "Colposcopy + endocervical sampling", note: "AGC requires colposcopy AND endocervical sampling" };
                            break;
                        case "hpv":
                            primaryICD10 = "R87.810";
                            abnormalGuidance = { recommendation: "Repeat co-test in 1 year", note: "HPV+ with normal cytology: repeat in 12 months. If still HPV+, colposcopy" };
                            break;
                        case "hpv-16-18":
                            primaryICD10 = "R87.810";
                            secondaryICD10.push("R87.820");
                            abnormalGuidance = { recommendation: "Colposcopy recommended regardless of Pap", note: "HPV 16/18 → Colposcopy regardless of Pap result" };
                            break;
                        default:
                            primaryICD10 = "R87.611";
                            abnormalGuidance = { recommendation: "Follow ASCCP guidelines for management", note: "This is a DIAGNOSTIC visit — use diagnostic ICD-10 code, NOT Z12.4" };
                    }
                    denialWarnings.push("🚨 When following up an abnormal result: ALWAYS use the diagnostic ICD-10 code (R87.xxx or Z86.001), NOT Z12.4. Using Z12.4 for a diagnostic visit causes denials.");

                    if (false) {
                        primaryICD10 = "R87.610";
                    }
                } else if (isSpecialPopulation) {
                    // HIV+ or immunocompromised — annual screening, Smart Code
                    testCodes = [smartCode];
                    questCodeName = smartCodeNames[smartCode];
                    cptCodes = age >= 30 ? ["88175", "87624", "87625"] : ["88175"];
                    cptReferenceNote = age >= 30
                        ? "Quest will bill: 88175 + 87624 + 87625 (if reflex genotyping triggered)"
                        : "Quest will bill: 88175 (+ HPV reflex if ASCUS)";
                    if (isHIV) {
                        primaryICD10 = "Z12.4";
                        secondaryICD10.push("B20");
                    } else {
                        primaryICD10 = "Z12.4";
                        secondaryICD10.push("D89.9");
                    }
                    secondaryICD10.push("Z11.51");
                    frequencyReminder = "Screen annually (special population)";
                    smartCodeNote = `Tell MA to order ${smartCode} — no age-specific selection needed`;
                } else if (age >= 65) {
                    // 65 AND OLDER non-Medicare — Quest directive: use 58315
                    requiresHPV = false;
                    testCodes = ["58315"];
                    questCodeName = "ThinPrep Automated Pap";
                    cptCodes = ["88175"];
                    cptReferenceNote = "Quest will bill: 88175";
                    primaryICD10 = "Z11.51";
                    secondaryICD10.push("Z01.419");
                    smartCodeNote = "Tell MA to order 58315 (ThinPrep Automated Pap) — Quest directive for 65+";
                    warnings.push("📋 ICD-10: Z11.51 (HPV screening) + Z01.419 (routine GYN exam, no abnormal findings). Use Z01.411 instead of Z01.419 if abnormal findings noted.");

                    if (isHighRisk || hasDysplasiaHistory) {
                        frequencyReminder = "Annual screening (high-risk / hx CIN2+)";
                    } else {
                        warnings.push("⚠️ 65+: Consider stopping screening IF adequate prior screening AND no hx CIN2+ in last 25 years");
                        warnings.push("📋 Document medical necessity for continued screening");
                        frequencyReminder = "Pap every 5 years (if continuing)";
                        denialWarnings.push("⚠️ Document medical necessity for continued screening after age 65");
                    }
                } else if (age >= 30 && age < 65) {
                    // Ages 30-65: Smart Code handles co-test automatically
                    testCodes = [smartCode];
                    questCodeName = smartCodeNames[smartCode];
                    cptCodes = ["88175", "87624", "87625"];
                    cptReferenceNote = "Quest will bill: 88175 + 87624 + 87625 (if reflex genotyping triggered)";
                    primaryICD10 = "Z12.4";
                    secondaryICD10.push("Z11.51");
                    frequencyReminder = "Pap + HPV co-test every 5 years (ages 30-65)";
                    smartCodeNote = `Tell MA to order ${smartCode} — no age-specific selection needed`;
                } else {
                    // Ages 21-29: Smart Code handles Pap + reflex HPV automatically
                    requiresHPV = false;
                    testCodes = [smartCode];
                    questCodeName = smartCodeNames[smartCode];
                    cptCodes = ["88175"];
                    cptReferenceNote = "Quest will bill: 88175 (+ HPV reflex if ASCUS triggered)";
                    primaryICD10 = "Z12.4";
                    frequencyReminder = "Pap alone every 3 years (ages 21-29)";
                    smartCodeNote = `Tell MA to order ${smartCode} — no age-specific selection needed`;
                    warnings.push("🔵 Ages 21-29: HPV only bills if reflex triggered by ASCUS result");
                }

                if (formData.stiPanel === "full") {
                    warnings.push("🟣 Quest code includes full STI panel (CT/GC/Trich) — ALL IN ONE");
                } else if (formData.stiPanel === "ctng") {
                    warnings.push("🟣 Quest code includes CT/NG screening");
                }
            }
        }

        // Add optional tobacco exposure code for screening visits
        if (icd10Category === "screening" && primaryICD10 === "Z12.4") {
            optionalICD10.push({ code: "Z77.22", description: ICD10_DESCRIPTIONS["Z77.22"], note: "Add if patient has tobacco smoke exposure" });
        }

        // Universal denial prevention warnings
        if (primaryICD10 === "Z12.4") {
            denialWarnings.push("🔵 Use Z12.4 (not Z01.419) to trigger preventive coverage — without it claim may process as diagnostic");
        }
        if (frequencyReminder) {
            denialWarnings.push("⚠️ Early screening before guideline interval = likely denial. Document medical necessity.");
        }

        const requiredFields = [
            { field: "Specimen Source", value: specimenSource },
            { field: "LMP / Menopausal", value: formData.lmp || "REQUIRED" },
            { field: "IUD Present", value: formData.iudPresent === "yes" ? `Yes (${formData.iudType || "type required"})` : "No" },
            { field: "Hysterectomy Status", value: formData.hysterectomyStatus === "none" ? "No hysterectomy" : formData.hysterectomyStatus === "total" ? "Total hysterectomy" : "Supracervical hysterectomy" },
            { field: "Previous Abnormal", value: formData.previousAbnormal || "No" }
        ];

        return {
            labName,
            testCodes,
            cptCodes,
            hcpcsCodes,
            primaryICD10,
            secondaryICD10,
            optionalICD10,
            specimenSource,
            warnings,
            medicareWarnings,
            denialWarnings,
            requiresHPV,
            requiredFields,
            questCodeName,
            smartCodeNote,
            cptReferenceNote,
            frequencyReminder,
            abnormalGuidance,
            icd10Category
        };
    };

    const handleNext = () => {
        // Validation and flow logic
        const age = parseInt(formData.age);

        if (step === 1) {
            if (!formData.age) return;
            if (age < 21) {
                setStep(1.5); // Under 21 branch
            } else {
                setStep(2);
            }
        } else if (step === 1.5) {
            if (!formData.under21Indication) return;
            setStep(2);
        } else if (step === 2) {
            if (!formData.insurance) return;
            if (formData.insurance === "medicare") {
                setStep(2.5); // Medicare frequency check
            } else {
                setStep(3);
            }
        } else if (step === 2.5) {
            if (!formData.recentPapHPV) return;
            setStep(3);
        } else if (step === 3) {
            if (!formData.hysterectomyStatus) return;
            const hasCervix = formData.hysterectomyStatus === "none" || formData.hysterectomyStatus === "supracervical";
            if (!hasCervix) {
                setStep(4); // Post-hyst history
            } else {
                setStep(5);
            }
        } else if (step === 4) {
            if (!formData.postHystHistory) return;
            setStep(7); // Skip to additional fields
        } else if (step === 5) {
            if (!formData.reason) return;
            if (formData.reason === "followup") {
                setStep(5.5); // Ask for previous abnormal
            } else {
                setStep(6);
            }
        } else if (step === 5.5) {
            if (!formData.previousAbnormal) return;
            setStep(6);
        } else if (step === 6) {
            if (!formData.stiPanel) return;
            setStep(7);
        } else if (step === 7) {
            if (!formData.lmp || !formData.iudPresent) return;
            const calculatedResult = calculateResult();
            setResult(calculatedResult);
            setStep(8);
        }
    };

    const handleBack = () => {
        if (step === 8) setStep(7);
        else if (step === 7) {
            const hasCervix = formData.hysterectomyStatus === "none" || formData.hysterectomyStatus === "supracervical";
            if (!hasCervix) {
                setStep(4);
            } else {
                setStep(6);
            }
        } else if (step === 6) {
            if (formData.reason === "followup") {
                setStep(5.5);
            } else {
                setStep(5);
            }
        } else if (step === 5.5) setStep(5);
        else if (step === 5) setStep(3);
        else if (step === 4) setStep(3);
        else if (step === 3) {
            if (formData.insurance === "medicare") {
                setStep(2.5);
            } else {
                setStep(2);
            }
        }
        else if (step === 2.5) setStep(2);
        else if (step === 2) {
            const age = parseInt(formData.age);
            if (age < 21) {
                setStep(1.5);
            } else {
                setStep(1);
            }
        } else if (step === 1.5) setStep(1);
        else if (step > 1) setStep(step - 1);
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Pap Smear Ordering Wizard</h1>
                    <p className="text-gray-600">Contemporary Health Center | USPSTF Guidelines | Quest Smart Codes 91384/91385/91386</p>
                </div>

                <Card className="shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <CardTitle className="text-2xl">
                            {step === 8 ? "Order Summary" : `Step ${Math.floor(step)}: ${
                                step === 1 ? "Patient Age" :
                                step === 1.5 ? "Clinical Indication (Under 21)" :
                                step === 2 ? "Insurance Provider" :
                                step === 2.5 ? "Medicare Screening Frequency" :
                                step === 3 ? "Hysterectomy Status" :
                                step === 4 ? "Post-Hysterectomy History" :
                                step === 5 ? "Reason for Test" :
                                step === 5.5 ? "Previous Abnormal Result" :
                                step === 6 ? "STI Panel" :
                                step === 7 ? "Additional Required Fields" : ""
                            }`}
                        </CardTitle>
                        <CardDescription className="text-blue-100">
                            {step < 8 && "Answer the questions below to generate proper codes and requirements"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        {/* Step 1: Age */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <Label htmlFor="age" className="text-lg font-semibold">Patient's Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    placeholder="Enter age in years"
                                    value={formData.age}
                                    onChange={(e) => updateFormData("age", e.target.value)}
                                    className="text-lg"
                                />
                                {formData.age && parseInt(formData.age) < 21 && (
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-800">
                                            Patient under 21 - special screening rules apply
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        {/* Step 1.5: Under 21 Indication */}
                        {step === 1.5 && (
                            <div className="space-y-4">
                                <Alert className="bg-red-50 border-red-200">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-800 font-semibold">
                                        ROUTINE SCREENING NOT RECOMMENDED UNDER 21 (per USPSTF/ACOG)
                                    </AlertDescription>
                                </Alert>
                                <Label className="text-lg font-semibold">Clinical Indication (Required)</Label>
                                <RadioGroup value={formData.under21Indication} onValueChange={(val) => updateFormData("under21Indication", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="routine" id="routine" />
                                        <Label htmlFor="routine" className="cursor-pointer flex-1">Routine screening (NOT covered - parent request only)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="symptomatic" id="symptomatic" />
                                        <Label htmlFor="symptomatic" className="cursor-pointer flex-1">Symptomatic (bleeding, discharge) - COVERED</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="hiv" id="hiv" />
                                        <Label htmlFor="hiv" className="cursor-pointer flex-1">HIV positive - COVERED</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="immunocompromised" id="immunocompromised" />
                                        <Label htmlFor="immunocompromised" className="cursor-pointer flex-1">Immunocompromised - COVERED</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="des" id="des" />
                                        <Label htmlFor="des" className="cursor-pointer flex-1">DES exposure in utero - COVERED</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="visible-lesion" id="visible-lesion" />
                                        <Label htmlFor="visible-lesion" className="cursor-pointer flex-1">Visible cervical lesion - COVERED</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 2: Insurance */}
                        {step === 2 && formData.insurance === "medicare" && parseInt(formData.age) > 65 && (
                            <Alert className="bg-red-50 border-red-300 mb-4">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    <strong>Medicare + Over 65:</strong> HPV screening is NOT covered. Special rules apply.
                                </AlertDescription>
                            </Alert>
                        )}
                        {step === 2 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">Patient's Insurance</Label>
                                <RadioGroup value={formData.insurance} onValueChange={(val) => updateFormData("insurance", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="lee" id="lee" />
                                        <Label htmlFor="lee" className="cursor-pointer flex-1">Lee Health Insurance → AmeriPath Lab</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-blue-50">
                                        <RadioGroupItem value="medicare" id="medicare" />
                                        <Label htmlFor="medicare" className="cursor-pointer flex-1">Medicare → Quest Diagnostics</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-purple-50">
                                        <RadioGroupItem value="other" id="other" />
                                        <Label htmlFor="other" className="cursor-pointer flex-1">All Other Insurance → Quest Diagnostics</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 2.5: Medicare Frequency Check */}
                        {step === 2.5 && (
                            <div className="space-y-4">
                                <Alert className="bg-blue-50 border-blue-300">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        <strong>Medicare Coverage Rule (NCD 210.2.1):</strong> Screening Pap is covered once every <strong>24 months</strong> (or every <strong>12 months</strong> if high-risk: HIV+, immunocompromised, DES exposure, or history of CIN2+).
                                    </AlertDescription>
                                </Alert>
                                <Label className="text-lg font-semibold">Has this patient had a Pap/HPV in the last 24 months?</Label>
                                <RadioGroup value={formData.recentPapHPV} onValueChange={(val) => updateFormData("recentPapHPV", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="yes" id="recent-yes" />
                                        <Label htmlFor="recent-yes" className="cursor-pointer flex-1">
                                            <div>Yes — had Pap/HPV within last 24 months</div>
                                            <div className="text-xs text-red-600 mt-1">⚠️ Medicare may deny — screening not due yet</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="no" id="recent-no" />
                                        <Label htmlFor="recent-no" className="cursor-pointer flex-1">
                                            <div>No — more than 24 months since last screening</div>
                                            <div className="text-xs text-green-600 mt-1">✅ Screening is due per Medicare frequency</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                                        <RadioGroupItem value="unknown" id="recent-unknown" />
                                        <Label htmlFor="recent-unknown" className="cursor-pointer flex-1">
                                            <div>Unknown — unable to verify</div>
                                            <div className="text-xs text-yellow-600 mt-1">⚠️ Recommend verifying before ordering</div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 3: Hysterectomy Status */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">Hysterectomy Status</Label>
                                <Alert className="bg-blue-50 border-blue-200">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        <strong>Key Point:</strong> Hysterectomy terminology refers to the uterus/cervix, NOT the ovaries. For Pap screening, only the CERVIX matters!
                                    </AlertDescription>
                                </Alert>
                                <RadioGroup value={formData.hysterectomyStatus} onValueChange={(val) => updateFormData("hysterectomyStatus", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                                        <RadioGroupItem value="none" id="none" />
                                        <Label htmlFor="none" className="cursor-pointer flex-1">No hysterectomy (cervix present)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-purple-50">
                                        <RadioGroupItem value="supracervical" id="supracervical" />
                                        <Label htmlFor="supracervical" className="cursor-pointer flex-1">
                                            <div>Supracervical/Partial (uterus removed, <strong>cervix REMAINS</strong>)</div>
                                            <div className="text-xs text-gray-600 mt-1">Still needs full Pap+HPV screening</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-orange-50">
                                        <RadioGroupItem value="total" id="total" />
                                        <Label htmlFor="total" className="cursor-pointer flex-1">
                                            <div>Total hysterectomy (uterus + cervix removed, <strong>NO cervix</strong>)</div>
                                            <div className="text-xs text-gray-600 mt-1">Vaginal Pap only if hx dysplasia</div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 4: Post-Hyst History */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">History of Cervical Dysplasia or Cancer?</Label>
                                <Alert className="bg-yellow-50 border-yellow-200">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800">
                                        Per USPSTF: Vaginal cuff Pap only indicated if history of dysplasia (CIN 2+) or cervical cancer
                                    </AlertDescription>
                                </Alert>
                                <RadioGroup value={formData.postHystHistory} onValueChange={(val) => updateFormData("postHystHistory", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="no-history" id="no-history" />
                                        <Label htmlFor="no-history" className="cursor-pointer flex-1">No history of dysplasia/cancer → Pap NOT indicated</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="dysplasia" id="dysplasia" />
                                        <Label htmlFor="dysplasia" className="cursor-pointer flex-1">History of cervical dysplasia (CIN 2+)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="cin" id="cin" />
                                        <Label htmlFor="cin" className="cursor-pointer flex-1">History of CIN (in-situ)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="cancer" id="cancer" />
                                        <Label htmlFor="cancer" className="cursor-pointer flex-1">History of cervical cancer</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 5: Reason */}
                        {step === 5 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">Reason for Test</Label>
                                <RadioGroup value={formData.reason} onValueChange={(val) => updateFormData("reason", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-blue-50">
                                        <RadioGroupItem value="routine" id="routine-reason" />
                                        <Label htmlFor="routine-reason" className="cursor-pointer flex-1">Routine screening (standard interval)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-orange-50">
                                        <RadioGroupItem value="followup" id="followup" />
                                        <Label htmlFor="followup" className="cursor-pointer flex-1">Follow-up for previous abnormal result</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-purple-50">
                                        <RadioGroupItem value="high-risk" id="high-risk" />
                                        <Label htmlFor="high-risk" className="cursor-pointer flex-1">
                                            <div>High-risk patient (annual coverage)</div>
                                            <div className="text-xs text-gray-600 mt-1">DES exposure, history of CIN2+, etc.</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="hiv" id="hiv-reason" />
                                        <Label htmlFor="hiv-reason" className="cursor-pointer flex-1">
                                            <div>HIV positive — screen annually regardless of age</div>
                                            <div className="text-xs text-gray-600 mt-1">Uses Z12.4 + B20</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="immunocompromised" id="immunocompromised-reason" />
                                        <Label htmlFor="immunocompromised-reason" className="cursor-pointer flex-1">
                                            <div>Immunocompromised — screen annually regardless of age</div>
                                            <div className="text-xs text-gray-600 mt-1">Same protocol as HIV+</div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 5.5: Previous Abnormal Result */}
                        {step === 5.5 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">What was the previous abnormal result?</Label>
                                <Alert className="bg-amber-50 border-amber-300">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800 font-medium">
                                        This determines the correct diagnostic ICD-10 code. Do NOT use screening code Z12.4 for follow-up of abnormal results.
                                    </AlertDescription>
                                </Alert>
                                <RadioGroup value={formData.previousAbnormal} onValueChange={(val) => updateFormData("previousAbnormal", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-yellow-50">
                                        <RadioGroupItem value="asc-us-normal-hpv" id="asc-us-normal-hpv" />
                                        <Label htmlFor="asc-us-normal-hpv" className="cursor-pointer flex-1">
                                            <div>ASC-US with normal HPV</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.611 — Repeat co-test in 3 years</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-orange-50">
                                        <RadioGroupItem value="asc-us-hpv-pos" id="asc-us-hpv-pos" />
                                        <Label htmlFor="asc-us-hpv-pos" className="cursor-pointer flex-1">
                                            <div>ASC-US with HPV positive</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.611 + R87.810 — Colposcopy recommended</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-orange-50">
                                        <RadioGroupItem value="asc-h" id="asc-h" />
                                        <Label htmlFor="asc-h" className="cursor-pointer flex-1">
                                            <div>ASC-H (atypical squamous cells, cannot exclude HSIL)</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.610 — Colposcopy required regardless of HPV</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-orange-50">
                                        <RadioGroupItem value="lsil" id="lsil" />
                                        <Label htmlFor="lsil" className="cursor-pointer flex-1">
                                            <div>LSIL (low-grade squamous intraepithelial lesion)</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.612 — Co-test or colposcopy based on age</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="hsil" id="hsil" />
                                        <Label htmlFor="hsil" className="cursor-pointer flex-1">
                                            <div>HSIL / CIN2+ (high-grade squamous intraepithelial lesion)</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.613 — Colposcopy required</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="agc" id="agc" />
                                        <Label htmlFor="agc" className="cursor-pointer flex-1">
                                            <div>AGC (atypical glandular cells)</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.620 — Colposcopy + endocervical sampling required</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-purple-50">
                                        <RadioGroupItem value="hpv" id="hpv-positive" />
                                        <Label htmlFor="hpv-positive" className="cursor-pointer flex-1">
                                            <div>HPV positive only (Pap was normal)</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.810 — Repeat co-test in 12 months</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="hpv-16-18" id="hpv-16-18" />
                                        <Label htmlFor="hpv-16-18" className="cursor-pointer flex-1">
                                            <div>HPV 16 or 18 positive</div>
                                            <div className="text-xs text-gray-600 mt-1">R87.810 + R87.820 — Colposcopy regardless of Pap</div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 6: STI Panel */}
                        {step === 6 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">Add STI Screening?</Label>
                                <RadioGroup value={formData.stiPanel} onValueChange={(val) => updateFormData("stiPanel", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                                        <RadioGroupItem value="no" id="sti-no" />
                                        <Label htmlFor="sti-no" className="cursor-pointer flex-1">
                                            <div>No STI — Pap/HPV only</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {formData.insurance === "lee" ? "AmeriPath standard order" : "Quest Smart Code 91384"}
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="full" id="sti-full" />
                                        <Label htmlFor="sti-full" className="cursor-pointer flex-1">
                                            <div>Full STI panel — CT/NG + Trichomonas</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {formData.insurance === "lee" ? "AmeriPath: Add 'STI panel' to instructions" : "Quest Smart Code 91386 (includes all)"}
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-blue-50">
                                        <RadioGroupItem value="ctng" id="sti-ctng" />
                                        <Label htmlFor="sti-ctng" className="cursor-pointer flex-1">
                                            <div>CT/NG only — no Trichomonas</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {formData.insurance === "lee" ? "AmeriPath: Add 'CT/NG' to instructions" : "Quest Smart Code 91385"}
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 7: Additional Fields */}
                        {step === 7 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="lmp" className="text-lg font-semibold">LMP / Menopausal Status *</Label>
                                    <Input
                                        id="lmp"
                                        placeholder="MM/DD/YYYY or 'Postmenopausal' or 'Perimenopausal'"
                                        value={formData.lmp}
                                        onChange={(e) => updateFormData("lmp", e.target.value)}
                                    />
                                    <p className="text-sm text-gray-600">Required - affects interpretation</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">IUD Present? *</Label>
                                    <RadioGroup value={formData.iudPresent} onValueChange={(val) => updateFormData("iudPresent", val)}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id="iud-yes" />
                                            <Label htmlFor="iud-yes" className="cursor-pointer">Yes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id="iud-no" />
                                            <Label htmlFor="iud-no" className="cursor-pointer">No</Label>
                                        </div>
                                    </RadioGroup>
                                    {formData.iudPresent === "yes" && (
                                        <Input
                                            placeholder="IUD type (e.g., Mirena, Paragard, Kyleena)"
                                            value={formData.iudType}
                                            onChange={(e) => updateFormData("iudType", e.target.value)}
                                            className="mt-2"
                                        />
                                    )}
                                    <p className="text-sm text-gray-600">IUD causes reactive changes on Pap</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">Ovary Status (Optional)</Label>
                                    <Input
                                        placeholder="e.g., 'Ovaries removed (BSO)', 'Ovaries preserved', 'One ovary removed'"
                                        value={formData.ovariesStatus}
                                        onChange={(e) => updateFormData("ovariesStatus", e.target.value)}
                                    />
                                    <p className="text-sm text-gray-600">Doesn't affect Pap order, but helps with LMP field</p>
                                </div>
                            </div>
                        )}

                        {/* Step 8: Results */}
                        {step === 8 && result && (
                            <div className="space-y-6">
                                {/* Medicare-specific denial risk warnings — prominent red boxes */}
                                {result.medicareWarnings && result.medicareWarnings.length > 0 && (
                                    <div className="space-y-2 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
                                        <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            Medicare Coverage Alerts (NCD 210.2.1)
                                        </h3>
                                        {result.medicareWarnings.map((warning, idx) => (
                                            <Alert key={`mw-${idx}`} className={warning.includes("🚨") ? "bg-red-100 border-red-400" : warning.includes("⚠️") ? "bg-yellow-100 border-yellow-400" : "bg-blue-100 border-blue-300"}>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="font-semibold text-sm">{warning}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}

                                {/* Denial Prevention Warnings */}
                                {result.denialWarnings && result.denialWarnings.length > 0 && (
                                    <div className="space-y-2 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg">
                                        <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            Denial Prevention — Insurance Golden Rules
                                        </h3>
                                        {result.denialWarnings.map((warning, idx) => (
                                            <Alert key={`dw-${idx}`} className="bg-amber-100 border-amber-300">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="font-medium text-sm text-amber-900">{warning}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}

                                {result.warnings.length > 0 && (
                                    <div className="space-y-2">
                                        {result.warnings.map((warning, idx) => (
                                            <Alert key={idx} className={warning.includes("NOT") ? "bg-red-50 border-red-200" : warning.includes("🟢") ? "bg-green-50 border-green-200" : warning.includes("🔵") ? "bg-blue-50 border-blue-200" : warning.includes("📋") ? "bg-indigo-50 border-indigo-200" : "bg-yellow-50 border-yellow-200"}>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="font-medium">{warning}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}

                                {result.labName !== "NOT RECOMMENDED" && result.labName !== "NOT INDICATED" && (
                                    <>
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
                                            <h3 className="text-2xl font-bold mb-2">Laboratory</h3>
                                            <p className="text-3xl font-bold">{result.labName}</p>
                                        </div>

                                        {/* Recommended Quest Code — prominent display */}
                                        {result.questCodeName && (
                                            <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300">
                                                <CardContent className="p-6">
                                                    <div className="text-center">
                                                        <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-1">
                                                            {result.smartCodeNote ? "Quest Smart Code — Primary Order" : "Recommended Quest Order Code"}
                                                        </p>
                                                        <p className="text-4xl font-bold text-purple-900 mb-1">{result.testCodes[0]}</p>
                                                        <p className="text-lg text-purple-700">{result.questCodeName}</p>
                                                        {result.smartCodeNote && (
                                                            <p className="text-sm font-semibold text-green-700 mt-2">
                                                                ✅ Age-based logic built in — Quest handles the rest
                                                            </p>
                                                        )}
                                                        {result.frequencyReminder && (
                                                            <p className="text-sm font-semibold text-blue-700 mt-3 bg-blue-50 inline-block px-3 py-1 rounded-full">
                                                                {result.frequencyReminder}
                                                            </p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Smart Code MA instruction + USPSTF note */}
                                        {result.smartCodeNote && (
                                            <Card className="bg-green-50 border-2 border-green-300">
                                                <CardContent className="p-4 space-y-2">
                                                    <p className="font-bold text-green-900 text-lg">📋 {result.smartCodeNote}</p>
                                                    {result.cptReferenceNote && (
                                                        <p className="text-sm text-green-800">📊 {result.cptReferenceNote}</p>
                                                    )}
                                                    <p className="text-sm text-green-800 italic">
                                                        Quest Smart Codes automatically apply the correct USPSTF protocol based on patient age entered on the requisition.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <Card className="bg-purple-50">
                                                <CardHeader>
                                                    <CardTitle className="text-purple-900">Test Code(s) to Search/Order</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {result.testCodes.map((code, idx) => (
                                                        <div key={idx} className="text-2xl font-bold text-purple-700 mb-1">{code}</div>
                                                    ))}
                                                    {result.testCodes.length === 0 && <p className="text-gray-500">N/A</p>}
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-blue-50">
                                                <CardHeader>
                                                    <CardTitle className="text-blue-900">{result.smartCodeNote ? "CPT Codes Quest Will Bill" : "CPT Codes"}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-sm text-blue-700">
                                                        {result.cptCodes.join(", ") || "N/A"}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* HCPCS Codes (Medicare G-codes) */}
                                        {result.hcpcsCodes && result.hcpcsCodes.length > 0 && (
                                            <Card className="bg-amber-50 border-amber-300">
                                                <CardHeader>
                                                    <CardTitle className="text-amber-900">HCPCS Codes (Medicare)</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {result.hcpcsCodes.map((code, idx) => (
                                                        <div key={idx} className="text-2xl font-bold text-amber-700 mb-1">{code}</div>
                                                    ))}
                                                    <p className="text-sm text-amber-800 mt-2 font-medium">
                                                        {result.hcpcsCodes.includes("G0476") && "G0476 = bundled HPV co-test for Medicare (NOT 88175 + 87624 separately)"}
                                                        {result.hcpcsCodes.includes("Q0091") && " | Q0091 = specimen collection"}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card className={result.icd10Category === "diagnostic" ? "bg-orange-50 border-2 border-orange-300" : "bg-green-50 border-2 border-green-300"}>
                                            <CardHeader>
                                                <CardTitle className={result.icd10Category === "diagnostic" ? "text-orange-900 flex items-center gap-2" : "text-green-900 flex items-center gap-2"}>
                                                    <Stethoscope className="w-5 h-5" />
                                                    ICD-10 Diagnosis Codes
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${result.icd10Category === "diagnostic" ? "bg-orange-200 text-orange-800" : "bg-green-200 text-green-800"}`}>
                                                        {result.icd10Category === "diagnostic" ? "DIAGNOSTIC" : "SCREENING"}
                                                    </span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-white rounded-lg border">
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Primary Diagnosis</div>
                                                        <div className="text-2xl font-bold text-gray-900">{result.primaryICD10}</div>
                                                        <div className="text-sm text-gray-700 mt-1">{ICD10_DESCRIPTIONS[result.primaryICD10] || ""}</div>
                                                    </div>
                                                    {result.secondaryICD10.length > 0 && result.secondaryICD10.map((code, idx) => (
                                                        <div key={idx} className="p-3 bg-white rounded-lg border">
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Secondary Diagnosis {result.secondaryICD10.length > 1 ? `#${idx + 1}` : ""}</div>
                                                            <div className="text-xl font-bold text-gray-800">{code}</div>
                                                            <div className="text-sm text-gray-700 mt-1">{ICD10_DESCRIPTIONS[code] || ""}</div>
                                                        </div>
                                                    ))}
                                                    {result.optionalICD10 && result.optionalICD10.length > 0 && result.optionalICD10.map((item, idx) => (
                                                        <div key={`opt-${idx}`} className="p-3 bg-gray-50 rounded-lg border border-dashed">
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Optional — Add If Applicable</div>
                                                            <div className="text-lg font-bold text-gray-700">{item.code}</div>
                                                            <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                                                            <div className="text-xs text-gray-500 mt-1 italic">{item.note}</div>
                                                        </div>
                                                    ))}
                                                    {result.abnormalGuidance && result.abnormalGuidance.alternateCode && (
                                                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-yellow-700 mb-1">Alternate Code (Post-Treatment)</div>
                                                            <div className="text-lg font-bold text-yellow-800">{result.abnormalGuidance.alternateCode}</div>
                                                            <div className="text-sm text-yellow-700 mt-1">{ICD10_DESCRIPTIONS[result.abnormalGuidance.alternateCode] || ""}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${result.icd10Category === "diagnostic" ? "bg-orange-100 text-orange-900" : "bg-green-100 text-green-900"}`}>
                                                    {result.icd10Category === "diagnostic"
                                                        ? "CRITICAL: This is a DIAGNOSTIC visit. Use diagnostic codes (R87.xxx / Z86.001). Do NOT use Z12.4 — it will cause denials."
                                                        : "CRITICAL: Screening codes (Z12.4) = preventive, $0 cost-share. Diagnostic codes = may have cost-sharing. Do NOT mix them."}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Abnormal Follow-Up Clinical Guidance */}
                                        {result.abnormalGuidance && (
                                            <Card className="bg-indigo-50 border-2 border-indigo-300">
                                                <CardHeader>
                                                    <CardTitle className="text-indigo-900 flex items-center gap-2">
                                                        <Stethoscope className="w-5 h-5" />
                                                        Clinical Guidance — Abnormal Follow-Up
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className="p-4 bg-white rounded-lg border">
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">Recommended Action</div>
                                                        <div className="text-lg font-bold text-indigo-900">{result.abnormalGuidance.recommendation}</div>
                                                    </div>
                                                    <div className="p-4 bg-white rounded-lg border">
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">Clinical Note</div>
                                                        <div className="text-sm font-medium text-gray-800">{result.abnormalGuidance.note}</div>
                                                    </div>
                                                    <div className="p-3 bg-indigo-100 rounded-lg text-sm">
                                                        <span className="font-bold text-indigo-900">Quest Code:</span>
                                                        <span className="ml-2 text-indigo-800">91384 (Smart Code)</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="w-5 h-5" />
                                                    Required Fields Checklist
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {result.requiredFields.map((field, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2 border rounded">
                                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                            <div className="flex-1">
                                                                <span className="font-semibold">{field.field}:</span>
                                                                <span className="ml-2 text-gray-700">{field.value}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {!result.requiresHPV && (
                                            <Alert className="bg-yellow-50 border-yellow-300">
                                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                <AlertDescription className="text-yellow-900 font-semibold">
                                                    NO HPV TESTING for this order - Pap only
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                            {step > 1 && step < 8 && (
                                <Button onClick={handleBack} variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </Button>
                            )}
                            {step === 8 && (
                                <Button onClick={resetWizard} variant="outline" className="gap-2">
                                    <RotateCcw className="w-4 h-4" /> Start New Order
                                </Button>
                            )}
                            <div className="ml-auto">
                                {step < 8 && (
                                    <Button
                                        onClick={handleNext}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 gap-2"
                                    >
                                        {step === 7 ? "Generate Results" : "Next"} <ArrowRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Reference Guide | USPSTF Guidelines | Quest Smart Codes 91384/91385/91386 | Updated 2026</p>
                    <p className="mt-1">This reference guide is for educational purposes only. Always verify codes with current CMS guidelines.</p>
                </div>
            </div>
        </div>
    );
}
