import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Laptop, FileSearch, Pencil } from "lucide-react";
import api from "@/api/axios";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import StatusBadge from "@/components/ui/StatusBadge";
import ConditionBadge from "@/components/ui/ConditionBadge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLookups } from "@/queries/useLookups";
import { useEquipmentList } from "@/queries/useEquipmentList";

// Tooltip text for an Assigned row's current holder. Employee-held rows name
// the person and their office; branch-held rows name the branch. Returns null
// when neither resolves, so the caller can skip the tooltip entirely.
const holderLabel = (assignment) => {
    if (!assignment) return null;
    if (assignment.employee) {
        const branch = assignment.employee.branch?.branch_name;
        return `Assigned to: ${assignment.employee.name}${branch ? ` — ${branch}` : ""}`;
    }
    const branch = assignment.branch?.branch_name;
    return branch ? `Located at: ${branch}` : null;
};

const EMPTY_FILTERS = {
    status: "",
    condition: "",
    equipment_type_id: "",
    supplier_id: "",
    serial_number: "",
};

export default function EquipmentList() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Allow deep links like /equipment?status=Lost/Missing (e.g. dashboard alerts).
    const initialStatus = searchParams.get("status") || "";
    const [filterForm, setFilterForm] = useState({
        ...EMPTY_FILTERS,
        status: initialStatus,
    });
    const [appliedFilters, setAppliedFilters] = useState({
        ...EMPTY_FILTERS,
        status: initialStatus,
    })

    const { data: lookups } = useLookups();
    const types = lookups?.types ?? [];
    const suppliers = lookups?.suppliers ?? [];

    const {
        data: equipment = [],
        isPending: loading,
        isFetching,
    } = useEquipmentList(appliedFilters);
    const filtering = isFetching && !loading;

    const handleFilter = () => setAppliedFilters(filterForm);

    const handleReset = () => {
        setFilterForm(EMPTY_FILTERS);
        setAppliedFilters(EMPTY_FILTERS);
    };

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading equipment...
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Equipment
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Equipment inventory.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/equipment/add")}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                    Add Equipment
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Status
                        </label>
                        <select
                            value={filterForm.status}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                        >
                            <option value="">All Statuses</option>
                            {[
                                "Available",
                                "Assigned",
                                "Under Repair",
                                "Lost/Missing",
                                "Retired/Disposed",
                                "Spare Unit",
                            ].map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Condition
                        </label>
                        <select
                            value={filterForm.condition}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    condition: e.target.value,
                                }))
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                        >
                            <option value="">All Conditions</option>
                            {["Good", "Defective"].map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Equipment Type
                        </label>
                        <select
                            value={filterForm.equipment_type_id}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    equipment_type_id: e.target.value,
                                }))
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                        >
                            <option value="">All Types</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Supplier
                        </label>
                        <select
                            value={filterForm.supplier_id}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    supplier_id: e.target.value,
                                }))
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full bg-white"
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Serial Number
                        </label>
                        <input
                            type="text"
                            value={filterForm.serial_number}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    serial_number: e.target.value,
                                }))
                            }
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleFilter()
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full"
                            placeholder="Starts with..."
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                        {filtering
                            ? "Filtering..."
                            : `${equipment.length} record${
                                  equipment.length !== 1 ? "s" : ""
                              } found`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            disabled={filtering}
                            className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors px-3 py-1.5"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleFilter}
                            disabled={filtering}
                            className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            {equipment.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Laptop size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No equipment records yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">Type</TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">Brand</TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">Model</TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Serial No.
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Supplier
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">
                                    Condition
                                </TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">Status</TableHead>
                                <TableHead className="px-4 py-3 h-auto font-normal text-inherit">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100">
                            {equipment.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="border-0 hover:bg-gray-50 transition-colors"
                                >
                                    <TableCell className="px-4 py-3 text-gray-500">
                                        <Laptop size={16} />
                                    </TableCell>
                                    <TableCell className="px-4 py-3 font-medium text-gray-800">
                                        {item.brand?.name}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-600">
                                        {item.model?.name}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-600 font-mono">
                                        {item.serial_number}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-600">
                                        {item.delivery?.supplier?.name || "—"}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <ConditionBadge condition={item.condition} />
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        {item.status === "Assigned" && holderLabel(item.current_assignment) ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <StatusBadge status={item.status} />
                                                </TooltipTrigger>
                                                <TooltipContent side="top" align="end">
                                                    {holderLabel(item.current_assignment)}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <StatusBadge status={item.status} />
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 flex items-center gap-3">
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/equipment/${item.id}`
                                                )
                                            }
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="View"
                                        >
                                            <FileSearch size={15} />
                                        </button>
                                        {user.role_id === 1 && (
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/equipment/${item.id}/edit`
                                                    )
                                                }
                                                className="text-amber-600 hover:text-amber-800 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
