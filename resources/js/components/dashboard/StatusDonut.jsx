import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Colors mirror the status badge palette used in EquipmentList.
const STATUS_COLORS = {
    Available: "#22c55e",
    Assigned: "#3b82f6",
    "Under Repair": "#eab308",
    "Lost/Missing": "#ef4444",
    "Retired/Disposed": "#9ca3af",
    "Spare Unit": "#a855f7",
};

// Donut of equipment status breakdown (admin only).
export default function StatusDonut({ data = [] }) {
    const visible = data.filter((d) => d.count > 0);
    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Status Breakdown
            </h2>
            {total === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                    No equipment yet.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={visible}
                            dataKey="count"
                            nameKey="status"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                        >
                            {visible.map((entry) => (
                                <Cell
                                    key={entry.status}
                                    fill={STATUS_COLORS[entry.status] || "#9ca3af"}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 11 }}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
