import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/equipment/EquipmentList';
import EquipmentReceipts from './pages/equipment/EquipmentReceipts';
import EquipmentAddEdit from './pages/equipment/EquipmentAddEdit';
import EquipmentDetail from './pages/equipment/EquipmentDetail';
import EmployeeList from './pages/employees/EmployeeList';
import AssignmentList from './pages/assignments/AssignmentList';
import BulkImport from './pages/bulk/BulkImport';
import Layout from './components/Layout';

const isAuthenticated = () => !!localStorage.getItem('token');

function ProtectedRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function Main() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}