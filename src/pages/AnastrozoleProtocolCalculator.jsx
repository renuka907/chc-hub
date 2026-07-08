import React, { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { CalendarDays, Calculator, Pill, Printer, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const OFFICE_PHONE = "239-561-9191";

function safeDateFromInput(value) {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildSchedule(startDate, tabletCount) {
  if (!startDate || tabletCount <= 0) return [];

  const loadingOffsets = [0, 3, 7];
  return Array.from({ length: tabletCount }, (_, index) => {
    const isLoading = index < loadingOffsets.length;
    const offset = isLoading ? loadingOffsets[index] : 14 + ((index - 3) * 7);
    return {
      tablet: index + 1,
      phase: isLoading ? "Loading dose" : "Weekly dose",
      label: isLoading ? `${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} Tablet` : `Tablet ${index + 1}`,
      date: addDays(startDate, offset),
      dayNumber: offset + 1,
    };
  });
}

function writePrintDocument({ patientName, startDate, tabletCount, schedule }) {
  const todayText = format(new Date(), "MM/dd/yyyy");
  const startText = startDate ? format(startDate, "EEEE, MMMM d, yyyy") : "";
  const weeklyDay = schedule[2]?.date ? format(schedule[2].date, "EEEE") : "";
  const rows = schedule.map((item) => `
    <tr>
      <td>${item.tablet}</td>
      <td>${escapeHtml(item.phase)}</td>
      <td>${item.dayNumber}</td>
      <td>${format(item.date, "EEEE, MMMM d, yyyy")}</td>
    </tr>
  `).join("");

  const loadingDates = [0, 1, 2].map((index) => schedule[index]?.date ? format(schedule[index].date, "MM/dd/yyyy") : "");

  const win = window.open("", "", "width=850,height=1100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes");
  if (!win) return;

  win.document.write(`<!doctype html>
    <html>
      <head>
        <title>Anastrozole Protocol - ${escapeHtml(patientName || "Patient")}</title>
        <style>
          @page { size: Letter; margin: 0.45in; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; line-height: 1.35; }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px; }
          .brand { font-size: 18pt; font-weight: 800; color: #1e3a8a; }
          .subtitle { font-size: 10pt; color: #4b5563; margin-top: 3px; }
          h1 { font-size: 24pt; margin: 0 0 6px; color: #111827; }
          h2 { font-size: 14pt; margin: 18px 0 8px; color: #1e3a8a; border-bottom: 1px solid #bfdbfe; padding-bottom: 4px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 14px 0; }
          .field { border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 10px; min-height: 42px; }
          .label { font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
          .value { font-size: 12pt; font-weight: 700; margin-top: 2px; }
          .box { border: 1px solid #dbeafe; background: #eff6ff; border-radius: 10px; padding: 12px; margin: 10px 0; }
          .loading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .dose-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #fff; }
          .dose-title { font-weight: 800; font-size: 11pt; color: #111827; }
          .dose-note { font-size: 9pt; color: #4b5563; margin: 2px 0 8px; }
          .date-line { border-bottom: 1px solid #111827; min-height: 20px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
          th { background: #1e3a8a; color: #fff; text-align: left; padding: 7px; }
          td { border: 1px solid #d1d5db; padding: 7px; vertical-align: top; }
          ul { margin: 8px 0 0 18px; padding: 0; }
          li { margin-bottom: 5px; }
          .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #cbd5e1; color: #4b5563; font-size: 10pt; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Contemporary Health Center</div>
          <div class="subtitle">Please follow this schedule exactly</div>
        </div>

        <h1>How to Take Your Anastrozole</h1>

        <div class="meta">
          <div class="field">
            <div class="label">Patient Name</div>
            <div class="value">${escapeHtml(patientName)}</div>
          </div>
          <div class="field">
            <div class="label">Date</div>
            <div class="value">${todayText}</div>
          </div>
          <div class="field">
            <div class="label">Start Date</div>
            <div class="value">${startText}</div>
          </div>
          <div class="field">
            <div class="label">Total Tablets In Bottle</div>
            <div class="value">${tabletCount}</div>
          </div>
        </div>

        <h2>1. Your First Week (Loading Doses)</h2>
        <p>During your very first week only, take 1 tablet on 3 separate days, like this:</p>
        <div class="loading">
          <div class="dose-card">
            <div class="dose-title">1st Tablet</div>
            <div class="dose-note">Day 1 (today / start day)</div>
            <div class="label">Write the date:</div>
            <div class="date-line">${loadingDates[0]}</div>
          </div>
          <div class="dose-card">
            <div class="dose-title">2nd Tablet</div>
            <div class="dose-note">Day 4 (3 days later)</div>
            <div class="label">Write the date:</div>
            <div class="date-line">${loadingDates[1]}</div>
          </div>
          <div class="dose-card">
            <div class="dose-title">3rd Tablet</div>
            <div class="dose-note">Day 8 (4 days later)</div>
            <div class="label">Write the date:</div>
            <div class="date-line">${loadingDates[2]}</div>
          </div>
        </div>

        <h2>2. After Your First Week</h2>
        <div class="box">
          Starting the following week, take 1 tablet, once a week, on the same day each week.<br>
          <strong>Take it every:</strong> ${weeklyDay || "________________"}<br>
          <strong>Total tablets in your bottle:</strong> ${tabletCount}
        </div>

        <table>
          <thead>
            <tr><th>Tablet</th><th>Schedule</th><th>Day</th><th>Date</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <h2>3. Simple Reminders</h2>
        <ul>
          <li>Swallow the tablet whole with water. You may take it with or without food.</li>
          <li>Try to take it at about the same time of day to help you remember.</li>
          <li>Keep taking it on schedule until your bottle is empty, unless we tell you otherwise.</li>
          <li>If you miss a dose, take it as soon as you remember that day, then return to your normal schedule.</li>
        </ul>

        <div class="footer">
          Questions about your medication? Call or text the office - we are happy to help. ${OFFICE_PHONE}
        </div>
      </body>
    </html>`);
  win.document.close();
  setTimeout(() => win.print(), 250);
}

export default function AnastrozoleProtocolCalculator() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [patientName, setPatientName] = useState("");
  const [startDateValue, setStartDateValue] = useState(today);
  const [tabletCountValue, setTabletCountValue] = useState("12");

  const startDate = safeDateFromInput(startDateValue);
  const tabletCount = Math.max(0, Math.floor(Number(tabletCountValue) || 0));
  const schedule = useMemo(() => buildSchedule(startDate, tabletCount), [startDate, tabletCount]);
  const hasValidSchedule = Boolean(startDate && tabletCount > 0);
  const weeklyDay = schedule[2]?.date ? format(schedule[2].date, "EEEE") : "";

  const reset = () => {
    setPatientName("");
    setStartDateValue(today);
    setTabletCountValue("12");
  };

  const print = () => {
    if (!hasValidSchedule) return;
    writePrintDocument({ patientName, startDate, tabletCount, schedule });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-cyan-600 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Pill className="w-7 h-7" />
              Anastrozole Protocol Calculator
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Generate the patient instruction form with loading and weekly dose dates.
            </p>
          </div>
          <Button onClick={print} disabled={!hasValidSchedule} className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Printer className="w-4 h-4 mr-2" />
            Print Form
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="w-5 h-5 text-blue-700" />
              Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date / Day 1</Label>
              <Input
                id="startDate"
                type="date"
                value={startDateValue}
                onChange={(event) => setStartDateValue(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tabletCount">Total Tablets In Bottle</Label>
              <Input
                id="tabletCount"
                type="number"
                min="1"
                step="1"
                value={tabletCountValue}
                onChange={(event) => setTabletCountValue(event.target.value)}
                placeholder="e.g., 12"
              />
              <p className="text-xs text-gray-500">The schedule stops when this tablet count is used up.</p>
            </div>

            {tabletCount > 0 && tabletCount < 3 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800 text-sm">
                  The standard loading week uses 3 tablets. This count will print only the available tablets.
                </AlertDescription>
              </Alert>
            )}

            {hasValidSchedule && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
                <div className="font-semibold">Take it every: {weeklyDay}</div>
                <div className="mt-1 text-blue-800">
                  First week: {schedule.slice(0, 3).map((item) => format(item.date, "M/d")).join(", ")}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={print} disabled={!hasValidSchedule} className="flex-1 bg-blue-700 hover:bg-blue-800">
                <Printer className="w-4 h-4 mr-2" />
                Print Form
              </Button>
              <Button onClick={reset} variant="outline" aria-label="Reset form">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="w-5 h-5 text-blue-700" />
              Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasValidSchedule ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                Enter a start date and tablet count to generate the protocol.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="grid grid-cols-4 bg-blue-900 text-white text-xs font-semibold uppercase tracking-wide">
                  <div className="p-3">Tablet</div>
                  <div className="p-3">Schedule</div>
                  <div className="p-3">Day</div>
                  <div className="p-3">Date</div>
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                  {schedule.map((item) => (
                    <div key={item.tablet} className="grid grid-cols-4 text-sm">
                      <div className="p-3 font-semibold text-gray-900">{item.tablet}</div>
                      <div className="p-3 text-gray-700">{item.phase}</div>
                      <div className="p-3 text-gray-700">Day {item.dayNumber}</div>
                      <div className="p-3 font-medium text-gray-900">{format(item.date, "EEE, MMM d, yyyy")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
