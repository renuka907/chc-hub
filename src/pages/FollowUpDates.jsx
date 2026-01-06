import React from "react";
import { format, addWeeks, addMonths, addDays } from "date-fns";

export default function FollowUpDates() {
  const [today, setToday] = React.useState(new Date());

  // Auto-refresh at local midnight so dates update every day without reload
  React.useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);

  const items = [
    { label: "2 weeks", date: addWeeks(today, 2) },
    { label: "4 weeks", date: addWeeks(today, 4) },
    { label: "6 weeks", date: addWeeks(today, 6) },
    { label: "14 weeks", date: addWeeks(today, 14) },
    // Half-months approximated as +15 days after whole months
    { label: "2 1/2 months", date: addDays(addMonths(today, 2), 15) },
    { label: "3 months", date: addMonths(today, 3) },
    { label: "3 1/2 months", date: addDays(addMonths(today, 3), 15) },
    { label: "5 months", date: addMonths(today, 5) },
    { label: "22 weeks", date: addWeeks(today, 22) },
    { label: "6 months", date: addMonths(today, 6) },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Follow‑up Dates</h1>
        <p className="text-gray-600">Today: {format(today, "EEEE, MMM d, yyyy")}</p>
        <p className="text-xs text-gray-500 mt-1">Auto‑updates every day at midnight (local time)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">{item.label}</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {format(item.date, "EEE, MMM d, yyyy")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}