import * as React from "react"
import {
    ToggleGroup,
    ToggleGroupItem as BaseToggleGroupItem,
} from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

// This app's pressed-state fill is green (bg-primary), not the shadcn
// default neutral bg-muted. Kept out of ui/toggle-group.jsx so that file can
// stay identical to the shadcn CLI's output and be safely regenerated.
const ITEM_PRESSED =
    "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"

function ToggleGroupItem({ className, ...props }) {
    return (
        <BaseToggleGroupItem
            className={cn(ITEM_PRESSED, className)}
            {...props}
        />
    )
}

export { ToggleGroup, ToggleGroupItem }
