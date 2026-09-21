import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/layouts/AppSidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

export default function SidebarLayout() {
    // Keyed on the path so a page that crashed is retried fresh when the
    // user navigates elsewhere, instead of the boundary staying tripped.
    const location = useLocation();

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="sticky top-0 z-10 flex h-12 items-center border-b bg-background px-2">
                    <SidebarTrigger />
                </div>
                <ErrorBoundary key={location.pathname}>
                    <Outlet />
                </ErrorBoundary>
            </SidebarInset>
        </SidebarProvider>
    );
}
