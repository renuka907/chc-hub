import React from "react";
import { format, addWeeks, addMonths, addDays, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FollowUpDates() {
  const [today, setToday] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState("");

  // Auto-refresh at local midnight so dates update every day without reload
  React.useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight);
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
    { label: "2 1/2 months", date: addDays(addMonths(today, 2), 15) },
    { label: "3 months", date: addMonths(today, 3) },
    { label: "3 1/2 months", date: addDays(addMonths(today, 3), 15) },
    { label: "5 months", date: addMonths(today, 5) },
    { label: "5 1/2 months", date: addDays(addMonths(today, 5), 15) },
    { label: "6 months", date: addMonths(today, 6) },
  ];

  const calculateTimeSince = () => {
    if (!selectedDate) return null;
    
    const pastDate = new Date(selectedDate);
    const totalDays = differenceInDays(today, pastDate);
    
    if (totalDays < 0) return { weeks: 0, days: 0, total: totalDays };
    
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    
    return { weeks, days, total: totalDays };
  };

  const timeSince = calculateTimeSince();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Follow‑up Dates</h1>
        <p className="text-gray-600">Today: {format(today, "EEEE, MMM d, yyyy")}</p>
        <p className="text-xs text-gray-500 mt-1">Auto‑updates every day at midnight (local time)</p>
      </div>

      {/* Time Since Calculator */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Time Since Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="date-input">Enter a past date:</Label>
            <Input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white"
            />
          </div>
          
          {timeSince && timeSince.total >= 0 && (
            <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {timeSince.weeks} week{timeSince.weeks !== 1 ? 's' : ''} and {timeSince.days} day{timeSince.days !== 1 ? 's' : ''}
              </div>
              <div className="text-gray-600">
                ({timeSince.total} total day{timeSince.total !== 1 ? 's' : ''})
              </div>
            </div>
          )}
          
          {timeSince && timeSince.total < 0 && (
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
              <div className="text-red-700 font-semibold">
                Please select a date in the past
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weeks Column */}
        <div>
          <h2 className="text-2xl font-bold text-purple-700 mb-4">Weeks</h2>
          <div className="space-y-3">
            {weekItems.map((item) => (
              <div key={item.label} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-purple-600">{item.label}</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {format(item.date, "EEE, MMM d, yyyy")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Months Column */}
        <div>
          <h2 className="text-2xl font-bold text-purple-700 mb-4">Months</h2>
          <div className="space-y-3">
            {monthItems.map((item) => (
              <div key={item.label} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-purple-600">{item.label}</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {format(item.date, "EEE, MMM d, yyyy")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}