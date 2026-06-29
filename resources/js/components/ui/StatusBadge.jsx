import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
    Available:          "bg-green-100 text-green-700",
    Assigned:           "bg-blue-100 text-blue-700",
    "Under Repair":     "bg-yellow-100 text-yellow-700",
    "Lost/Missing":     "bg-red-100 text-red-700",
    "Retired/Disposed": "bg-gray-100 text-gray-600",
    "Spare Unit":       "bg-purple-100 text-purple-700",
    Active:             "bg-green-100 text-green-700",
    Returned:           "bg-purple-100 text-purple-700",
};

const StatusBadge = React.forwardRef(({ status, className, ...props }, ref) => {
    return (
        <Badge
            ref={ref}
            className={cn(
                "px-2 py-1 rounded-full text-xs font-medium border-0",
                STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600",
                className
            )}
            {...props}
        >
            {status}
        </Badge>
    );
});

export default StatusBadge;
