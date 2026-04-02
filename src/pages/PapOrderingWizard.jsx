import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, RotateCcw, FileText } from "lucide-react";

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
        recentPapHPV: ""
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
            recentPapHPV: ""
        });
        setResult(null);
    };

    const calculateResult = () => {
        const age = parseInt(formData.age);
        const isUnder21 = age < 21;
        const hasLeeHealth = formData.insurance === "lee";
        const hasCervix = formData.hysterectomyStatus === "none" || formData.hysterectomyStatus === "supracervical";
        const needsSTI = formData.stiPanel === "yes";
        const isMedicare = formData.insurance === "medicare";
        const isHighRisk = formData.reason === "high-risk";
        const hadRecentPap = formData.recentPapHPV === "yes";
        const hasDysplasiaHistory = formData.postHystHistory === "dysplasia" || formData.postHystHistory === "cin" || formData.postHystHistory === "cancer";

        let labName = "";
        let testCodes = [];
        let cptCodes = [];
        let hcpcsCodes = [];
        let primaryICD10 = "";
        let secondaryICD10 = [];
        let specimenSource = "";
        let warnings = [];
        let medicareWarnings = [];
        let requiresHPV = true;

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
                    requiresHPV: false,
                    requiredFields: []
                };
            }

            // Diagnostic under 21
            labName = hasLeeHealth ? "AmeriPath" : "Quest Diagnostics";
            testCodes = hasLeeHealth ? ["Q0091"] : ["58315"];
            cptCodes = ["88175"];
            specimenSource = hasCervix ? "Cervix" : "Vaginal cuff";

            switch (formData.under21Indication) {
                case "symptomatic":
                    primaryICD10 = "N93.9";
                    secondaryICD10 = ["N89.8"];
                    break;
                case "hiv":
                    primaryICD10 = "B20";
                    secondaryICD10 = ["Z01.419"];
                    break;
                case "immunocompromised":
                    primaryICD10 = "D89.9";
                    secondaryICD10 = ["Z01.419"];
                    break;
                case "des":
                    primaryICD10 = "Z77.9";
                    secondaryICD10 = ["Z01.419"];
                    break;
                case "visible-lesion":
                    primaryICD10 = "N88.8";
                    secondaryICD10 = ["N87.9"];
                    break;
                default:
                    primaryICD10 = "N93.9";
                    secondaryICD10 = ["N89.8"];
            }

            warnings.push("🔵 Use 58315 (Pap only) - NO HPV testing");
            warnings.push("🔵 Use DIAGNOSTIC codes, not screening");
            warnings.push("🔵 Document clinical indication");
        } 
        // Post-hysterectomy NO cervix
        else if (!hasCervix) {
            requiresHPV = false;
            labName = hasLeeHealth ? "AmeriPath" : "Quest Diagnostics";
            testCodes = hasLeeHealth ? ["Q0091"] : ["58315"];
            cptCodes = ["88175"];
            specimenSource = "Vaginal cuff";
            secondaryICD10 = ["Z90.710"];

            if (formData.postHystHistory === "no-history") {
                warnings.push("⚠️ Pap NOT typically indicated per USPSTF (no history of dysplasia/cancer)");
                if (isMedicare) {
                    medicareWarnings.push("🚨 MEDICARE WILL NOT COVER screening Pap or HPV for post-hysterectomy patients without cervix and no history of dysplasia/cancer. Patient will be responsible for full cost.");
                    medicareWarnings.push("⚠️ Recommend NOT ordering — or obtain signed ABN (Advance Beneficiary Notice) before proceeding.");
                }
                primaryICD10 = "Z01.419";
            } else if (formData.postHystHistory === "dysplasia") {
                primaryICD10 = "Z87.410";
                if (isMedicare) {
                    medicareWarnings.push("🔵 MEDICARE: Post-hysterectomy with dysplasia history — Pap may be covered as DIAGNOSTIC (not screening). Use diagnostic ICD-10 codes.");
                    medicareWarnings.push("🔵 Use Z87.410 as primary diagnosis. Do NOT use screening codes (Z01.419).");
                }
            } else if (formData.postHystHistory === "cin") {
                primaryICD10 = "Z86.001";
                if (isMedicare) {
                    medicareWarnings.push("🔵 MEDICARE: Post-hysterectomy with CIN history — Pap may be covered as DIAGNOSTIC. Use Z86.001 as primary.");
                }
            } else {
                primaryICD10 = "Z85.41";
                if (isMedicare) {
                    medicareWarnings.push("🔵 MEDICARE: Post-hysterectomy with cervical cancer history — Pap covered as DIAGNOSTIC. Use Z85.41 as primary.");
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
                    
                    if (formData.previousAbnormal === "asc-us") {
                        primaryICD10 = "R87.610";
                    } else if (formData.previousAbnormal === "lsil") {
                        primaryICD10 = "R87.612";
                    } else if (formData.previousAbnormal === "hsil") {
                        primaryICD10 = "R87.613";
                    } else if (formData.previousAbnormal === "hpv") {
                        primaryICD10 = "R87.810";
                    } else {
                        primaryICD10 = "R87.610";
                    }
                } else if (isHighRisk) {
                    testCodes = ["Q0091", "87625"];
                    cptCodes = ["88175", "87624", "87625"];
                    primaryICD10 = "Z91.89";
                    secondaryICD10.push("Z11.51");
                } else {
                    testCodes = ["Q0091", "87625"];
                    cptCodes = ["88175", "87624", "87625"];
                    primaryICD10 = "Z01.419";
                    secondaryICD10.push("Z11.51");
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
                    if (isHighRisk) {
                        medicareWarnings.push("⚠️ MEDICARE HIGH-RISK: Pap covered every 12 months. Verify last Pap was >12 months ago.");
                    } else {
                        medicareWarnings.push("🚨 MEDICARE FREQUENCY: Screening Pap is covered once every 24 months. Patient had Pap/HPV in the last 24 months — this order will likely be DENIED. Patient will be responsible for full cost.");
                    }
                }

                if (formData.reason === "followup") {
                    // Follow-up is diagnostic, not screening — standard codes apply
                    testCodes = needsSTI ? ["91386"] : ["91414"];
                    cptCodes = needsSTI ? ["88175", "87624", "87625", "87494", "87661"] : ["88175", "87624", "87625"];
                    
                    if (formData.previousAbnormal === "asc-us") {
                        primaryICD10 = "R87.610";
                    } else if (formData.previousAbnormal === "lsil") {
                        primaryICD10 = "R87.612";
                    } else if (formData.previousAbnormal === "hsil") {
                        primaryICD10 = "R87.613";
                    } else if (formData.previousAbnormal === "hpv") {
                        primaryICD10 = "R87.810";
                    } else {
                        primaryICD10 = "R87.610";
                    }
                    warnings.push("🔵 MEDICARE: Follow-up is DIAGNOSTIC — standard CPT codes apply (not G0476).");
                }
                // Medicare OVER 65 with cervix
                else if (age > 65) {
                    requiresHPV = false;
                    // Pap-only for over 65
                    testCodes = ["58315"];
                    cptCodes = ["88175"];

                    if (isHighRisk) {
                        primaryICD10 = "Z91.89";
                        secondaryICD10.push("Z01.411");
                        medicareWarnings.push("⚠️ MEDICARE DOES NOT COVER HPV SCREENING FOR PATIENTS OVER 65. HPV testing will be patient responsibility (~$150+). Consider Pap-only order.");
                        medicareWarnings.push("🔵 MEDICARE HIGH-RISK OVER 65: Pap covered every 12 months. HPV is NOT covered even for high-risk patients over 65.");
                        warnings.push("📋 Medicare high-risk: Pap every 12 months (no HPV)");
                    } else {
                        primaryICD10 = "Z01.419";
                        secondaryICD10.push("Z11.51");
                        medicareWarnings.push("⚠️ MEDICARE DOES NOT COVER HPV SCREENING FOR PATIENTS OVER 65. HPV testing will be patient responsibility (~$150+). Consider Pap-only order.");
                        medicareWarnings.push("🔵 MEDICARE OVER 65: Use Quest code 58315 (Pap only). Do NOT use 91414 (Pap+HPV combo) — HPV portion will be denied.");
                        warnings.push("📋 Medicare screening: Pap covered every 24 months");
                    }
                }
                // Medicare age 30-65 with cervix — HPV covered with G0476
                else if (age >= 30 && age <= 65) {
                    if (isHighRisk) {
                        testCodes = needsSTI ? ["91386"] : ["91414"];
                        cptCodes = ["88175"];
                        hcpcsCodes = ["G0476"];
                        primaryICD10 = "Z91.89";
                        secondaryICD10.push("Z11.51");
                        secondaryICD10.push("Z01.411");
                        medicareWarnings.push("🔵 MEDICARE: Use G0476 for HPV screening. Do NOT use 87624/87625 (will be denied).");
                        medicareWarnings.push("🔵 MEDICARE HIGH-RISK: Pap+HPV covered every 12 months.");
                        warnings.push("📋 Dual diagnosis required: Z11.51 (HPV screening) + Z01.411 (Pap encounter)");
                    } else {
                        testCodes = needsSTI ? ["91386"] : ["91414"];
                        cptCodes = ["88175"];
                        hcpcsCodes = ["G0476"];
                        primaryICD10 = "Z11.51";
                        secondaryICD10.push("Z01.419");
                        medicareWarnings.push("🔵 MEDICARE: Use G0476 for HPV screening. Do NOT use 87624/87625 (will be denied).");
                        medicareWarnings.push("📋 MEDICARE SCREENING: Pap+HPV covered once every 24 months. Ensure >24 months since last screening.");
                        warnings.push("📋 Medicare dual diagnosis: Primary Z11.51 + Secondary Z01.419");
                    }
                }
                // Medicare under 30 with cervix — no HPV screening (not indicated <30)
                else {
                    requiresHPV = false;
                    testCodes = ["58315"];
                    cptCodes = ["88175"];
                    primaryICD10 = "Z01.419";
                    warnings.push("🔵 Patient under 30: HPV co-testing not recommended per guidelines");
                    medicareWarnings.push("📋 MEDICARE: Pap-only for patients under 30. Covered every 24 months (12 months if high-risk).");
                }

                if (needsSTI) {
                    warnings.push("🟣 Quest code includes STI panel (CT/GC/Trich) - ALL IN ONE");
                }
            }
            // Quest (non-Medicare)
            else {
                labName = "Quest Diagnostics";

                if (formData.reason === "followup") {
                    testCodes = needsSTI ? ["91386"] : ["91414"];
                    cptCodes = needsSTI ? ["88175", "87624", "87625", "87494", "87661"] : ["88175", "87624", "87625"];
                    
                    if (formData.previousAbnormal === "asc-us") {
                        primaryICD10 = "R87.610";
                    } else if (formData.previousAbnormal === "lsil") {
                        primaryICD10 = "R87.612";
                    } else if (formData.previousAbnormal === "hsil") {
                        primaryICD10 = "R87.613";
                    } else if (formData.previousAbnormal === "hpv") {
                        primaryICD10 = "R87.810";
                    } else {
                        primaryICD10 = "R87.610";
                    }
                } else {
                    testCodes = needsSTI ? ["91386"] : ["91414"];
                    cptCodes = needsSTI ? ["88175", "87624", "87625", "87494", "87661"] : ["88175", "87624", "87625"];
                    primaryICD10 = "Z01.419";
                    secondaryICD10.push("Z11.51");
                }

                if (needsSTI) {
                    warnings.push("🟣 Quest code includes STI panel (CT/GC/Trich) - ALL IN ONE");
                }
            }
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
            specimenSource,
            warnings,
            medicareWarnings,
            requiresHPV,
            requiredFields
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
                    <p className="text-gray-600">Contemporary Health Center | ICD-10 & CPT Code Helper</p>
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
                                    {formData.insurance === "medicare" && (
                                        <div className="flex items-center space-x-2 p-3 border rounded hover:bg-purple-50">
                                            <RadioGroupItem value="high-risk" id="high-risk" />
                                            <Label htmlFor="high-risk" className="cursor-pointer flex-1">Medicare high-risk patient (annual coverage)</Label>
                                        </div>
                                    )}
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 5.5: Previous Abnormal */}
                        {step === 5.5 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">Previous Abnormal Finding</Label>
                                <RadioGroup value={formData.previousAbnormal} onValueChange={(val) => updateFormData("previousAbnormal", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-yellow-50">
                                        <RadioGroupItem value="asc-us" id="asc-us" />
                                        <Label htmlFor="asc-us" className="cursor-pointer flex-1">ASC-US (R87.610)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-orange-50">
                                        <RadioGroupItem value="lsil" id="lsil" />
                                        <Label htmlFor="lsil" className="cursor-pointer flex-1">LSIL (R87.612)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-red-50">
                                        <RadioGroupItem value="hsil" id="hsil" />
                                        <Label htmlFor="hsil" className="cursor-pointer flex-1">HSIL (R87.613)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-purple-50">
                                        <RadioGroupItem value="hpv" id="hpv-positive" />
                                        <Label htmlFor="hpv-positive" className="cursor-pointer flex-1">HPV Positive (R87.810)</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Step 6: STI Panel */}
                        {step === 6 && (
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">Add STI Panel? (CT/GC/Trichomonas)</Label>
                                <RadioGroup value={formData.stiPanel} onValueChange={(val) => updateFormData("stiPanel", val)}>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-green-50">
                                        <RadioGroupItem value="yes" id="sti-yes" />
                                        <Label htmlFor="sti-yes" className="cursor-pointer flex-1">
                                            <div>Yes - Add STI screening</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {formData.insurance === "lee" ? "AmeriPath: Add 'STI panel' to instructions" : "Quest: Use code 91386 (includes all)"}
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                                        <RadioGroupItem value="no" id="sti-no" />
                                        <Label htmlFor="sti-no" className="cursor-pointer flex-1">No - Pap/HPV only</Label>
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
                                                    <CardTitle className="text-blue-900">CPT Codes</CardTitle>
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
                                                    <CardTitle className="text-amber-900">⚕️ HCPCS Codes (Medicare)</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {result.hcpcsCodes.map((code, idx) => (
                                                        <div key={idx} className="text-2xl font-bold text-amber-700 mb-1">{code}</div>
                                                    ))}
                                                    <p className="text-sm text-amber-800 mt-2 font-medium">Use HCPCS G0476 instead of CPT 87624/87625 for Medicare HPV screening</p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card className="bg-green-50">
                                            <CardHeader>
                                                <CardTitle className="text-green-900">ICD-10 Diagnosis Codes</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="font-semibold text-green-900">Primary:</span>
                                                        <span className="ml-2 text-xl font-bold text-green-700">{result.primaryICD10}</span>
                                                    </div>
                                                    {result.secondaryICD10.length > 0 && (
                                                        <div>
                                                            <span className="font-semibold text-green-900">Secondary:</span>
                                                            <span className="ml-2 text-lg text-green-700">{result.secondaryICD10.join(", ")}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

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
                    <p>Reference Guide | Quest & AmeriPath Codes | Updated 2026</p>
                    <p className="mt-1">This reference guide is for educational purposes only. Always verify codes with current CMS guidelines.</p>
                </div>
            </div>
        </div>
    );
}