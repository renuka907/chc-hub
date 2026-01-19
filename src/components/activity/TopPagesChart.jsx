import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TopPagesChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Most Accessed Pages</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No data available</p>
                </CardContent>
            </Card>
        );
    }

    const chartData = data.map(item => ({
        name: item.page.length > 20 ? item.page.substring(0, 20) + '...' : item.page,
        visits: item.count
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Most Accessed Pages</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="visits" fill="#8b5cf6" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}