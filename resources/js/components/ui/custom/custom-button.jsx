import * as React from "react"
import { Button as BaseButton, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// This app's default-variant hover uses dedicated hover tokens
// (--primary-hover / --primary-hover-foreground, defined in app.css since
// the project's first shadcn commit), not the shadcn registry's plain
// opacity-based hover:bg-primary/80. A plain reinstall of ui/button.jsx
// silently drops this, so it lives here instead.
const DEFAULT_HOVER = "hover:bg-primary-hover hover:text-primary-hover-foreground"

function Button({ className, variant = "default", ...props }) {
    return (
        <BaseButton
            variant={variant}
            className={cn(variant === "default" && DEFAULT_HOVER, className)}
            {...props}
        />
    )
}

export { Button, buttonVariants }
