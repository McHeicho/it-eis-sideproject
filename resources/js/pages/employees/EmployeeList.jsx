import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import EmployeeListHead from "./EmployeeList-HO";
import EmployeeListManila from "./EmployeeList-Manila";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/custom/custom-tabs"

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
        (e) => e.branch?.branch_code === "HO"
    );
    const manilaEmployees = employees.filter(
        (e) => e.branch?.branch_code === "MLA"
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

            <Tabs value={view} onValueChange={setView}>
                {/* View Toggle */}
                <div className="flex items-center gap-4 mb-6">
                    <TabsList>
                        <TabsTrigger value="head">Head Office</TabsTrigger>
                        <TabsTrigger value="manila">Manila Office</TabsTrigger>
                    </TabsList>
                    <p className="text-xs text-gray-400">
                        {view === "head" ? headEmployees.length : manilaEmployees.length} employee
                        {(view === "head" ? headEmployees.length : manilaEmployees.length) !== 1 ? "s" : ""}
                    </p>
                </div>

                <TabsContent value="head">
                    <EmployeeListHead employees={headEmployees} />
                </TabsContent>
                <TabsContent value="manila">
                    <EmployeeListManila employees={manilaEmployees} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
