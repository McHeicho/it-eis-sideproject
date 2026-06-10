import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

// Assigned equipment per department.
export default function DepartmentBarChart({ data = [] }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Assigned per Department
            </h2>
            {data.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                    No assignments yet.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                        data={data}
                        margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f0f0f0"
                        />
                        <XAxis
                            dataKey="department"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={50}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                        />
                        <Tooltip
                            cursor={{ fill: "#f9fafb" }}
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Bar
                            dataKey="count"
                            name="Assigned"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={48}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
