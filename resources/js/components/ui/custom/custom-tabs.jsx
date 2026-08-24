import * as React from "react"
import {
    Tabs,
    TabsList,
    TabsTrigger as BaseTabsTrigger,
    TabsContent,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// This app's active-tab fill is green (bg-primary), not the shadcn default
// neutral bg-background. Kept out of ui/tabs.jsx so that file can stay
// identical to the shadcn CLI's output and be safely regenerated.
const TRIGGER_ACTIVE =
    "data-active:bg-primary data-active:text-primary-foreground " +
    "dark:data-active:bg-primary dark:data-active:text-primary-foreground"

function TabsTrigger({ className, ...props }) {
    return <BaseTabsTrigger className={cn(TRIGGER_ACTIVE, className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
