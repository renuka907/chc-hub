import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'purple' }) {
    const colorClasses = {
        purple: 'bg-purple-50 text-purple-700',
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        pink: 'bg-pink-50 text-pink-700'
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                    {Icon && <Icon className={`w-5 h-5 ${colorClasses[color]}`} />}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
                {trend && (
                    <div className={`text-xs font-medium mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </div>
                )}
            </CardContent>
        </Card>
    );
}