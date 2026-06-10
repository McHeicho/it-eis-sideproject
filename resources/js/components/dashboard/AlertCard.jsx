import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";

// Reusable alert tile: title, count badge, a few example rows, and a "View all" link.
// When count === 0 it renders in a calm/neutral state instead of alarming.
const SEVERITY = {
    danger: { badge: "bg-red-100 text-red-700", icon: "text-red-500" },
    warning: { badge: "bg-yellow-100 text-yellow-700", icon: "text-yellow-600" },
    info: { badge: "bg-blue-100 text-blue-700", icon: "text-blue-500" },
};

export default function AlertCard({
    title,
    icon,
    count = 0,
    items = [],
    severity = "info",
    viewAllTo,
    renderItem,
}) {
    const isClear = count === 0;
    const tone = SEVERITY[severity] || SEVERITY.info;

    return (
        <div className="bg-white rounded-lg shadow-md p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={isClear ? "text-gray-400" : tone.icon}>
                        {icon}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-700">
                        {title}
                    </h3>
                </div>
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isClear ? "bg-gray-100 text-gray-500" : tone.badge
                    }`}
                >
                    {count}
                </span>
            </div>

            {isClear ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <Check size={16} className="text-green-500" />
                    All clear
                </div>
            ) : (
                <>
                    <ul className="space-y-1.5 flex-1">
                        {items.map((item, i) => (
                            <li
                                key={item.id ?? i}
                                className="text-sm text-gray-600 truncate"
                            >
                                {renderItem(item)}
                            </li>
                        ))}
                    </ul>
                    {viewAllTo && count > items.length && (
                        <p className="text-xs text-gray-400 mt-2">
                            +{count - items.length} more
                        </p>
                    )}
                    {viewAllTo && (
                        <Link
                            to={viewAllTo}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            View all
                            <ChevronRight size={14} />
                        </Link>
                    )}
                </>
            )}
        </div>
    );
}
