import * as React from "react"
import {
    Select as BaseSelect,
    SelectContent as BaseSelectContent,
    SelectGroup,
    SelectItem as BaseSelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Radix Select is modal by default, independently of any Dialog it's nested
// in. While open it traps focus and sets pointer-events:none on the rest of
// the page — including sibling controls inside the same Dialog — so a click
// meant for e.g. a Checkbox lands on nothing, and the Dialog's own
// outside-interaction detection reads that as "clicked outside" and closes.
// modal={false} disables Select's own trap; the Dialog already provides
// page-level modality, so nothing is lost.
function Select({ modal = false, ...props }) {
    return <BaseSelect modal={modal} {...props} />
}

// Radix caps SelectContent at "however much room exists between the trigger
// and the viewport edge," which for long lists (100+ rows) can mean several
// hundred pixels of scrolling before it visually reads as a scrollable list
// rather than a panel that's taken over the screen. min() keeps Radix's
// dynamic value as the upper bound too, so the panel still shrinks further
// near a screen edge instead of overflowing.
const CONTENT_MAX_H =
    "max-h-[min(20rem,var(--radix-select-content-available-height))]"

function SelectContent({ className, ...props }) {
    return (
        <BaseSelectContent
            className={cn(CONTENT_MAX_H, className)}
            {...props}
        />
    )
}

// This app's highlighted-item fill is green (bg-primary), not the shadcn
// default neutral bg-accent.
const ITEM_HIGHLIGHT = "focus:bg-primary focus:text-primary-foreground"

function SelectItem({ className, ...props }) {
    return <BaseSelectItem className={cn(ITEM_HIGHLIGHT, className)} {...props} />
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
}
