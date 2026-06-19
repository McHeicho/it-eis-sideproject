import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import AppDialog from "@/components/ui/AppDialog";

const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const errorClass = "text-red-500 text-xs mt-1";

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
        office_filter: "HO",
        holderType: "employee",
        date_assigned: new Date().toISOString().split("T")[0],
        notes: "",
    });
    const [assignErrors, setAssignErrors] = useState({});
    const [assigning, setAssigning] = useState(false);
    const [lostOnly, setLostOnly] = useState(
        preselectedEquipment?.status === "Lost/Missing"
    );
    const [lostEquipment, setLostEquipment] = useState([]);
    const [loadingLost, setLoadingLost] = useState(false);
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
        if (assignForm.office_filter === "HO" && e.home_office_tag !== "HO")
            return false;
        if (assignForm.office_filter === "EXT" && e.home_office_tag === "HO")
            return false;
        if (noLaptopOnly && employeeIdsWithLaptop.has(e.id)) return false;
        return true;
    });

    const sortedBranches = [...branches].sort((a, b) =>
        a.branch_name.localeCompare(b.branch_name)
    );

    const fetchLostEquipment = async () => {
        setLoadingLost(true);
        setLostEquipment([]);
        try {
            const res = await api.get("/equipment", {
                params: { status: "Lost/Missing" },
            });
            setLostEquipment(res.data);
        } catch (error) {
            console.error("Failed to fetch lost equipment:", error);
        } finally {
            setLoadingLost(false);
        }
    };

    // Opened via the table's per-row action on a Lost/Missing item — the
    // checkbox's own onChange only fires on a manual toggle, so the lost
    // list needs loading explicitly here.
    useEffect(() => {
        if (preselectedEquipment?.status === "Lost/Missing") {
            fetchLostEquipment();
        }
    }, []);

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
            await onAssigned();
            onClose();
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
            onOpenChange={(o) => { if (!o) onClose(); }}
            title="Assign Equipment"
            footer={
                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="assign-form"
                        disabled={assigning}
                        className="bg-green-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {assigning ? "Assigning..." : "Confirm Assignment"}
                    </button>
                </div>
            }
        >
            <form id="assign-form" onSubmit={handleAssign}>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className={labelClass}>Equipment</label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={lostOnly}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setLostOnly(checked);
                                        setAssignForm({
                                            ...assignForm,
                                            equipment_id: "",
                                        });
                                        if (checked) fetchLostEquipment();
                                        else setLostEquipment([]);
                                    }}
                                />
                                Show Lost/Missing only
                            </label>
                        </div>
                        <select
                            value={assignForm.equipment_id}
                            onChange={(e) =>
                                setAssignForm({
                                    ...assignForm,
                                    equipment_id: e.target.value,
                                })
                            }
                            disabled={loadingLost}
                            className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                        >
                            <option value="">
                                {loadingLost
                                    ? "Loading..."
                                    : "Select Equipment"}
                            </option>
                            {(lostOnly
                                ? lostEquipment
                                : availableEquipment
                            ).map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                    {eq.brand?.name} {eq.model?.name} —{" "}
                                    {eq.serial_number} ({eq.status})
                                </option>
                            ))}
                        </select>
                        {assignErrors.equipment_id && (
                            <p className={errorClass}>
                                {assignErrors.equipment_id[0]}
                            </p>
                        )}
                    </div>

                    {/* Holder Type Toggle */}
                    <div className="flex gap-4">
                        <div>
                            <label className={labelClass}>Assign To</label>
                            <div className="flex rounded overflow-hidden border border-gray-200 w-fit">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAssignForm({
                                            ...assignForm,
                                            holderType: "employee",
                                            branch_id: "",
                                        })
                                    }
                                    className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                                        assignForm.holderType === "employee"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Employee
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAssignForm({
                                            ...assignForm,
                                            holderType: "branch",
                                            employee_id: "",
                                            department_tag: "",
                                            office_filter: "HO",
                                        })
                                    }
                                    className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                                        assignForm.holderType === "branch"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Branch
                                </button>
                            </div>
                        </div>

                        {assignForm.holderType === "employee" && (
                            <div>
                                <label className={labelClass}>Office</label>
                                <div className="flex rounded overflow-hidden border border-gray-200 w-fit">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAssignForm({
                                                ...assignForm,
                                                office_filter: "HO",
                                                employee_id: "",
                                            })
                                        }
                                        className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                                            assignForm.office_filter ===
                                            "HO"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        Head Office
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAssignForm({
                                                ...assignForm,
                                                office_filter: "EXT",
                                                employee_id: "",
                                            })
                                        }
                                        className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                                            assignForm.office_filter ===
                                            "EXT"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        Extension Office
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {assignForm.holderType === "employee" ? (
                        <>
                            <div>
                                <label className={labelClass}>
                                    Department
                                </label>
                                <select
                                    value={assignForm.department_tag}
                                    onChange={(e) =>
                                        setAssignForm({
                                            ...assignForm,
                                            department_tag: e.target.value,
                                            employee_id: "",
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="">
                                        All Departments
                                    </option>
                                    {departments.map((dept) => (
                                        <option
                                            key={dept.id}
                                            value={dept.tag}
                                        >
                                            {dept.name} ({dept.tag})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className={labelClass}>
                                        Employee
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={noLaptopOnly}
                                            onChange={(e) => {
                                                setNoLaptopOnly(
                                                    e.target.checked
                                                );
                                                setAssignForm({
                                                    ...assignForm,
                                                    employee_id: "",
                                                });
                                            }}
                                        />
                                        No laptop assigned
                                    </label>
                                </div>
                                <select
                                    value={assignForm.employee_id}
                                    onChange={(e) =>
                                        setAssignForm({
                                            ...assignForm,
                                            employee_id: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option value="">
                                        Select Employee
                                    </option>
                                    {filteredEmployees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.department_tag}
                                            )
                                        </option>
                                    ))}
                                </select>
                                {assignErrors.employee_id && (
                                    <p className={errorClass}>
                                        {assignErrors.employee_id[0]}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={assignForm.branch_id}
                                onChange={(e) =>
                                    setAssignForm({
                                        ...assignForm,
                                        branch_id: e.target.value,
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="">Select Branch</option>
                                {sortedBranches.map((branch) => (
                                    <option
                                        key={branch.id}
                                        value={branch.id}
                                    >
                                        {branch.branch_name} (
                                        {branch.branch_code})
                                    </option>
                                ))}
                            </select>
                            {assignErrors.branch_id && (
                                <p className={errorClass}>
                                    {assignErrors.branch_id[0]}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Date Assigned</label>
                        <input
                            type="date"
                            value={assignForm.date_assigned}
                            onChange={(e) =>
                                setAssignForm({
                                    ...assignForm,
                                    date_assigned: e.target.value,
                                })
                            }
                            className={inputClass}
                        />
                        {assignErrors.date_assigned && (
                            <p className={errorClass}>
                                {assignErrors.date_assigned[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Notes</label>
                        <textarea
                            value={assignForm.notes}
                            onChange={(e) =>
                                setAssignForm({
                                    ...assignForm,
                                    notes: e.target.value,
                                })
                            }
                            className={`${inputClass} resize-none`}
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
