import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Laptop,
    Users,
    ClipboardList,
    LogOut,
    Settings,
    ChevronDown,
    ChevronRight,
    Building2,
    Tag,
    Truck,
    Upload,
    FileSpreadsheet,
    List,
    Receipt,
    Download,
    FileText,
} from "lucide-react";
import ManageDepartmentsModal from "./ManageDepartmentsModal";
import ManageBrandsModelsModal from "./ManageBrandsModelsModal";
import ManageSuppliersModal from "./ManageSuppliersModal";
import ManageEmployeesModal from "./ManageEmployeesModal";

export default function Layout() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role_id === 1;

    const [equipmentOpen, setEquipmentOpen] = useState(false);
    const [maintenanceOpen, setMaintenanceOpen] = useState(false);
    const [showDepartmentsModal, setShowDepartmentsModal] = useState(false);
    const [showBrandsModelsModal, setShowBrandsModelsModal] = useState(false);
    const [showSuppliersModal, setShowSuppliersModal] = useState(false);
    const [showEmployeesModal, setShowEmployeesModal] = useState(false);
    const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);

    const handleLogout = async () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const navItems = [
        {
            to: "/dashboard",
            icon: <LayoutDashboard size={18} />,
            label: "Dashboard",
        },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-56 bg-white shadow-md flex flex-col">
                <div className="p-5 border-b">
                    <h1 className="text-sm font-bold text-gray-800">
                        IT Inventory
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        {user.first_name} {user.last_name}
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {/* Main Nav Items */}
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Equipment Section */}
                    <div>
                        <button
                            onClick={() => setEquipmentOpen(!equipmentOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Laptop size={18} />
                                Equipment
                            </div>
                            {equipmentOpen ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </button>

                        {equipmentOpen && (
                            <div className="mt-1 ml-4 space-y-1">
                                <NavLink
                                    to="/equipment"
                                    end
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                                            isActive
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`
                                    }
                                >
                                    <List size={16} />
                                    List
                                </NavLink>
                                <NavLink
                                    to="/equipment/receipts"
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                                            isActive
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`
                                    }
                                >
                                    <Receipt size={16} />
                                    Receipts
                                </NavLink>
                                <NavLink
                                    to="/assignments"
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                                            isActive
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`
                                    }
                                >
                                    <ClipboardList size={16} />
                                    Assignments
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Employees */}
                    <NavLink
                        to="/employees"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`
                        }
                    >
                        <Users size={18} />
                        Employees
                    </NavLink>

                    {/* Maintenance Section — Admin Only */}
                    {isAdmin && (
                        <div className="pt-2">
                            {/* Maintenance Toggle */}
                            <button
                                onClick={() =>
                                    setMaintenanceOpen(!maintenanceOpen)
                                }
                                className="flex items-center justify-between w-full px-3 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Settings size={18} />
                                    Maintenance
                                </div>
                                {maintenanceOpen ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                            </button>

                            {/* Dropdown Items */}
                            {maintenanceOpen && (
                                <div className="mt-1 ml-4 space-y-1">
                                    <button
                                        onClick={() =>
                                            setShowDepartmentsModal(true)
                                        }
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <Building2 size={16} />
                                        Manage Departments
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowBrandsModelsModal(true)
                                        }
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <Tag size={16} />
                                        Manage Brands & Models
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowSuppliersModal(true)
                                        }
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <Truck size={16} />
                                        Manage Suppliers
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowEmployeesModal(true)
                                        }
                                        className="flex items-center gap-3 w-full px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <Users size={16} />
                                        Manage Employees
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bulk Actions Section — Admin Only */}
                    {isAdmin && (
                        <div className="pt-2">
                            <button
                                onClick={() =>
                                    setBulkActionsOpen(!bulkActionsOpen)
                                }
                                className="flex items-center justify-between w-full px-3 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Upload size={18} />
                                    Bulk Actions
                                </div>
                                {bulkActionsOpen ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                            </button>

                            {bulkActionsOpen && (
                                <div className="mt-1 ml-4 space-y-1">
                                    <NavLink
                                        to="/bulk-import"
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                                                isActive
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            }`
                                        }
                                    >
                                        <FileSpreadsheet size={16} />
                                        Bulk Import
                                    </NavLink>
                                </div>
                            )}
                            {/* Generate Reports Section */}
<div className="pt-2">
    <button
        onClick={() => setReportsOpen(!reportsOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
    >
        <div className="flex items-center gap-3">
            <FileText size={18} />
            Generate Reports
        </div>
        {reportsOpen ? (
            <ChevronDown size={14} />
        ) : (
            <ChevronRight size={14} />
        )}
    </button>

    {reportsOpen && (
        <div className="mt-1 ml-4 space-y-1">
            <NavLink
                to="/reports-equipment"
                className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                        isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-600 hover:bg-gray-100"
                    }`
                }
            >
                <Laptop size={16} />
                Equipment Reports
            </NavLink>
        </div>
    )}
</div>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full rounded text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>

            {/* Modals */}
            {showDepartmentsModal && (
                <ManageDepartmentsModal
                    onClose={() => setShowDepartmentsModal(false)}
                />
            )}
            {showBrandsModelsModal && (
                <ManageBrandsModelsModal
                    onClose={() => setShowBrandsModelsModal(false)}
                />
            )}
            {showSuppliersModal && (
                <ManageSuppliersModal
                    onClose={() => setShowSuppliersModal(false)}
                />
            )}
            {showEmployeesModal && (
                <ManageEmployeesModal
                    onClose={() => setShowEmployeesModal(false)}
                />
            )}
        </div>
    );
}
