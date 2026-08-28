import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Laptop, FileSearch, Pencil } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/custom/custom-button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import StatusBadge from "@/components/ui/StatusBadge";
import ConditionBadge from "@/components/ui/ConditionBadge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLookups } from "@/queries/useLookups";
import { useEquipmentList } from "@/queries/useEquipmentList";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/custom/custom-select";

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

// Sentinels for the filter-bar Selects — Radix throws on an empty-string item
// value, so these stand in for "" ("All X") at the component boundary and get
// translated back in each onValueChange.
const STATUS_ALL = "all";
const CONDITION_ALL = "all";
const TYPE_ALL = "all";
const SUPPLIER_ALL = "all";

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
                <Button
                    variant="create"
                    size="lg"
                    onClick={() => navigate("/equipment/add")}
                >
                    <Plus size={16} />
                    Add Equipment
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Status
                        </label>
                        <Select
                            value={filterForm.status || STATUS_ALL}
                            onValueChange={(value) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    status: value === STATUS_ALL ? "" : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={STATUS_ALL}>
                                    All Statuses
                                </SelectItem>
                                {[
                                    "Available",
                                    "Assigned",
                                    "Under Repair",
                                    "Lost/Missing",
                                    "Retired/Disposed",
                                    "Spare Unit",
                                ].map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Condition
                        </label>
                        <Select
                            value={filterForm.condition || CONDITION_ALL}
                            onValueChange={(value) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    condition:
                                        value === CONDITION_ALL ? "" : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={CONDITION_ALL}>
                                    All Conditions
                                </SelectItem>
                                {["Good", "Defective"].map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Equipment Type
                        </label>
                        <Select
                            value={filterForm.equipment_type_id || TYPE_ALL}
                            onValueChange={(value) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    equipment_type_id:
                                        value === TYPE_ALL ? "" : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TYPE_ALL}>
                                    All Types
                                </SelectItem>
                                {types.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Supplier
                        </label>
                        <Select
                            value={filterForm.supplier_id || SUPPLIER_ALL}
                            onValueChange={(value) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    supplier_id:
                                        value === SUPPLIER_ALL ? "" : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SUPPLIER_ALL}>
                                    All Suppliers
                                </SelectItem>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500 hover:bg-transparent hover:text-gray-700"
                            onClick={handleReset}
                            disabled={filtering}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="create"
                            size="sm"
                            className="text-xs"
                            onClick={handleFilter}
                            disabled={filtering}
                        >
                            Filter
                        </Button>
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
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-blue-600 hover:bg-transparent hover:text-blue-800"
                                            onClick={() =>
                                                navigate(
                                                    `/equipment/${item.id}`
                                                )
                                            }
                                            title="View"
                                        >
                                            <FileSearch size={15} />
                                        </Button>
                                        {user.role_id === 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-amber-600 hover:bg-transparent hover:text-amber-800"
                                                onClick={() =>
                                                    navigate(
                                                        `/equipment/${item.id}/edit`
                                                    )
                                                }
                                                title="Edit"
                                            >
                                                <Pencil size={15} />
                                            </Button>
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
