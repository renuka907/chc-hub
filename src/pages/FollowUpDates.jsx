import React, { useState } from "react";
import { format, addWeeks, addMonths, addDays, differenceInDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Calculator, Printer } from "lucide-react";

export default function FollowUpDates() {
  const [today, setToday] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");

  React.useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(() => setToday(new Date()), nextMidnight.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, [today]);

  const weekItems = [
    { label: "2 weeks", date: addWeeks(today, 2) },
    { label: "4 weeks", date: addWeeks(today, 4) },
    { label: "6 weeks", date: addWeeks(today, 6) },
    { label: "10 weeks", date: addWeeks(today, 10) },
    { label: "11 weeks", date: addWeeks(today, 11) },
    { label: "12 weeks", date: addWeeks(today, 12) },
    { label: "14 weeks", date: addWeeks(today, 14) },
    { label: "16 weeks", date: addWeeks(today, 16) },
    { label: "22 weeks", date: addWeeks(today, 22) },
  ];

  const monthItems = [
    { label: "1 month", date: addMonths(today, 1) },
    { label: "2 months", date: addMonths(today, 2) },
    { label: "2½ months", date: addDays(addMonths(today, 2), 15) },
    { label: "3 months", date: addMonths(today, 3) },
    { label: "3½ months", date: addDays(addMonths(today, 3), 15) },
    { label: "5 months", date: addMonths(today, 5) },
    { label: "5½ months", date: addDays(addMonths(today, 5), 15) },
    { label: "6 months", date: addMonths(today, 6) },
  ];

  const timeSince = (() => {
    if (!selectedDate) return null;
    const total = differenceInDays(today, new Date(selectedDate));
    if (total < 0) return { weeks: 0, days: 0, total, negative: true };
    return { weeks: Math.floor(total / 7), days: total % 7, total, negative: false };
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6" /> Follow‑up Dates
            </h1>
            <p className="text-violet-200 text-sm mt-1">
              Today: {format(today, "EEEE, MMM d, yyyy")}
            </p>
          </div>
          <Button onClick={() => {
            const rows = (label, items) => items.map(i => 
              `<tr><td style="padding:6px 12px;font-weight:600;color:#7c3aed;width:100px;">${i.label}</td><td style="padding:6px 12px;">${format(i.date, "EEE, MMM d, yyyy")}</td></tr>`
            ).join('');
            const w = window.open('', '', 'width=600,height=700');
            w.document.write(`<html><head><style>body{font-family:Arial,sans-serif;margin:30px;}table{border-collapse:collapse;width:100%;margin-bottom:20px;}tr{border-bottom:1px solid #eee;}h1{font-size:20px;margin:0 0 4px;}h2{font-size:14px;color:#7c3aed;margin:16px 0 6px;border-bottom:2px solid #7c3aed;padding-bottom:4px;}p{font-size:11px;color:#888;margin:0 0 16px;}</style></head><body>
              <h1>Follow‑up Dates</h1>
              <p>From: ${format(today, "EEEE, MMM d, yyyy")}</p>
              <h2>By Weeks</h2><table>${rows('Weeks', weekItems)}</table>
              <h2>By Months</h2><table>${rows('Months', monthItems)}</table>
              <p style="margin-top:20px;border-top:1px solid #ccc;padding-top:8px;">Contemporary Health Center</p>
            </body></html>`);
            w.document.close();
            setTimeout(() => w.print(), 250);
          }} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Time Since Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-900 text-sm">Time Since Calculator</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-600 shrink-0">Enter a past date:</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            {timeSince && !timeSince.negative && (
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2 border border-blue-200">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-900">
                  {timeSince.weeks}w {timeSince.days}d
                </span>
                <span className="text-blue-600 text-sm">({timeSince.total} days)</span>
              </div>
            )}
            {timeSince?.negative && (
              <span className="text-red-500 text-sm">Please select a past date</span>
            )}
          </div>
        </div>
      </div>

      {/* Date Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weeks */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
            <span className="font-semibold text-purple-900 text-sm">By Weeks</span>
          </div>
          <div className="divide-y divide-gray-100">
            {weekItems.map(item => (
              <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                <span className="text-sm font-medium text-purple-700 w-24">{item.label}</span>
                <span className="text-sm text-gray-900 font-medium">{format(item.date, "EEE, MMM d, yyyy")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Months */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
            <span className="font-semibold text-purple-900 text-sm">By Months</span>
          </div>
          <div className="divide-y divide-gray-100">
            {monthItems.map(item => (
              <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                <span className="text-sm font-medium text-purple-700 w-24">{item.label}</span>
                <span className="text-sm text-gray-900 font-medium">{format(item.date, "EEE, MMM d, yyyy")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
