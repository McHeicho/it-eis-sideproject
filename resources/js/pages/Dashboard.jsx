import React, { useEffect, useState } from "react";
import {
    Laptop,
    UserX,
    AlertTriangle,
    Wrench,
    PackageOpen,
} from "lucide-react";
import api from "@/api/axios";
import StatCard from "@/components/dashboard/StatCard";
import DepartmentBarChart from "@/components/dashboard/DepartmentBarChart";
import StatusDonut from "@/components/dashboard/StatusDonut";
import AlertCard from "@/components/dashboard/AlertCard";

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role_id === 1;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get("/dashboard");
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="p-6">
                <div className="skeleton h-7 w-48 rounded mb-2"></div>
                <div className="skeleton h-3 w-32 rounded mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton h-24 rounded-lg"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="skeleton h-72 rounded-lg"></div>
                    <div className="skeleton h-72 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Could not load dashboard data.
            </div>
        );
    }

    const { totals, assigned_per_department, status_breakdown, alerts } = data;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Welcome, {user.first_name || "there"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    IT inventory overview
                </p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon={<Laptop size={22} />}
                    label="Total Equipment"
                    value={totals.equipment_total}
                    accent="blue"
                />
                {totals.by_type.slice(0, 2).map((t) => (
                    <StatCard
                        key={t.type}
                        icon={<Laptop size={22} />}
                        label={t.type}
                        value={t.count}
                        accent="purple"
                    />
                ))}
            </div>

            {/* Overview charts */}
            <div
                className={`grid grid-cols-1 ${
                    isAdmin ? "lg:grid-cols-2" : ""
                } gap-4 mb-6`}
            >
                <DepartmentBarChart data={assigned_per_department} />
                {isAdmin && status_breakdown && (
                    <StatusDonut data={status_breakdown} />
                )}
            </div>

            {/* Alerts (admin only) */}
            {isAdmin && alerts && (
                <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-gray-400" />
                        Alerts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <AlertCard
                            title="No Assigned Laptop"
                            icon={<UserX size={16} />}
                            severity="warning"
                            count={alerts.employees_no_laptop.count}
                            items={alerts.employees_no_laptop.items}
                            viewAllTo="/employees"
                            renderItem={(e) => (
                                <span>
                                    {e.name}
                                    {e.department && (
                                        <span className="text-gray-400">
                                            {" "}
                                            · {e.department}
                                        </span>
                                    )}
                                </span>
                            )}
                        />
                        <AlertCard
                            title="Lost / Missing"
                            icon={<AlertTriangle size={16} />}
                            severity="danger"
                            count={alerts.lost_missing.count}
                            items={alerts.lost_missing.items}
                            viewAllTo="/equipment?status=Lost%2FMissing"
                            renderItem={renderEquipment}
                        />
                        <AlertCard
                            title="Under Repair"
                            icon={<Wrench size={16} />}
                            severity="warning"
                            count={alerts.under_repair.count}
                            items={alerts.under_repair.items}
                            viewAllTo="/equipment?status=Under%20Repair"
                            renderItem={renderEquipment}
                        />
                        <AlertCard
                            title="Idle Stock"
                            icon={<PackageOpen size={16} />}
                            severity="info"
                            count={alerts.idle_stock.count}
                            items={alerts.idle_stock.items}
                            viewAllTo="/equipment"
                            renderItem={renderEquipment}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function renderEquipment(eq) {
    const label = [eq.brand, eq.model].filter(Boolean).join(" ");
    return (
        <span>
            {label || eq.asset_tag || "Equipment"}
            {eq.serial && (
                <span className="text-gray-400 font-mono"> · {eq.serial}</span>
            )}
        </span>
    );
}
