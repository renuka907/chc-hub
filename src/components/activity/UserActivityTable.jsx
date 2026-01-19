import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function UserActivityTable({ data }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No user data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">User Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Total Actions</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">View</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Edit</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Create</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((user) => (
                                <tr key={user.email} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-900">{user.full_name || user.email}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="text-center py-3 px-4 font-semibold text-purple-600">{user.total_actions}</td>
                                    <td className="text-center py-3 px-4 text-gray-600">{user.actions_by_type.view || 0}</td>
                                    <td className="text-center py-3 px-4 text-gray-600">{user.actions_by_type.edit || 0}</td>
                                    <td className="text-center py-3 px-4 text-gray-600">{user.actions_by_type.create || 0}</td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}