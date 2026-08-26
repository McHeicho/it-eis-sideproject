import * as React from "react"
import {
    ToggleGroup,
    ToggleGroupItem as BaseToggleGroupItem,
} from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

// This app's pressed-state fill is green (bg-primary), not the shadcn
// default neutral bg-muted. The label is white rather than the paired
// text-primary-foreground (black), which is weak contrast on that green —
// same call as the default Button in custom-button.jsx. In dark mode
// --primary is light grey, so the label reverts to the token there. Kept out
// of ui/toggle-group.jsx so that file can stay identical to the shadcn CLI's
// output and be safely regenerated.
const ITEM_PRESSED =
    "data-[state=on]:bg-primary data-[state=on]:text-white " +
    "dark:data-[state=on]:text-primary-foreground"

function ToggleGroupItem({ className, ...props }) {
    return (
        <BaseToggleGroupItem
            className={cn(ITEM_PRESSED, className)}
            {...props}
        />
    )
}

export { ToggleGroup, ToggleGroupItem }
