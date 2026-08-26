import React, { useState } from "react";
import { Laptop } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const VISIBLE_LIMIT = 20;

export default function EmployeeListTable({ employees, emptyMessage }) {
    const [expandedDepts, setExpandedDepts] = useState({});

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
                ([deptName, deptEmployees]) => {
                    const isExpanded = !!expandedDepts[deptName];
                    const visibleEmployees = isExpanded
                        ? deptEmployees
                        : deptEmployees.slice(0, VISIBLE_LIMIT);
                    const hiddenCount = deptEmployees.length - VISIBLE_LIMIT;

                    return (
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
                            <Table className="table-fixed">
                                <TableHeader className="text-gray-500 uppercase text-xs border-b">
                                    <TableRow className="border-0 hover:bg-transparent">
                                        <TableHead className="px-4 py-3 h-auto font-normal text-inherit w-[45%]">
                                            Name
                                        </TableHead>
                                        <TableHead className="px-4 py-3 h-auto font-normal text-inherit text-center w-[20%]">
                                            Assigned Unit
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-50">
                                    {visibleEmployees.map((employee) => (
                                        <TableRow
                                            key={employee.id}
                                            className="border-0 hover:bg-gray-50 transition-colors"
                                        >
                                            <TableCell
                                                className="px-4 py-3 font-medium text-gray-800 truncate"
                                                title={employee.name}
                                            >
                                                {employee.name}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Show More */}
                            {hiddenCount > 0 && !isExpanded && (
                                <div className="border-t px-4 py-2 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setExpandedDepts((prev) => ({
                                                ...prev,
                                                [deptName]: true,
                                            }))
                                        }
                                    >
                                        Show {hiddenCount} more
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                }
            )}

            {/* Empty State */}
            {employees.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
}
