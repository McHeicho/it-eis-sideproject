import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/layouts/AppSidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

export default function SidebarLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="sticky top-0 z-10 flex h-12 items-center border-b bg-background px-2">
                    <SidebarTrigger />
                </div>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
