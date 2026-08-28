import * as React from "react"
import { Button as BaseButton, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// The registry's buttonVariants base string hard-codes rounded-2xl (18px at
// --radius: 0.625rem), which reads as a pill at these heights. This app wants a
// square-ish box, so every variant gets rounded-md — still token-driven, so it
// keeps tracking --radius.
const BOX = "rounded-md"

// This app's default-variant colors. The registry pairs bg-primary with
// text-primary-foreground (black), which is weak contrast on our green, so the
// resting label is forced white to match the white hover label. Hover uses the
// dedicated hover tokens (--primary-hover / --primary-hover-foreground, defined
// in app.css since the project's first shadcn commit), not the registry's plain
// opacity-based hover:bg-primary/80. In dark mode --primary is light grey, so
// the label reverts to the token there. A plain reinstall of ui/button.jsx
// silently drops all of this, so it lives here instead.
const DEFAULT_VARIANT =
    "text-white dark:text-primary-foreground " +
    "hover:bg-primary-hover hover:text-primary-hover-foreground"

// Semantic action variants (create/assign/edit). The registry's cva doesn't
// know these keys, so passing them through as `variant` yields no colour
// classes from buttonVariants — these strings are the only source of colour,
// applied via the wrapper's own className rather than by editing the
// registry's button.jsx.
const ACTION_VARIANTS = {
    create:
        "bg-action-create text-action-create-foreground hover:bg-action-create-hover",
    assign:
        "bg-action-assign text-action-assign-foreground hover:bg-action-assign-hover",
    edit:
        "bg-action-edit text-action-edit-foreground hover:bg-action-edit-hover",
}

function Button({ className, variant = "default", ...props }) {
    return (
        <BaseButton
            variant={variant}
            className={cn(
                BOX,
                variant === "default" && DEFAULT_VARIANT,
                ACTION_VARIANTS[variant],
                className
            )}
            {...props}
        />
    )
}

export { Button, buttonVariants }
