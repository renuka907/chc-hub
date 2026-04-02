import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Apple, Beef, Calculator, Printer, RotateCcw, Utensils } from 'lucide-react';

const FOODS = {
  breakfast: [
    { name: 'Eggs', servingOz: 3.5, servingNote: '2 large', protein: 12 },
    { name: 'Greek yogurt', servingOz: 6, protein: 15 },
    { name: 'Cottage cheese', servingOz: 4, protein: 14 },
    { name: 'Protein shake', servingOz: 12, servingNote: '1 shake', protein: 25 },
    { name: 'Turkey sausage', servingOz: 3, servingNote: '2 links', protein: 10 },
  ],
  lunch: [
    { name: 'Chicken breast', servingOz: 4, protein: 35 },
    { name: 'Turkey deli meat', servingOz: 3, protein: 18 },
    { name: 'Tuna', servingOz: 3, protein: 22 },
    { name: 'Salmon', servingOz: 4, protein: 25 },
    { name: 'Ground beef', servingOz: 4, protein: 22 },
  ],
  dinner: [
    { name: 'Steak', servingOz: 6, protein: 42 },
    { name: 'Chicken thigh', servingOz: 5, protein: 30 },
    { name: 'Pork chop', servingOz: 5, protein: 36 },
    { name: 'Shrimp', servingOz: 4, protein: 24 },
    { name: 'Cod', servingOz: 4, protein: 20 },
  ],
  snacks: [
    { name: 'String cheese', servingOz: 1, servingNote: '1 pc', protein: 7 },
    { name: 'Almonds', servingOz: 1, protein: 6 },
    { name: 'Beef jerky', servingOz: 1, protein: 10 },
    { name: 'Protein bar', servingOz: 2, servingNote: '1 bar', protein: 20 },
    { name: 'Edamame', servingOz: 2.5, servingNote: '1/2 cup', protein: 9 },
    { name: 'Hard boiled egg', servingOz: 2, servingNote: '1 egg', protein: 6 },
  ],
};

const MEAL_SPLITS = [
  { key: 'Breakfast', ratio: 0.25, foods: FOODS.breakfast, icon: Apple },
  { key: 'Lunch', ratio: 0.3, foods: FOODS.lunch, icon: Utensils },
  { key: 'Dinner', ratio: 0.3, foods: FOODS.dinner, icon: Beef },
  { key: 'Snacks', ratio: 0.15, foods: FOODS.snacks, icon: Apple },
];

const formatNumber = (value, decimals = 1) => Number.isFinite(value) ? value.toFixed(decimals) : '0.0';

const buildMealPlan = (target) => {
  const sections = MEAL_SPLITS.map((meal) => {
    const mealTarget = target * meal.ratio;
    const items = [];
    let mealTotal = 0;

    for (let i = 0; i < meal.foods.length; i += 1) {
      const item = meal.foods[i];
      const remaining = mealTarget - mealTotal;
      if (remaining <= 0.01) break;

      const isLastItem = i === meal.foods.length - 1;
      let factor = remaining / item.protein;

      if (!isLastItem) {
        factor = Math.min(1, factor);
      }

      const adjustedProtein = item.protein * factor;
      const adjustedOz = item.servingOz * factor;

      items.push({
        name: item.name,
        servingOz: adjustedOz,
        servingNote: item.servingNote || '',
        protein: adjustedProtein,
      });

      mealTotal += adjustedProtein;

      if (factor < 1) break;
    }

    return {
      name: meal.key,
      ratio: meal.ratio,
      icon: meal.icon,
      target: mealTarget,
      items,
    };
  });

  let runningTotal = 0;
  const sectionsWithRunning = sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      runningTotal += item.protein;
      return {
        ...item,
        runningTotal,
      };
    }),
  }));

  return sectionsWithRunning;
};

export default function ProteinCalculator() {
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const resultsRef = useRef(null);

  const handleCalculate = () => {
    const parsed = parseFloat(weight);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Please enter a valid weight in lbs.');
      setResult(null);
      return;
    }

    const min = parsed * 0.8;
    const max = parsed * 1.0;
    const midpoint = parsed * 0.9;

    setResult({
      weight: parsed,
      min,
      max,
      midpoint,
      plan: buildMealPlan(midpoint),
    });
    setError('');
  };

  const handleReset = () => {
    setWeight('');
    setError('');
    setResult(null);
  };

  const handlePrint = () => {
    if (!result) return;
    const planHtml = result.plan.map(section => {
      const rows = section.items.map(item =>
        `<tr><td>${item.name}</td><td>${formatNumber(item.servingOz)} oz${item.servingNote ? ` (${item.servingNote})` : ''}</td><td>${formatNumber(item.protein)}g</td><td><strong>${formatNumber(item.runningTotal)}g</strong></td></tr>`
      ).join('');
      return `<h3 style="margin:10px 0 4px;font-size:13px;font-weight:700;color:#334155;border-bottom:1px solid #cbd5e1;padding-bottom:2px;">${section.name} <span style="font-weight:400;color:#64748b;font-size:11px;">(target: ${formatNumber(section.target)}g)</span></h3>
        <table><thead><tr><th>Food</th><th>Serving</th><th>Protein</th><th>Running Total</th></tr></thead><tbody>${rows}</tbody></table>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Protein Meal Plan</title>
      <style>
        @page { size: letter; margin: 0.5in; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; font-size: 13px; }
        .header { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #3a6b8c; padding-bottom: 6px; margin-bottom: 8px; }
        .header h1 { font-size: 18px; color: #3a6b8c; }
        .header .date { font-size: 11px; color: #64748b; }
        .summary-row { display: flex; gap: 16px; margin-bottom: 10px; padding: 8px 12px; background: #f0f7ff; border-radius: 6px; border: 1px solid #dbeafe; }
        .summary-item { flex: 1; }
        .summary-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
        .summary-item .value { font-size: 16px; font-weight: 700; color: #1e293b; }
        .summary-item .sub { font-size: 10px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        th, td { text-align: left; padding: 3px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; color: #64748b; }
      </style></head><body>
      <div class="header">
        <h1>Protein Intake Meal Plan</h1>
        <span class="date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <div class="summary-row">
        <div class="summary-item">
          <div class="label">Patient Weight</div>
          <div class="value">${formatNumber(result.weight, 0)} lbs</div>
        </div>
        <div class="summary-item">
          <div class="label">Daily Range (0.8–1.0 g/lb)</div>
          <div class="value">${formatNumber(result.min)}g – ${formatNumber(result.max)}g</div>
        </div>
        <div class="summary-item">
          <div class="label">Meal Plan Target (0.9 g/lb)</div>
          <div class="value">${formatNumber(result.midpoint)}g</div>
        </div>
      </div>
      ${planHtml}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const summaryBadges = useMemo(() => {
    if (!result) return null;
    return (
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-blue-50 text-blue-700 border border-blue-100">
          {formatNumber(result.min)}g - {formatNumber(result.max)}g per day
        </Badge>
        <Badge className="bg-pink-50 text-pink-700 border border-pink-100">
          Midpoint target: {formatNumber(result.midpoint)}g
        </Badge>
      </div>
    );
  }, [result]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <Calculator className="h-6 w-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Protein Intake Calculator</h1>
          <p className="text-sm text-slate-500">Calculate daily protein needs and build a full-day meal plan.</p>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Patient Weight</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label className="text-slate-700">Weight (lbs)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="mt-1"
              placeholder="e.g. 150"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCalculate();
              }}
            />
            {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCalculate} className="bg-blue-600 hover:bg-blue-700">
              <Calculator className="mr-2 h-4 w-4" /> Calculate
            </Button>
            <Button variant="outline" onClick={handleReset} className="border-slate-300 text-slate-700">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            {result && (
              <Button variant="outline" onClick={handlePrint} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6" ref={resultsRef}>
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-base text-slate-900">Daily Protein Target</CardTitle>
                {summaryBadges}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-600 mb-1">Range (0.8 - 1.0 g/lb)</p>
                <p className="text-2xl font-bold text-blue-800">{formatNumber(result.min)}g - {formatNumber(result.max)}g</p>
                <p className="text-xs text-blue-600 mt-1">Based on {formatNumber(result.weight, 1)} lbs</p>
              </div>
              <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
                <p className="text-xs font-semibold text-pink-600 mb-1">Midpoint Target</p>
                <p className="text-2xl font-bold text-pink-700">{formatNumber(result.midpoint)}g</p>
                <p className="text-xs text-pink-600 mt-1">0.9 g/lb</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 mb-1">Plan Goal</p>
                <p className="text-2xl font-bold text-slate-700">{formatNumber(result.midpoint)}g</p>
                <p className="text-xs text-slate-500 mt-1">Meal plan matches midpoint</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-100">
                  <Utensils className="h-5 w-5 text-pink-700" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900">Full-Day Sample Meal Plan</CardTitle>
                  <p className="text-sm text-slate-500">Serving sizes shown in ounces with notes in parentheses when applicable.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.plan.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.name}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">{section.name}</h3>
                      </div>
                      <Badge className="bg-slate-50 text-slate-600 border border-slate-200">
                        Target: {formatNumber(section.target)}g
                      </Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Food</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Serving Size</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Protein (g)</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">Running Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {section.items.map((item, idx) => (
                            <tr key={`${section.name}-${item.name}-${idx}`} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-700 font-medium">{item.name}</td>
                              <td className="py-2 px-3 text-slate-600">
                                {formatNumber(item.servingOz)} oz{item.servingNote ? ` (${item.servingNote})` : ''}
                              </td>
                              <td className="py-2 px-3 text-slate-700">{formatNumber(item.protein)} g</td>
                              <td className="py-2 px-3 text-slate-700 font-semibold">{formatNumber(item.runningTotal)} g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
