import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONDITION_STYLES = {
    Good:      "bg-green-100 text-green-700",
    Defective: "bg-red-100 text-red-700",
};

export default function ConditionBadge({ condition, className }) {
    return (
        <Badge
            className={cn(
                "px-2 py-1 rounded-full text-xs font-medium border-0",
                CONDITION_STYLES[condition] ?? "bg-gray-100 text-gray-600",
                className
            )}
        >
            {condition}
        </Badge>
    );
}
