import React from "react";

// KPI number card: icon + label + value.
export default function StatCard({ icon, label, value, accent = "blue" }) {
    const accents = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        gray: "bg-gray-100 text-gray-600",
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4">
            {icon && (
                <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                        accents[accent] || accents.blue
                    }`}
                >
                    {icon}
                </div>
            )}
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                    {label}
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
        </div>
    );
}
