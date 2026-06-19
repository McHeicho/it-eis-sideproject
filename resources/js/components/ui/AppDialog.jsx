import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
    sm: "sm:max-w-md",
    default: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
};

export default function AppDialog({
    open,
    onOpenChange,
    title,
    description,
    size = "default",
    footer,
    leftAction,
    dismissible = true,
    className,
    children,
}) {
    const blockIfLocked = (e) => {
        if (!dismissible) e.preventDefault();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={blockIfLocked}
                onInteractOutside={blockIfLocked}
                className={cn(
                    "gap-0 p-0 overflow-hidden",
                    SIZE_CLASSES[size] || SIZE_CLASSES.default,
                    className
                )}
            >
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        {leftAction}
                        <DialogTitle className="text-base font-bold text-gray-800">
                            {title}
                        </DialogTitle>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={!dismissible}
                        className={cn(
                            "transition-colors",
                            dismissible
                                ? "text-gray-400 hover:text-gray-600"
                                : "text-gray-200 cursor-not-allowed"
                        )}
                    >
                        <X size={18} />
                    </button>
                </DialogHeader>

                <DialogDescription className="sr-only">
                    {description || ""}
                </DialogDescription>

                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>

                {footer ? (
                    <div className="px-6 py-3 border-t">{footer}</div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
