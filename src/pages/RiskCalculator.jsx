import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Heart, Calculator, RotateCcw, AlertTriangle, Info, CheckCircle2, Activity, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// ─── PREVENT Beta Coefficients (Base Model, 10-Year) ───
// Order: [age, nonHdlC, hdlC, sbpLt110, sbpGte110, dm, smoking, bmiLt30, bmiGte30, egfrLt60, egfrGte60, bpTx, statin, bpTxSbpGte110, statinNonHdlC, ageNonHdlC, ageHdlC, ageSbpGte110, ageDm, ageSmoking, ageBmiGte30, ageEgfrLt60, constant]

const BETAS = {
  female: {
    ascvd: [0.719883, 0.1176967, -0.151185, -0.0835358, 0.3592852, 0.8348585, 0.4831078, 0.0, 0.0, 0.4864619, 0.0397779, 0.2265309, -0.0592374, -0.0395762, 0.0844423, -0.0567839, 0.0325692, -0.1035985, -0.2417542, -0.0791142, 0.0, -0.1671492, -3.819975],
    totalCvd: [0.7939329, 0.0305239, -0.1606857, -0.2394003, 0.3600781, 0.8667604, 0.5360739, 0.0, 0.0, 0.6045917, 0.0433769, 0.3151672, -0.1477655, -0.0663612, 0.1197879, -0.0819715, 0.0306769, -0.0946348, -0.27057, -0.078715, 0.0, -0.1637806, -3.307728],
    hf: [0.8998235, 0.0, 0.0, -0.4559771, 0.3576505, 1.038346, 0.583916, -0.0072294, 0.2997706, 0.7451638, 0.0557087, 0.3534442, 0.0, -0.0981511, 0.0, 0.0, 0.0, -0.0946663, -0.3581041, -0.1159453, -0.003878, -0.1884289, -4.310409],
  },
  male: {
    ascvd: [0.7099847, 0.1658663, -0.1144285, -0.2837212, 0.3239977, 0.7189597, 0.3956973, 0.0, 0.0, 0.3690075, 0.0203619, 0.2036522, -0.0865581, -0.0322916, 0.114563, -0.0300005, 0.0232747, -0.0927024, -0.2018525, -0.0970527, 0.0, -0.1217081, -3.500655],
    totalCvd: [0.7688528, 0.0736174, -0.0954431, -0.4347345, 0.3362658, 0.7692857, 0.4386871, 0.0, 0.0, 0.5378979, 0.0164827, 0.288879, -0.1337349, -0.0475924, 0.150273, -0.0517874, 0.0191169, -0.1049477, -0.2251948, -0.0895067, 0.0, -0.1543702, -3.031168],
    hf: [0.8972642, 0.0, 0.0, -0.6811466, 0.3634461, 0.923776, 0.5023736, -0.0485841, 0.3726929, 0.6926917, 0.0251827, 0.2980922, 0.0, -0.0497731, 0.0, 0.0, 0.0, -0.1289201, -0.3040924, -0.1401688, 0.0068126, -0.1797778, -3.946391],
  },
};

function buildPredictors(input) {
  const age = (input.age - 55) / 10;
  const nonHdlC = (input.totalChol - input.hdl) * 0.02586 - 3.5;
  const hdlC = (input.hdl * 0.02586 - 1.3) / 0.3;
  const sbpLt110 = (Math.min(input.sbp, 110) - 110) / 20;
  const sbpGte110 = (Math.max(input.sbp, 110) - 130) / 20;
  const dm = input.diabetes ? 1 : 0;
  const smoking = input.smoker ? 1 : 0;
  const bmiLt30 = (Math.min(input.bmi, 30) - 25) / 5;
  const bmiGte30 = (Math.max(input.bmi, 30) - 30) / 5;
  const egfrLt60 = (Math.min(input.egfr, 60) - 60) / -15;
  const egfrGte60 = (Math.max(input.egfr, 60) - 90) / -15;
  const bpTx = input.onBpMeds ? 1 : 0;
  const statin = input.onStatin ? 1 : 0;

  return [
    age, nonHdlC, hdlC, sbpLt110, sbpGte110, dm, smoking, bmiLt30, bmiGte30,
    egfrLt60, egfrGte60, bpTx, statin,
    bpTx * sbpGte110, statin * nonHdlC,
    age * nonHdlC, age * hdlC, age * sbpGte110, age * dm, age * smoking,
    age * bmiGte30, age * egfrLt60, 1,
  ];
}

function calcRisk(predictors, betas) {
  let logOdds = 0;
  for (let i = 0; i < betas.length; i++) logOdds += betas[i] * predictors[i];
  return Math.exp(logOdds) / (1 + Math.exp(logOdds));
}

function getRiskCategory(pct) {
  if (pct < 3) return { label: 'Low', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
  if (pct < 5) return { label: 'Borderline', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  if (pct < 10) return { label: 'Intermediate', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { label: 'High', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
}

const RISK_ENHANCERS = [
  { key: 'southAsian', label: 'South Asian ancestry', highlight: true },
  { key: 'familyHx', label: 'Family history of premature ASCVD (♂ <55, ♀ <65)' },
  { key: 'ldlHigh', label: 'LDL-C ≥ 160 mg/dL persistently' },
  { key: 'ckd', label: 'Chronic kidney disease (eGFR 15–59)' },
  { key: 'metSyndrome', label: 'Metabolic syndrome' },
  { key: 'earlyMenopause', label: 'Preeclampsia or premature menopause (<40)' },
  { key: 'inflammatory', label: 'Inflammatory conditions (RA, lupus, psoriasis, HIV)' },
  { key: 'lpa', label: 'Elevated Lp(a) ≥ 50 mg/dL or ≥ 125 nmol/L' },
  { key: 'hscrp', label: 'Elevated hs-CRP ≥ 2.0 mg/L' },
  { key: 'abi', label: 'Ankle-brachial index < 0.9' },
  { key: 'triglycerides', label: 'Triglycerides ≥ 175 mg/dL persistently' },
  { key: 'apoB', label: 'ApoB ≥ 130 mg/dL (2026 guideline)' },
];

function getStatinRecEnhanced(pct, enhancerCount, hasSouthAsian) {
  const hasEnhancers = enhancerCount > 0;
  if (pct < 3) {
    if (hasSouthAsian || enhancerCount >= 2) return { title: 'Lifestyle Modifications + Closer Follow-Up', detail: 'South Asian ancestry and/or multiple risk enhancers present. Consider more frequent risk reassessment (every 3 years). Emphasis on aggressive lifestyle modifications and Lp(a) screening.' };
    return { title: 'Lifestyle Modifications', detail: 'Focus on heart-healthy diet, regular exercise, smoking cessation, and weight management. Reassess cardiovascular risk in 5 years.' };
  }
  if (pct < 5) {
    if (hasSouthAsian || hasEnhancers) return { title: 'Moderate-Intensity Statin Recommended', detail: 'Risk enhancers present (including South Asian ancestry) — statin therapy is favored even in the borderline range per 2026 guidelines. Screen Lp(a) if not already done.' };
    return { title: 'Consider Statin if Risk Enhancers Present', detail: 'Clinician-patient risk discussion recommended. If risk-enhancing factors are present, moderate-intensity statin therapy may be appropriate.' };
  }
  if (pct < 10) {
    if (hasSouthAsian || enhancerCount >= 2) return { title: 'Moderate-to-High Intensity Statin Recommended', detail: 'Multiple risk enhancers and/or South Asian ancestry strengthen the case for statin therapy. Consider CAC scoring. Target LDL-C < 100 mg/dL, or < 70 mg/dL if enhancer burden is high.' };
    return { title: 'Moderate-Intensity Statin Recommended', detail: 'Initiate moderate-intensity statin therapy. Consider coronary artery calcium (CAC) scoring if decision is uncertain. If CAC = 0, may defer statin.' };
  }
  return { title: 'High-Intensity Statin Therapy', detail: 'Initiate high-intensity statin therapy. Target LDL-C < 70 mg/dL. Consider addition of ezetimibe or PCSK9 inhibitor if LDL goal not met.' };
}

const OUTCOME_TABS = [
  { key: 'totalCvd', label: 'CVD', desc: 'Total Cardiovascular Disease' },
  { key: 'ascvd', label: 'ASCVD', desc: 'Atherosclerotic CVD' },
  { key: 'hf', label: 'Heart Failure', desc: 'Heart Failure' },
];

const INITIAL = { age: '', sex: 'female', totalChol: '', hdl: '', sbp: '', onBpMeds: false, onStatin: false, diabetes: false, smoker: false, egfr: '', bmi: '' };

const Toggle = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
  >
    {label}: {checked ? 'Yes' : 'No'}
  </button>
);

export default function RiskCalculator() {
  const [form, setForm] = useState(INITIAL);
  const [enhancers, setEnhancers] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('totalCvd');
  const [showEnhancers, setShowEnhancers] = useState(false);
  // Optional predictors
  const [useUacr, setUseUacr] = useState(false);
  const [uacr, setUacr] = useState('');
  const [useHba1c, setUseHba1c] = useState(false);
  const [hba1c, setHba1c] = useState('');
  const [useZip, setUseZip] = useState(false);
  const [zip, setZip] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = (k) => (e) => set(k, e.target.value);

  const hasOptionalPredictors = (useUacr && uacr) || (useHba1c && hba1c) || (useZip && zip);

  function calculate() {
    const age = parseFloat(form.age), tc = parseFloat(form.totalChol), hdl = parseFloat(form.hdl);
    const sbp = parseFloat(form.sbp), egfr = parseFloat(form.egfr), bmi = parseFloat(form.bmi);

    if ([age, tc, hdl, sbp, egfr, bmi].some(isNaN)) { setError('Please fill in all fields.'); return; }
    if (age < 30 || age > 79) { setError('Age must be 30–79 years.'); return; }
    if (tc < 130 || tc > 320) { setError('Total cholesterol must be 130–320 mg/dL.'); return; }
    if (hdl < 20 || hdl > 100) { setError('HDL must be 20–100 mg/dL.'); return; }
    if (sbp < 90 || sbp > 200) { setError('SBP must be 90–200 mmHg.'); return; }
    if (egfr < 15 || egfr > 140) { setError('eGFR must be 15–140 mL/min/1.73m².'); return; }
    if (bmi < 18.5 || bmi > 39.9) { setError('BMI must be 18.5–39.9 kg/m².'); return; }

    setError('');
    const input = { age, totalChol: tc, hdl, sbp, egfr, bmi, onBpMeds: form.onBpMeds, onStatin: form.onStatin, diabetes: form.diabetes, smoker: form.smoker };
    const predictors = buildPredictors(input);
    const sexBetas = BETAS[form.sex];

    const ascvd = calcRisk(predictors, sexBetas.ascvd) * 100;
    const totalCvd = calcRisk(predictors, sexBetas.totalCvd) * 100;
    const hf = calcRisk(predictors, sexBetas.hf) * 100;

    setResults({ ascvd, totalCvd, hf, age });
  }

  function reset() {
    setForm(INITIAL); setEnhancers({}); setResults(null); setError('');
    setUseUacr(false); setUacr(''); setUseHba1c(false); setHba1c('');
    setUseZip(false); setZip(''); setActiveTab('totalCvd');
  }

  const enhancerCount = Object.values(enhancers).filter(Boolean).length;
  const hasSouthAsian = !!enhancers.southAsian;

  const activeResult = results ? results[activeTab] : null;
  const cat = activeResult != null ? getRiskCategory(activeResult) : null;
  const ascvdCat = results ? getRiskCategory(results.ascvd) : null;
  const rec = results ? getStatinRecEnhanced(results.ascvd, enhancerCount, hasSouthAsian) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg"><Heart className="h-6 w-6 text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PREVENT™ Calculator</h1>
          <p className="text-sm text-gray-500">AHA PREVENT™ Equations · 2023/2026 Guidelines · Race-Free Model</p>
        </div>
      </div>

      {/* Eligibility Note */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <strong>Patient Eligibility:</strong> For adults ages 30–79 without known CVD. Do <strong>NOT</strong> use for patients with known CVD, LVEF &lt;40%, CAC ≥300, end-stage kidney disease, or limited life expectancy (&lt;1 year).
        </AlertDescription>
      </Alert>

      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Age (30–79)</Label>
                <Input type="number" placeholder="e.g. 55" value={form.age} onChange={num('age')} />
              </div>
              <div>
                <Label>Sex</Label>
                <div className="flex gap-2 mt-1">
                  {['female', 'male'].map(s => (
                    <button key={s} onClick={() => set('sex', s)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${form.sex === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>BMI (18.5–39.9 kg/m²)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 28.5" value={form.bmi} onChange={num('bmi')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Labs & Vitals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Total Cholesterol (mg/dL)</Label><Input type="number" placeholder="200" value={form.totalChol} onChange={num('totalChol')} /></div>
                <div><Label>HDL (mg/dL)</Label><Input type="number" placeholder="50" value={form.hdl} onChange={num('hdl')} /></div>
              </div>
              <div><Label>Systolic BP (90–200 mmHg)</Label><Input type="number" placeholder="130" value={form.sbp} onChange={num('sbp')} /></div>
              <div><Label>eGFR (mL/min/1.73m²)</Label><Input type="number" placeholder="90" value={form.egfr} onChange={num('egfr')} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Medical History</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Toggle label="BP Meds" checked={form.onBpMeds} onChange={v => set('onBpMeds', v)} />
                <Toggle label="Statin" checked={form.onStatin} onChange={v => set('onStatin', v)} />
                <Toggle label="Diabetes" checked={form.diabetes} onChange={v => set('diabetes', v)} />
                <Toggle label="Smoker" checked={form.smoker} onChange={v => set('smoker', v)} />
              </div>
            </CardContent>
          </Card>

          {/* Optional Predictors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Optional — Further Personalization</CardTitle>
              <CardDescription>These enhance accuracy but are not required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* UACR */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">UACR (mg/g)</Label>
                  <div className="flex gap-1">
                    <button onClick={() => setUseUacr(false)} className={`px-3 py-1 text-xs rounded-l-md border ${!useUacr ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>No</button>
                    <button onClick={() => setUseUacr(true)} className={`px-3 py-1 text-xs rounded-r-md border-t border-r border-b ${useUacr ? 'bg-blue-600 text-white font-semibold' : 'bg-white'}`}>Yes</button>
                  </div>
                </div>
                {useUacr && <Input type="number" step="0.1" min="0.1" max="25000" placeholder="e.g. 30" value={uacr} onChange={e => setUacr(e.target.value)} />}
              </div>
              {/* HbA1c */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">HbA1c (%)</Label>
                  <div className="flex gap-1">
                    <button onClick={() => setUseHba1c(false)} className={`px-3 py-1 text-xs rounded-l-md border ${!useHba1c ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>No</button>
                    <button onClick={() => setUseHba1c(true)} className={`px-3 py-1 text-xs rounded-r-md border-t border-r border-b ${useHba1c ? 'bg-blue-600 text-white font-semibold' : 'bg-white'}`}>Yes</button>
                  </div>
                </div>
                {useHba1c && <Input type="number" step="0.1" min="4.5" max="15" placeholder="e.g. 6.5" value={hba1c} onChange={e => setHba1c(e.target.value)} />}
              </div>
              {/* ZIP */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">ZIP Code (for SDI)</Label>
                  <div className="flex gap-1">
                    <button onClick={() => setUseZip(false)} className={`px-3 py-1 text-xs rounded-l-md border ${!useZip ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>No</button>
                    <button onClick={() => setUseZip(true)} className={`px-3 py-1 text-xs rounded-r-md border-t border-r border-b ${useZip ? 'bg-blue-600 text-white font-semibold' : 'bg-white'}`}>Yes</button>
                  </div>
                </div>
                {useZip && <Input type="text" maxLength={5} pattern="[0-9]{5}" placeholder="e.g. 10001" value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} />}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={calculate} className="flex-1 bg-blue-600 hover:bg-blue-700"><Calculator className="h-4 w-4 mr-2" />Calculate Risk</Button>
            <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results ? (
            <>
              {/* Outcome Tabs */}
              <div className="flex rounded-lg border overflow-hidden">
                {OUTCOME_TABS.map(tab => {
                  const val = results[tab.key];
                  const tabCat = getRiskCategory(val);
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-3 px-2 text-center transition-all border-r last:border-r-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{tab.label}</div>
                      <div className={`text-lg font-bold ${isActive ? 'text-white' : tabCat.text}`}>{val.toFixed(1)}%</div>
                    </button>
                  );
                })}
              </div>

              {/* Primary Result */}
              <Card className={`${cat.border} border-2`}>
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-500 mb-1">10-Year {OUTCOME_TABS.find(t => t.key === activeTab).desc} Risk</p>
                    <p className={`text-5xl font-bold ${cat.text}`}>{activeResult.toFixed(1)}%</p>
                    <Badge className={`mt-2 ${cat.color} text-white`}>{cat.label} Risk</Badge>
                  </div>
                  {/* Gauge */}
                  <div className="mt-4">
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${cat.color} transition-all duration-700`} style={{ width: `${Math.min(activeResult / 30 * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0%</span><span>3%</span><span>5%</span><span>10%</span><span>30%+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 30-Year Note */}
              {results.age <= 59 && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  <strong>30-year risk:</strong> Available for ages 30–59. Use the{' '}
                  <a href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">official AHA calculator</a>{' '}
                  for 30-year estimates.
                </div>
              )}

              {/* Optional predictors note */}
              {hasOptionalPredictors && (
                <Alert className="border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    Optional predictors entered. For the most accurate results with UACR/HbA1c/SDI adjustments, cross-reference with the{' '}
                    <a href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">official AHA PREVENT calculator</a>.
                  </AlertDescription>
                </Alert>
              )}

              {useZip && zip && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  <strong>SDI:</strong> Requires server-side lookup. Use the{' '}
                  <a href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">official AHA calculator</a>{' '}
                  for SDI-adjusted estimates.
                </div>
              )}

              {/* PREVENT-Age */}
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-800">PREVENT-Age (Heart Age)</p>
                      <p className="text-xs text-purple-600 mt-1">Available on the official AHA calculator</p>
                    </div>
                    <a href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Statin Recommendation */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />2026 Statin Recommendation</CardTitle></CardHeader>
                <CardContent>
                  <div className={`p-3 rounded-lg ${ascvdCat.bg} ${ascvdCat.border} border`}>
                    <p className={`font-semibold ${ascvdCat.text}`}>{rec.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.detail}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Enhancers — Collapsible */}
              <Card>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowEnhancers(!showEnhancers)}>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />Risk Enhancers for ASCVD
                    {enhancerCount > 0 && <Badge variant="secondary" className="ml-2">{enhancerCount} selected</Badge>}
                    <span className="ml-auto">{showEnhancers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
                  </CardTitle>
                  <CardDescription>Check any that apply — these influence statin recommendations</CardDescription>
                </CardHeader>
                {showEnhancers && (
                  <CardContent>
                    <div className="space-y-2">
                      {RISK_ENHANCERS.map(({ key, label, highlight }) => (
                        <label key={key} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${enhancers[key] ? (highlight ? 'bg-amber-50 border border-amber-300' : 'bg-blue-50 border border-blue-200') : 'hover:bg-gray-50 border border-transparent'} ${highlight ? 'font-medium' : ''}`}>
                          <input
                            type="checkbox"
                            checked={!!enhancers[key]}
                            onChange={() => setEnhancers(e => ({ ...e, [key]: !e[key] }))}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                          {highlight && <Badge className="ml-auto bg-amber-100 text-amber-800 text-xs">Higher Risk Group</Badge>}
                        </label>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Guideline Context */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />Guideline Context</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-800">2025 AHA/ACC High Blood Pressure Guideline</p>
                    <p className="text-xs text-blue-700 mt-1">
                      For Stage 1 HTN (130–139/80–89 mmHg), use <strong>PREVENT-CVD ≥7.5%</strong> to support initiation of antihypertensive therapy.
                    </p>
                    {results.totalCvd >= 7.5 && parseFloat(form.sbp) >= 130 && parseFloat(form.sbp) <= 139 && (
                      <p className="text-xs font-bold text-red-700 mt-2">⚠ This patient's PREVENT-CVD is ≥7.5% — antihypertensive therapy is supported.</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-sm font-semibold text-orange-800">2026 ACC/AHA Dyslipidemia Guideline</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Use <strong>PREVENT-ASCVD</strong> for lipid-lowering therapy (LLT) decisions. Risk categories: Low &lt;3%, Borderline 3–&lt;5%, Intermediate 5–&lt;10%, High ≥10%. LLT recommended for intermediate and high risk.
                    </p>
                    <p className="text-xs mt-1 text-orange-700">
                      This patient's PREVENT-ASCVD: <strong>{results.ascvd.toFixed(1)}% ({ascvdCat.label})</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-gray-400 py-12">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Enter patient data and click Calculate</p>
                  <p className="text-sm mt-1">Results will appear here</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Changes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />Key Changes from 2019 PCE</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span><strong>Race-free model</strong> — eliminates race as a variable</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span><strong>Adds eGFR + BMI</strong> — kidney function and obesity now included</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span><strong>Statin & BP med adjustment</strong> — accounts for current treatment</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span><strong>New thresholds</strong> — Low &lt;3%, Borderline 3–5%, Intermediate 5–10%, High ≥10%</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span><strong>Three outcomes</strong> — ASCVD, Total CVD, and Heart Failure risk</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span><strong>Optional: UACR, HbA1c, SDI</strong> — for further personalization</li>
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This calculator is for clinical decision support only. It does not replace clinical judgment. Validate results with the{' '}
              <a href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">official AHA PREVENT calculator</a>.
              Not for patients with prior ASCVD events.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
