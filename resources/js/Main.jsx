import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
    );
}