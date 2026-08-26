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

function Button({ className, variant = "default", ...props }) {
    return (
        <BaseButton
            variant={variant}
            className={cn(BOX, variant === "default" && DEFAULT_VARIANT, className)}
            {...props}
        />
    )
}

export { Button, buttonVariants }
