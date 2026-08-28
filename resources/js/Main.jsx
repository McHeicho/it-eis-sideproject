import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import EquipmentList from '@/pages/equipment/EquipmentList';
import EquipmentReceipts from '@/pages/equipment/EquipmentReceipts';
import EquipmentAddEdit from '@/pages/equipment/EquipmentAddEdit';
import EquipmentDetail from '@/pages/equipment/EquipmentDetail';
import EmployeeList from '@/pages/employees/EmployeeList';
import AssignmentList from '@/pages/assignments/AssignmentList';
import BulkImport from '@/pages/bulk/BulkImport';
import EquipmentReports from '@/pages/reports/EquipmentReports';
import SidebarLayout from '@/layouts/SidebarLayout';

// Queries retry on the assumption that a failure might be transient. That's
// true for a dropped connection or a 5xx, and false for anything the server
// answered deliberately — a 404 will still be a 404 four attempts later.
// Mutations are unaffected; TanStack already defaults them to retry: 0.
const RETRY_LIMIT = 3;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                const status = error?.response?.status;

                // No response at all — network blip, server unreachable, DNS.
                if (status === undefined) return failureCount < RETRY_LIMIT;

                // 4xx — the server answered and said no. Retrying can't change that.
                // NOTE: if API throttling is ever added, 429 must escape this branch.
                if (status >= 400 && status < 500) return false;

                // 5xx and anything else — could be transient.
                return failureCount < RETRY_LIMIT;
            },
        },
    },
});

const isAuthenticated = () => !!localStorage.getItem('token');

function ProtectedRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function Main() {
    return (
        // next-themes supplies the theme that the shadcn Sonner wrapper reads via
        // useTheme(). Dark mode is parked (cleanup #30): forced light for now via
        // defaultTheme="light" + enableSystem={false} (no OS following, no toggle).
        // When #30 lands, enable system/add the toggle here. attribute="class"
        // toggles the `.dark` class already defined in app.css.
        <QueryClientProvider client={queryClient}>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
        <TooltipProvider delayDuration={100}>
        <Toaster position="bottom-right" />
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <SidebarLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="equipment" element={<EquipmentList />} />
                    <Route path="equipment/add" element={<EquipmentAddEdit />} />
                    <Route path="equipment/receipts" element={<EquipmentReceipts />} />
                    <Route path="equipment/:id/edit" element={<EquipmentAddEdit />} />
                    <Route path="equipment/:id" element={<EquipmentDetail />} />
                    <Route path="employees" element={<EmployeeList />} />
                    <Route path="assignments" element={<AssignmentList />} />
                    <Route path="bulk-import" element={<BulkImport />} />
                    <Route path="reports-equipment" element={<EquipmentReports />} />
                </Route>
            </Routes>
        </BrowserRouter>
        </TooltipProvider>
        </ThemeProvider>
        </QueryClientProvider>
    );
}