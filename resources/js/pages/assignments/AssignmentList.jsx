import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import StatusBadge from "@/components/ui/StatusBadge";
import AssignmentAssignModal from "./AssignmentAssignModal";
import AssignmentReturnModal from "./AssignmentReturnModal";
import { useLookups } from "@/queries/useLookups";
import { useEquipmentList } from "@/queries/useEquipmentList";
import { useAssignmentsList } from "@/queries/useAssignmentsList";
import { sortBranches } from "@/lib/branches";

const ASSIGNMENT_EQUIPMENT_FILTERS = {
    status: "",
    condition: "",
    equipment_type_id: "",
    supplier_id: "",
    serial_number: "",
};

export default function AssignmentList() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role_id === 1;

    const queryClient = useQueryClient();

    const { data: lookups, isPending: lookupsPending } = useLookups();
    const { data: equipment = [], isPending: equipmentPending } = useEquipmentList(ASSIGNMENT_EQUIPMENT_FILTERS);
    const { data: assignments = [], isPending: assignmentsPending } = useAssignmentsList();

    const employees = lookups?.employees ?? [];
    const departments = lookups?.departments ?? [];
    const branches = lookups?.branches ?? [];

    const loading = lookupsPending || equipmentPending || assignmentsPending;

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [branchFilter, setBranchFilter] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState("");

    // Modal visibility
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [preselectedEquipment, setPreselectedEquipment] = useState(null);

    // Resolves a row's location for the Branches filter as "branch:<id>" —
    // the assignment's own branch when branch-held, otherwise the holder
    // employee's. Equipment with no current holder has no location.
    const getLocationKey = (assignment) => {
        if (!assignment) return null;
        if (assignment.branch_id) return `branch:${assignment.branch_id}`;
        const employeeBranchId = assignment.employee?.branch_id;
        if (!employeeBranchId) return null;
        return `branch:${employeeBranchId}`;
    };

    // Human-readable location for the Branch column — shown for every row,
    // not just branch-held ones.
    const getLocationLabel = (assignment) => {
        if (!assignment) return "—";
        return (
            assignment.branch?.branch_name ??
            assignment.employee?.branch?.branch_name ??
            "—"
        );
    };

    // Equipment statuses actually present in the data, in canonical order —
    // drives the Status filter so empty statuses don't clutter the dropdown.
    const STATUS_ORDER = [
        "Assigned",
        "Available",
        "Under Repair",
        "Lost/Missing",
        "Retired/Disposed",
        "Spare Unit",
    ];
    const presentStatuses = STATUS_ORDER.filter((s) =>
        equipment.some((e) => e.status === s)
    );

    // Statuses eligible for the per-row "Assign" quick action
    const ASSIGNABLE_STATUSES = ["Available", "Spare Unit", "Lost/Missing"];

    // Equipment-centric view: one row per piece of equipment, paired with its
    // active assignment (if any)
    const equipmentViewData = equipment
        .map((eq) => {
            const activeAssignment = assignments.find(
                (a) => a.equipment_id === eq.id && !a.date_returned
            );
            return { equipment: eq, assignment: activeAssignment || null };
        })
        .filter((row) => {
            if (
                deptFilter &&
                row.assignment?.employee?.department_tag !== deptFilter
            )
                return false;
            if (
                employeeFilter &&
                String(row.assignment?.employee_id) !== employeeFilter
            )
                return false;
            if (branchFilter && getLocationKey(row.assignment) !== branchFilter)
                return false;
            if (statusFilter !== "all" && row.equipment.status !== statusFilter)
                return false;
            return true;
        });

    // Employees for the filter bar, cascading off the Department filter
    const employeeFilterOptions = employees.filter((e) => {
        if (deptFilter && e.department_tag !== deptFilter) return false;
        return true;
    });

    const sortedBranches = sortBranches(branches);

    const formatDate = (date) =>
        date
            ? new Date(date).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
              })
            : "—";

    const handleOpenAssign = (eq = null) => {
        setPreselectedEquipment(eq);
        setShowAssignModal(true);
    };

    const handleOpenReturn = (assignment) => {
        setSelectedAssignment(assignment);
        setShowReturnModal(true);
    };

    const invalidateAssignmentData = () => {
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="p-6">
                <div className="skeleton h-6 w-36 rounded mb-2"></div>
                <div className="skeleton h-3 w-24 rounded mb-6"></div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between px-4 py-3 border-b"
                        >
                            <div className="skeleton h-3 w-40 rounded"></div>
                            <div className="skeleton h-3 w-32 rounded"></div>
                            <div className="skeleton h-3 w-24 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Assignments
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {equipmentViewData.length} record
                        {equipmentViewData.length !== 1 ? "s" : ""} found
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenAssign()}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        <ClipboardList size={16} />
                        Assign Equipment
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Status</option>
                    {presentStatuses.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>

                {/* Branches Filter */}
                <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Branches</option>
                    {sortedBranches.map((branch) => (
                        <option key={branch.id} value={`branch:${branch.id}`}>
                            {branch.branch_name} ({branch.branch_code})
                        </option>
                    ))}
                </select>

                {/* Department Filter */}
                <select
                    value={deptFilter}
                    onChange={(e) => {
                        setDeptFilter(e.target.value);
                        setEmployeeFilter("");
                    }}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.tag}>
                            {dept.name} ({dept.tag})
                        </option>
                    ))}
                </select>

                {/* Employee Filter */}
                <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Employees</option>
                    {employeeFilterOptions.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.department_tag})
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {equipmentViewData.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <ClipboardList
                        size={40}
                        className="mx-auto mb-3 opacity-30"
                    />
                    <p className="text-sm">No assignment records found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Equipment
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Serial No.
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">Branch</TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Department
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Employee
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Date Assigned
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Date Returned
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">Status</TableHead>
                                {isAdmin && (
                                    <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                        Actions
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100">
                            {equipmentViewData.map((row) => {
                                const { equipment: eq, assignment } = row;
                                const isActive = !!assignment;
                                const isBranchHeld =
                                    !!assignment?.branch &&
                                    !assignment?.employee;
                                return (
                                    <TableRow
                                        key={eq.id}
                                        className="border-0 hover:bg-gray-50 transition-colors"
                                    >
                                        <TableCell className="px-4 py-3 font-medium text-gray-800">
                                            {eq.brand?.name} {eq.model?.name}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 font-mono text-xs text-gray-600">
                                            {eq.serial_number}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600 text-xs">
                                            {getLocationLabel(assignment)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-xs">
                                            {assignment && !isBranchHeld
                                                ? assignment.employee
                                                      ?.department?.name
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600">
                                            {assignment && !isBranchHeld
                                                ? assignment.employee?.name
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600 text-xs">
                                            {assignment
                                                ? formatDate(
                                                      assignment.date_assigned
                                                  )
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-600 text-xs">
                                            {assignment
                                                ? formatDate(
                                                      assignment.date_returned
                                                  )
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <StatusBadge status={eq.status} />
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="px-4 py-3">
                                                {isActive && assignment ? (
                                                    <button
                                                        onClick={() =>
                                                            handleOpenReturn(
                                                                assignment
                                                            )
                                                        }
                                                        className="text-blue-600 hover:underline text-xs"
                                                    >
                                                        Return
                                                    </button>
                                                ) : (
                                                    ASSIGNABLE_STATUSES.includes(
                                                        eq.status
                                                    ) && (
                                                        <button
                                                            onClick={() =>
                                                                handleOpenAssign(
                                                                    eq
                                                                )
                                                            }
                                                            className="text-green-600 hover:underline text-xs"
                                                        >
                                                            Assign
                                                        </button>
                                                    )
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {showAssignModal && (
                <AssignmentAssignModal
                    equipment={equipment}
                    assignments={assignments}
                    employees={employees}
                    departments={departments}
                    branches={branches}
                    preselectedEquipment={preselectedEquipment}
                    onClose={() => {
                        setShowAssignModal(false);
                        setPreselectedEquipment(null);
                    }}
                    onAssigned={invalidateAssignmentData}
                />
            )}
            {showReturnModal && selectedAssignment && (
                <AssignmentReturnModal
                    assignment={selectedAssignment}
                    onClose={() => setShowReturnModal(false)}
                    onReturned={invalidateAssignmentData}
                />
            )}
        </div>
    );
}