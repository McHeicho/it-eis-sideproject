import React, { useState } from "react";
import { useEquipmentList } from "@/queries/useEquipmentList";
import { sortBranches } from "@/lib/branches";
import api from "@/api/axios";
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/custom/custom-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/custom/custom-toggle-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/custom/custom-select";
import { toast } from "sonner";

const errorClass = "text-red-500 text-xs mt-1";

const LOST_EQUIPMENT_FILTERS = {
    status: "Lost/Missing",
    condition: "",
    equipment_type_id: "",
    supplier_id: "",
    serial_number: "",
};

// Sentinels for Select/ToggleGroup fields where "" is a meaningful state that
// must stay re-selectable — Radix throws on an empty-string item value, so
// these stand in for "" at the component boundary and get translated back in
// the change handler. DEPARTMENT_ALL/OFFICE_ALL are "no filter"; EQUIPMENT_NONE/
// EMPLOYEE_NONE are "nothing chosen yet", kept selectable so the dropdown can
// be reset without going through the Lost/Missing or No-laptop checkboxes.
const DEPARTMENT_ALL = "all";
const OFFICE_ALL = "all";
const EQUIPMENT_NONE = "none";
const EMPLOYEE_NONE = "none";

// Overrides ToggleGroup's default merged-pill corner radius (rounded-2xl) down
// to a squared-off box, for the Assign To / Office toggles specifically —
// matches these two modifier chains exactly so the tailwind-merge in cn()
// replaces rather than stacks with the component's own classes.
const TOGGLE_GROUP_BOX_CLASS =
    "data-[spacing=0]:data-[variant=outline]:rounded-md";
const TOGGLE_ITEM_BOX_CLASS =
    "rounded-md group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-md group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-md";

export default function AssignmentAssignModal({
    equipment,
    assignments,
    employees,
    departments,
    branches,
    preselectedEquipment,
    onClose,
    onAssigned,
}) {
    const [assignForm, setAssignForm] = useState({
        equipment_id: preselectedEquipment
            ? String(preselectedEquipment.id)
            : "",
        employee_id: "",
        branch_id: "",
        department_tag: "",
        // Narrows the employee list by where the employee is based. Holds a
        // branch id as a string; "" means all offices.
        office_filter: "",
        holderType: "employee",
        date_assigned: new Date().toISOString().split("T")[0],
        notes: "",
    });
    const [assignErrors, setAssignErrors] = useState({});
    const [assigning, setAssigning] = useState(false);
    const [lostOnly, setLostOnly] = useState(
        preselectedEquipment?.status === "Lost/Missing"
    );
    const {
        data: lostEquipment = [],
        isFetching: loadingLost,
    } = useEquipmentList(LOST_EQUIPMENT_FILTERS, { enabled: lostOnly });
    const [noLaptopOnly, setNoLaptopOnly] = useState(false);

    const availableEquipment = equipment.filter(
        (e) => e.status === "Available" || e.status === "Spare Unit"
    );

    const laptopIds = new Set(
        equipment.filter((e) => e.type?.name === "Laptop").map((e) => e.id)
    );

    const employeeIdsWithLaptop = new Set(
        assignments
            .filter((a) => !a.date_returned && laptopIds.has(a.equipment_id))
            .map((a) => a.employee_id)
    );

    const filteredEmployees = employees.filter((e) => {
        if (
            assignForm.department_tag &&
            e.department_tag !== assignForm.department_tag
        )
            return false;
        if (
            assignForm.office_filter &&
            String(e.branch_id) !== assignForm.office_filter
        )
            return false;
        if (noLaptopOnly && employeeIdsWithLaptop.has(e.id)) return false;
        return true;
    });

    const sortedBranches = sortBranches(branches);

    // The two offices an employee can be based at. Labels come from the branch
    // rows so a rename in ManageBranchesModal carries through; matching on code
    // is stable because branch_code is locked server-side for these two.
    const officeBranches = ["HO", "MLA"]
        .map((code) => branches.find((b) => b.branch_code === code))
        .filter(Boolean);

    const handleAssign = async (e) => {
        e.preventDefault();
        setAssigning(true);
        setAssignErrors({});
        try {
            const payload = {
                equipment_id: assignForm.equipment_id,
                date_assigned: assignForm.date_assigned,
                notes: assignForm.notes,
            };
            if (assignForm.holderType === "branch") {
                payload.branch_id = assignForm.branch_id;
            } else {
                payload.employee_id = assignForm.employee_id;
            }
            await api.post("/assignments", payload);
            // onAssigned() triggers the parent's invalidateAssignmentData now —
            // cleanup #6 landed as TanStack Query, not the originally-planned
            // Zustand store. Toast stays decoupled from this line, keyed to
            // dismissal, so it wasn't affected by the refresh swap.
            await onAssigned();
            onClose();
            toast.success("Equipment assigned");
        } catch (error) {
            if (error.response?.status === 422) {
                setAssignErrors(error.response.data.errors);
            } else {
                console.error("Failed to assign:", error);
            }
        } finally {
            setAssigning(false);
        }
    };

    return (
        <AppDialog
            open
            onOpenChange={(o) => {
                if (!o) onClose();
            }}
            title="Assign Equipment"
            footer={
                <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="assign-form"
                        disabled={assigning}
                    >
                        {assigning ? "Assigning..." : "Confirm Assignment"}
                    </Button>
                </div>
            }
        >
            <form id="assign-form" onSubmit={handleAssign}>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label htmlFor="equipment_id">Equipment</Label>
                            <div className="flex items-center gap-1.5">
                                <Checkbox
                                    id="lost-only"
                                    checked={lostOnly}
                                    onCheckedChange={(checked) => {
                                        setLostOnly(checked);
                                        setAssignForm({
                                            ...assignForm,
                                            equipment_id: "",
                                        });
                                    }}
                                />
                                <Label
                                    htmlFor="lost-only"
                                    className="text-xs font-normal text-gray-500 cursor-pointer"
                                >
                                    Show Lost/Missing only
                                </Label>
                            </div>
                        </div>
                        <Select
                            value={assignForm.equipment_id || EQUIPMENT_NONE}
                            onValueChange={(value) =>
                                setAssignForm({
                                    ...assignForm,
                                    equipment_id:
                                        value === EQUIPMENT_NONE ? "" : value,
                                })
                            }
                            disabled={loadingLost}
                        >
                            <SelectTrigger id="equipment_id" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={EQUIPMENT_NONE}>
                                    {loadingLost
                                        ? "Loading..."
                                        : "Select Equipment"}
                                </SelectItem>
                                {(lostOnly
                                    ? lostEquipment
                                    : availableEquipment
                                ).map((eq) => (
                                    <SelectItem
                                        key={eq.id}
                                        value={String(eq.id)}
                                    >
                                        {eq.brand?.name} {eq.model?.name} —{" "}
                                        {eq.serial_number} ({eq.status})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {assignErrors.equipment_id && (
                            <p className={errorClass}>
                                {assignErrors.equipment_id[0]}
                            </p>
                        )}
                    </div>

                    {/* Holder Type Toggle */}
                    <div className="flex gap-4">
                        <div>
                            <Label className="mb-1">Assign To</Label>
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                spacing={0}
                                className={TOGGLE_GROUP_BOX_CLASS}
                                value={assignForm.holderType}
                                onValueChange={(value) => {
                                    if (!value) return; // deselect-click on the active item — ignore
                                    setAssignForm({
                                        ...assignForm,
                                        holderType: value,
                                        ...(value === "branch"
                                            ? {
                                                  employee_id: "",
                                                  department_tag: "",
                                                  office_filter: "",
                                              }
                                            : { branch_id: "" }),
                                    });
                                }}
                            >
                                <ToggleGroupItem
                                    value="employee"
                                    className={TOGGLE_ITEM_BOX_CLASS}
                                >
                                    Employee
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="branch"
                                    className={TOGGLE_ITEM_BOX_CLASS}
                                >
                                    Branch
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        {assignForm.holderType === "employee" && (
                            <div>
                                <Label className="mb-1">Office</Label>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    spacing={0}
                                    className={TOGGLE_GROUP_BOX_CLASS}
                                    value={assignForm.office_filter || OFFICE_ALL}
                                    onValueChange={(value) => {
                                        if (!value) return; // same deselect guard, applied uniformly
                                        setAssignForm({
                                            ...assignForm,
                                            office_filter:
                                                value === OFFICE_ALL
                                                    ? ""
                                                    : value,
                                            employee_id: "",
                                        });
                                    }}
                                >
                                    <ToggleGroupItem
                                        value={OFFICE_ALL}
                                        className={TOGGLE_ITEM_BOX_CLASS}
                                    >
                                        All
                                    </ToggleGroupItem>
                                    {officeBranches.map((b) => (
                                        <ToggleGroupItem
                                            key={b.id}
                                            value={String(b.id)}
                                            className={TOGGLE_ITEM_BOX_CLASS}
                                        >
                                            {b.branch_name}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                        )}
                    </div>

                    {assignForm.holderType === "employee" ? (
                        <>
                            <div>
                                <Label htmlFor="department_tag" className="mb-1">
                                    Department
                                </Label>
                                <Select
                                    value={
                                        assignForm.department_tag ||
                                        DEPARTMENT_ALL
                                    }
                                    onValueChange={(value) =>
                                        setAssignForm({
                                            ...assignForm,
                                            department_tag:
                                                value === DEPARTMENT_ALL
                                                    ? ""
                                                    : value,
                                            employee_id: "",
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="department_tag"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={DEPARTMENT_ALL}>
                                            All Departments
                                        </SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem
                                                key={dept.id}
                                                value={dept.tag}
                                            >
                                                {dept.name} ({dept.tag})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label htmlFor="employee_id">
                                        Employee
                                    </Label>
                                    <div className="flex items-center gap-1.5">
                                        <Checkbox
                                            id="no-laptop-only"
                                            checked={noLaptopOnly}
                                            onCheckedChange={(checked) => {
                                                setNoLaptopOnly(checked);
                                                setAssignForm({
                                                    ...assignForm,
                                                    employee_id: "",
                                                });
                                            }}
                                        />
                                        <Label
                                            htmlFor="no-laptop-only"
                                            className="text-xs font-normal text-gray-500 cursor-pointer"
                                        >
                                            No laptop assigned
                                        </Label>
                                    </div>
                                </div>
                                <Select
                                    value={
                                        assignForm.employee_id ||
                                        EMPLOYEE_NONE
                                    }
                                    onValueChange={(value) =>
                                        setAssignForm({
                                            ...assignForm,
                                            employee_id:
                                                value === EMPLOYEE_NONE
                                                    ? ""
                                                    : value,
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="employee_id"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={EMPLOYEE_NONE}>
                                            Select Employee
                                        </SelectItem>
                                        {filteredEmployees.map((emp) => (
                                            <SelectItem
                                                key={emp.id}
                                                value={String(emp.id)}
                                            >
                                                {emp.name} (
                                                {emp.department_tag})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {assignErrors.employee_id && (
                                    <p className={errorClass}>
                                        {assignErrors.employee_id[0]}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div>
                            <Label htmlFor="branch_id" className="mb-1">
                                Branch
                            </Label>
                            <Select
                                value={assignForm.branch_id}
                                onValueChange={(value) =>
                                    setAssignForm({
                                        ...assignForm,
                                        branch_id: value,
                                    })
                                }
                            >
                                <SelectTrigger id="branch_id" className="w-full">
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedBranches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.branch_name} (
                                            {branch.branch_code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {assignErrors.branch_id && (
                                <p className={errorClass}>
                                    {assignErrors.branch_id[0]}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="date_assigned" className="mb-1">
                            Date Assigned
                        </Label>
                        <Input
                            id="date_assigned"
                            type="date"
                            value={assignForm.date_assigned}
                            onChange={(e) =>
                                setAssignForm({
                                    ...assignForm,
                                    date_assigned: e.target.value,
                                })
                            }
                        />
                        {assignErrors.date_assigned && (
                            <p className={errorClass}>
                                {assignErrors.date_assigned[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="notes" className="mb-1">
                            Notes
                        </Label>
                        <Textarea
                            id="notes"
                            value={assignForm.notes}
                            onChange={(e) =>
                                setAssignForm({
                                    ...assignForm,
                                    notes: e.target.value,
                                })
                            }
                            rows={3}
                            placeholder="Optional notes..."
                        />
                    </div>

                    {assignErrors.general && (
                        <p className="text-red-500 text-xs">
                            {assignErrors.general[0]}
                        </p>
                    )}
                </div>
            </form>
        </AppDialog>
    );
}
