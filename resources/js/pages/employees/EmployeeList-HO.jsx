import React from "react";
import { Laptop } from "lucide-react";

export default function EmployeeListHead({ employees }) {
    // Group employees by department
    const groupedByDepartment = employees.reduce((groups, employee) => {
        const dept = employee.department?.name || "Unassigned";
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(employee);
        return groups;
    }, {});

    return (
        <div className="space-y-6">
            {Object.entries(groupedByDepartment).map(
                ([deptName, deptEmployees]) => (
                    <div
                        key={deptName}
                        className="bg-white rounded-lg shadow overflow-hidden"
                    >
                        {/* Department Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b">
                            <h2 className="text-sm font-semibold text-gray-700">
                                {deptName}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {deptEmployees.length} employee
                                {deptEmployees.length !== 1 ? "s" : ""}
                            </p>
                        </div>

                        {/* Employee Table */}
                        <table className="w-full text-sm">
                            <thead className="text-gray-500 uppercase text-xs border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Department
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Assigned Unit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {deptEmployees.slice(0, 20).map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {employee.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {employee.department?.tag}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                {employee.assignments.length ===
                                                0 ? (
                                                    <Laptop
                                                        size={18}
                                                        className="text-gray-300"
                                                    />
                                                ) : (
                                                    employee.assignments.map(
                                                        (assignment) => (
                                                            <Laptop
                                                                key={
                                                                    assignment.id
                                                                }
                                                                size={18}
                                                                className="text-blue-500"
                                                            />
                                                        )
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Empty State */}
            {employees.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">No employees in Head Office.</p>
                </div>
            )}
        </div>
    );
}