import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityHeatmap({ data }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Activity Heatmap (Today by Hour)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No data available</p>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(...data);
    const getColor = (value) => {
        const intensity = value / (maxValue || 1);
        if (intensity === 0) return 'bg-gray-100';
        if (intensity < 0.25) return 'bg-blue-100';
        if (intensity < 0.5) return 'bg-blue-300';
        if (intensity < 0.75) return 'bg-blue-500';
        return 'bg-blue-700';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Activity Heatmap (Today by Hour)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-12 gap-1">
                    {data.map((count, hour) => (
                        <div key={hour} className="flex flex-col items-center">
                            <div
                                className={`w-full h-12 rounded ${getColor(count)} transition-colors cursor-pointer`}
                                title={`${hour}:00 - ${count} actions`}
                            />
                            <span className="text-xs text-gray-500 mt-1">{hour}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center mt-4 text-xs text-gray-600">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded ${
                                    intensity === 0 ? 'bg-gray-100' :
                                    intensity < 0.25 ? 'bg-blue-100' :
                                    intensity < 0.5 ? 'bg-blue-300' :
                                    intensity < 0.75 ? 'bg-blue-500' :
                                    'bg-blue-700'
                                }`}
                            />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}