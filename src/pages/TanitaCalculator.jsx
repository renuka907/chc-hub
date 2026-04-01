import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, RotateCcw, LineChart, Printer } from 'lucide-react';

const PATIENT_FIELDS = [
  { key: 'heightFt', label: 'Height (ft)', type: 'number', step: '1', placeholder: 'e.g. 5' },
  { key: 'heightIn', label: 'Height (in)', type: 'number', step: '1', placeholder: 'e.g. 5' },
  { key: 'age', label: 'Age', type: 'number', step: '1', placeholder: 'e.g. 45' },
];

const INPUT_FIELDS = [
  { key: 'date', label: 'Date of Reading', type: 'date', full: true },
  { key: 'weight', label: 'Weight (lbs)', type: 'number', step: '0.1' },
  { key: 'bmi', label: 'BMI', type: 'number', step: '0.1' },
  { key: 'bodyFatPct', label: 'Fat %', type: 'number', step: '0.1' },
  { key: 'fatMass', label: 'Fat Mass (lbs)', type: 'number', step: '0.1' },
  { key: 'fatFreeMass', label: 'FFM (lbs)', type: 'number', step: '0.1' },
  { key: 'totalBodyWater', label: 'TBW (lbs)', type: 'number', step: '0.1' },
  { key: 'bmr', label: 'BMR (kcal)', type: 'number', step: '1' },
];

const METRICS = [
  {
    key: 'weight', label: 'Weight', unit: 'lbs', precision: 1, direction: 'down',
    explain: (v, change, status) => {
      if (!change) return 'No change in weight.';
      const lbs = Math.abs(change).toFixed(1);
      if (status === 'good') return `Lost ${lbs} lbs — great progress toward a healthier weight!`;
      return `Gained ${lbs} lbs — check if this is lean mass gain or fat gain.`;
    }
  },
  {
    key: 'bmi', label: 'BMI', unit: '', precision: 1, direction: 'down',
    explain: (v, change, status, v2) => {
      if (!change) return 'No change in BMI.';
      const val = Math.abs(change).toFixed(1);
      let range = '';
      if (v2 < 18.5) range = ' (underweight range)';
      else if (v2 < 25) range = ' (normal range — great!)';
      else if (v2 < 30) range = ' (overweight range)';
      else range = ' (obese range)';
      if (status === 'good') return `BMI decreased by ${val}${range} — moving in the right direction!`;
      return `BMI increased by ${val}${range}.`;
    }
  },
  {
    key: 'bodyFatPct', label: 'Fat %', unit: '%', precision: 1, direction: 'down',
    explain: (v, change, status) => {
      if (!change) return 'No change in body fat percentage.';
      const val = Math.abs(change).toFixed(1);
      if (status === 'good') return `Body fat dropped ${val}% — you're getting leaner!`;
      return `Body fat increased ${val}% — may want to review diet and exercise.`;
    }
  },
  {
    key: 'fatMass', label: 'Fat Mass', unit: 'lbs', precision: 1, direction: 'down',
    explain: (v, change, status) => {
      if (!change) return 'No change in fat mass.';
      const lbs = Math.abs(change).toFixed(1);
      if (status === 'good') return `Lost ${lbs} lbs of pure fat — this is the best kind of weight loss!`;
      return `Gained ${lbs} lbs of fat — this is the type of weight to focus on reducing.`;
    }
  },
  {
    key: 'fatFreeMass', label: 'FFM', unit: 'lbs', precision: 1, direction: 'up',
    explain: (v, change, status) => {
      if (!change) return 'No change in fat-free mass.';
      const lbs = Math.abs(change).toFixed(1);
      if (status === 'good') return `Gained ${lbs} lbs of lean mass (muscle, bone, water) — excellent!`;
      return `Lost ${lbs} lbs of lean mass — may need more protein or strength training.`;
    }
  },
  {
    key: 'totalBodyWater', label: 'TBW', unit: 'lbs', precision: 1, direction: 'neutral',
    explain: () => 'Total body water — fluctuates normally day to day.'
  },
  {
    key: 'bmr', label: 'BMR', unit: 'kcal', precision: 0, direction: 'up',
    explain: (v, change, status) => {
      if (!change) return 'No change in metabolism.';
      const val = Math.abs(change).toFixed(0);
      if (status === 'good') return `Metabolism increased by ${val} kcal/day — burning more calories at rest!`;
      return `Metabolism decreased by ${val} kcal/day — may indicate muscle loss.`;
    }
  },
];

const INITIAL_READING = INPUT_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});
const INITIAL_PATIENT = PATIENT_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});

function parseNumber(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

function formatNumber(value, precision) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(precision);
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateDisplay(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TanitaCalculator() {
  const [patient, setPatient] = useState(INITIAL_PATIENT);
  const [reading1, setReading1] = useState(INITIAL_READING);
  const [reading2, setReading2] = useState(INITIAL_READING);
  const [comparison, setComparison] = useState(null);
  const resultsRef = useRef(null);

  const updatePatient = (key) => (event) => {
    setPatient(prev => ({ ...prev, [key]: event.target.value }));
  };

  const getHeightInches = () => {
    const ft = parseNumber(patient.heightFt) || 0;
    const inches = parseNumber(patient.heightIn) || 0;
    return ft * 12 + inches;
  };

  const updateReading = (setter, key) => (event) => {
    setter(prev => ({ ...prev, [key]: event.target.value }));
  };

  function buildComparison() {
    const date1 = parseDate(reading1.date);
    const date2 = parseDate(reading2.date);
    const daysBetween = date1 && date2 ? Math.round(Math.abs((date2 - date1) / (1000 * 60 * 60 * 24))) : null;
    const age = parseNumber(patient.age);
    const height = getHeightInches();

    const metrics = METRICS.map(metric => {
      const v1 = parseNumber(reading1[metric.key]);
      const v2 = parseNumber(reading2[metric.key]);
      const hasValues = Number.isFinite(v1) && Number.isFinite(v2);
      const change = hasValues ? v2 - v1 : null;
      const pctChange = hasValues && v1 !== 0 ? (change / v1) * 100 : null;

      let status = 'neutral';
      if (hasValues && change !== 0) {
        if (metric.direction === 'up') status = change > 0 ? 'good' : 'bad';
        if (metric.direction === 'down') status = change < 0 ? 'good' : 'bad';
      }

      const explanation = metric.explain(v1, change, status, v2, age);

      return { ...metric, v1, v2, change, pctChange, status, explanation };
    });

    setComparison({ daysBetween, metrics, age, height });
  }

  function clearAll() {
    setPatient(INITIAL_PATIENT);
    setReading1(INITIAL_READING);
    setReading2(INITIAL_READING);
    setComparison(null);
  }

  function handlePrint() {
    if (!resultsRef.current) return;
    const printContent = resultsRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Tanita Body Composition Results</title>
      <style>
        @page { size: letter; margin: 0.4in 0.5in; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; color: #1e293b; font-size: 15px; }
        .print-header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #0d9488; padding-bottom: 8px; }
        .print-header h1 { font-size: 22px; color: #0d9488; margin-bottom: 2px; }
        .print-header p { color: #64748b; font-size: 13px; }
        .patient-info { display: flex; gap: 20px; margin-bottom: 10px; padding: 8px 10px; background: #f0fdfa; border-radius: 6px; font-size: 14px; }
        .patient-info span { font-weight: 600; }
        .summary-badges { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .badge-teal { background: #ccfbf1; color: #0f766e; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
        td { padding: 8px 8px; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
        tr:hover { background: #fafafa; }
        .good { color: #059669; font-weight: 600; }
        .bad { color: #dc2626; font-weight: 600; }
        .neutral { color: #64748b; }
        .explanation { font-size: 13px; color: #475569; margin-top: 2px; font-style: italic; }
        .arrow-up::before { content: "↑ "; }
        .arrow-down::before { content: "↓ "; }
        .footer { margin-top: 10px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="print-header">
        <h1>Tanita Body Composition Analysis</h1>
        <p>CHC Hub &bull; Printed ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
      ${printContent}
      <div class="footer">This report is for clinical reference only. &copy; CHC Hub ${new Date().getFullYear()}</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-100">
          <Scale className="h-6 w-6 text-teal-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tanita Body Composition Comparison</h1>
          <p className="text-sm text-slate-500">Compare two Tanita readings to track changes over time.</p>
        </div>
      </div>

      {/* Patient Info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PATIENT_FIELDS.map(field => (
            <div key={field.key}>
              <Label className="text-slate-700">{field.label}</Label>
              <Input
                type={field.type}
                step={field.step}
                value={patient[field.key]}
                onChange={updatePatient(field.key)}
                className="mt-1"
                placeholder={field.placeholder || ''}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Readings Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-teal-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">Reading 1 (Baseline)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {INPUT_FIELDS.map(field => (
              <div key={`r1-${field.key}`} className={field.full ? 'sm:col-span-2' : ''}>
                <Label className="text-slate-700">{field.label}</Label>
                <Input
                  type={field.type}
                  step={field.step}
                  value={reading1[field.key]}
                  onChange={updateReading(setReading1, field.key)}
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">Reading 2 (Follow-up)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {INPUT_FIELDS.map(field => (
              <div key={`r2-${field.key}`} className={field.full ? 'sm:col-span-2' : ''}>
                <Label className="text-slate-700">{field.label}</Label>
                <Input
                  type={field.type}
                  step={field.step}
                  value={reading2[field.key]}
                  onChange={updateReading(setReading2, field.key)}
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={buildComparison} className="bg-teal-600 hover:bg-teal-700">
          <LineChart className="mr-2 h-4 w-4" /> Compare Readings
        </Button>
        <Button variant="outline" onClick={clearAll} className="border-slate-300 text-slate-700">
          <RotateCcw className="mr-2 h-4 w-4" /> Clear All
        </Button>
        {comparison && (
          <Button variant="outline" onClick={handlePrint} className="border-teal-300 text-teal-700 hover:bg-teal-50">
            <Printer className="mr-2 h-4 w-4" /> Print Results
          </Button>
        )}
      </div>

      {/* Results */}
      {comparison && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-base text-slate-900">Results</CardTitle>
              <Badge className="bg-teal-50 text-teal-700 border border-teal-100">
                {comparison.daysBetween != null ? `${comparison.daysBetween} days between readings` : 'Dates not provided'}
              </Badge>
              {comparison.daysBetween != null && comparison.daysBetween >= 7 && (
                <Badge className="bg-blue-50 text-blue-700 border border-blue-100">
                  ~{(comparison.daysBetween / 7).toFixed(1)} weeks
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Printable content */}
            <div ref={resultsRef}>
              {/* Patient info for print */}
              <div className="hidden print:block patient-info" style={{ display: 'none' }}>
                {/* This is rendered in the print popup via innerHTML */}
              </div>
              <div style={{ display: 'none' }} className="print-patient-data">
                <div className="patient-info">
                  {(patient.heightFt || patient.heightIn) && <span>Height: {patient.heightFt || 0}'{patient.heightIn || 0}" ({getHeightInches()} in)</span>}
                  {patient.age && <span>Age: {patient.age}</span>}
                  <span>Baseline: {formatDateDisplay(reading1.date)}</span>
                  <span>Follow-up: {formatDateDisplay(reading2.date)}</span>
                  {comparison.daysBetween != null && <span>Days Between: {comparison.daysBetween}</span>}
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {(() => {
                  const good = comparison.metrics.filter(m => m.status === 'good').length;
                  const bad = comparison.metrics.filter(m => m.status === 'bad').length;
                  const neutral = comparison.metrics.filter(m => m.status === 'neutral').length;
                  return (
                    <>
                      <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                        <div className="text-2xl font-bold text-emerald-700">{good}</div>
                        <div className="text-xs text-emerald-600 font-medium">Improved</div>
                      </div>
                      <div className="bg-rose-50 rounded-lg p-3 text-center border border-rose-100">
                        <div className="text-2xl font-bold text-rose-600">{bad}</div>
                        <div className="text-xs text-rose-500 font-medium">Needs Attention</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                        <div className="text-2xl font-bold text-slate-600">{neutral}</div>
                        <div className="text-xs text-slate-500 font-medium">No Change</div>
                      </div>
                      <div className="bg-teal-50 rounded-lg p-3 text-center border border-teal-100">
                        <div className="text-2xl font-bold text-teal-700">{comparison.daysBetween ?? '—'}</div>
                        <div className="text-xs text-teal-600 font-medium">Days Between</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Results table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Metric</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Baseline</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Follow-up</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Change</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 hidden sm:table-cell">What This Means</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparison.metrics.map(metric => {
                      const changeVal = Number.isFinite(metric.change) ? metric.change : null;
                      const changeText = changeVal != null ? `${changeVal > 0 ? '+' : ''}${formatNumber(changeVal, metric.precision)} ${metric.unit}` : '—';
                      const pctText = Number.isFinite(metric.pctChange) ? ` (${metric.pctChange > 0 ? '+' : ''}${formatNumber(metric.pctChange, 1)}%)` : '';

                      let colorClass = 'text-slate-600';
                      let bgClass = '';
                      let arrow = '';
                      if (metric.status === 'good') { colorClass = 'text-emerald-700'; bgClass = 'bg-emerald-50/50'; arrow = changeVal > 0 ? '↑' : '↓'; }
                      if (metric.status === 'bad') { colorClass = 'text-rose-600'; bgClass = 'bg-rose-50/50'; arrow = changeVal > 0 ? '↑' : '↓'; }

                      return (
                        <tr key={metric.key} className={`${bgClass} hover:bg-slate-50`}>
                          <td className="py-3 px-3 font-medium text-slate-800">{metric.label}</td>
                          <td className="py-3 px-3 text-slate-700">{formatNumber(metric.v1, metric.precision)} {metric.unit}</td>
                          <td className="py-3 px-3 text-slate-700">{formatNumber(metric.v2, metric.precision)} {metric.unit}</td>
                          <td className={`py-3 px-3 font-semibold ${colorClass}`}>
                            {arrow && <span className="mr-1">{arrow}</span>}
                            {changeText}
                            <span className="text-xs font-normal ml-1">{pctText}</span>
                          </td>
                          <td className={`py-3 px-3 text-xs text-slate-600 hidden sm:table-cell max-w-xs`}>
                            {metric.explanation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile explanations (shown below table on small screens) */}
              <div className="sm:hidden mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">What Your Results Mean</h3>
                {comparison.metrics.map(metric => {
                  let icon = '➖';
                  let textColor = 'text-slate-600';
                  if (metric.status === 'good') { icon = '✅'; textColor = 'text-emerald-700'; }
                  if (metric.status === 'bad') { icon = '⚠️'; textColor = 'text-rose-600'; }
                  return (
                    <div key={metric.key} className="flex gap-2 text-xs">
                      <span>{icon}</span>
                      <div>
                        <span className={`font-semibold ${textColor}`}>{metric.label}: </span>
                        <span className="text-slate-600">{metric.explanation}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
