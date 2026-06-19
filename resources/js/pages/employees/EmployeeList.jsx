import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import EmployeeListHead from "./EmployeeList-HO";
import EmployeeListExt from "./EmployeeList-Ext";
import { Button } from "@/components/ui/button"
import axios from "axios";

export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("head");

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await api.get("/employees");
                setEmployees(response.data);
            } catch (error) {
                console.error("Failed to fetch employees:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const headEmployees = employees.filter(
        (e) => e.home_office_tag === "HO"
    );
    const extEmployees = employees.filter(
        (e) => e.home_office_tag !== "HO"
    );

    // Loading skeleton
    if (loading) {
        return (
            <div className="p-6">
                <div className="skeleton h-6 w-36 rounded mb-2"></div>
                <div className="skeleton h-3 w-24 rounded mb-6"></div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="skeleton h-8 w-32 rounded m-4"></div>
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between px-4 py-3 border-t"
                        >
                            <div className="skeleton h-3 w-40 rounded"></div>
                            <div className="skeleton h-3 w-24 rounded"></div>
                            <div className="skeleton h-5 w-5 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {employees.length} employee
                    {employees.length !== 1 ? "s" : ""} total
                </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                    <Button
                        onClick={() => setView("head")}
                        variant={view === "head" ? "default" : "outline"}
                        className="px-4 py-1.5"
                    >
                        Head Office
                    </Button>
                    <Button
                        onClick={() => setView("ext")}
                        className={`px-4 py-1.5 transition-colors ${
                            view === "ext"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Extension Office
                    </Button>
                </div>
                <p className="text-xs text-gray-400">
                    {view === "head" ? headEmployees.length : extEmployees.length} employee
                    {(view === "head" ? headEmployees.length : extEmployees.length) !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Active View */}
            {view === "head"
                ? <EmployeeListHead employees={headEmployees} />
                : <EmployeeListExt employees={extEmployees} />
            }
        </div>
    );
}