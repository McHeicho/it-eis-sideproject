import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import api from "@/api/axios";
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/custom/custom-button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// Employees are only ever based at Head Office or Manila Office — the two
// rows in branches whose code is HO or MLA, never the full branch list.
const ALLOWED_BRANCH_CODES = ["HO", "MLA"];

const defaultBranchId = (branches) =>
    branches.find((b) => b.branch_code === "HO")?.id ?? "";

export default function ManageEmployeesModal({ onClose }) {
    const queryClient = useQueryClient();

    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeptTag, setSelectedDeptTag] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: "",
        department_tag: "",
        branch_id: "",
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    // Inline edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editRows, setEditRows] = useState([]);
    const [rowErrors, setRowErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [employeesRes, departmentsRes, branchesRes] = await Promise.all([
                    api.get("/employees"),
                    api.get("/departments"),
                    api.get("/branches"),
                ]);
                setEmployees(employeesRes.data);
                setDepartments(departmentsRes.data);
                const allowedBranches = branchesRes.data.filter((b) =>
                    ALLOWED_BRANCH_CODES.includes(b.branch_code)
                );
                setBranches(allowedBranches);
                setForm((f) => ({
                    ...f,
                    branch_id: defaultBranchId(allowedBranches),
                }));
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchEmployees = async () => {
        const res = await api.get("/employees");
        setEmployees(res.data);
    };

    const filteredEmployees = selectedDeptTag
        ? employees.filter((e) => e.department_tag === selectedDeptTag)
        : employees;

    const invalidateMaintenanceData = () => {
        ["lookups", "employees", "assignments", "equipment", "deliveries"]
            .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    };

    const addEmployeeMutation = useMutation({
        mutationFn: (payload) => api.post("/employees", payload),
        onSuccess: async () => {
            await fetchEmployees();
            invalidateMaintenanceData();
        },
    });

    const saveAllMutation = useMutation({
        mutationFn: (rows) =>
            Promise.all(
                rows.map((row) =>
                    api.put(`/employees/${row.id}`, {
                        name: row.name,
                        department_tag: row.department_tag,
                        branch_id: row.branch_id,
                    })
                )
            ),
        onSuccess: async () => {
            await fetchEmployees();
            invalidateMaintenanceData();
        },
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            await addEmployeeMutation.mutateAsync(form);
            setForm({
                name: "",
                department_tag: "",
                branch_id: defaultBranchId(branches),
            });
            setSuccess(true);
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            }
        }
    };

    // Enter edit mode
    const handleEditClick = () => {
        setEditRows(
            filteredEmployees.map((e) => ({
                id: e.id,
                name: e.name,
                department_tag: e.department_tag,
                branch_id: e.branch_id,
            }))
        );
        setRowErrors({});
        setIsEditing(true);
        setShowForm(false);
        setSuccess(false);
    };

    // Validate rows
    const validate = () => {
        const newErrors = {};
        editRows.forEach((row, index) => {
            const rowErr = {};
            if (!row.name.trim()) rowErr.name = "This field is required.";
            if (!row.department_tag)
                rowErr.department_tag = "This field is required.";
            if (!row.branch_id)
                rowErr.branch_id = "This field is required.";
            if (Object.keys(rowErr).length > 0) newErrors[index] = rowErr;
        });
        return newErrors;
    };

    // Save all rows
    const handleSaveAll = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setRowErrors(validationErrors);
            return;
        }
        try {
            await saveAllMutation.mutateAsync(editRows);
            setIsEditing(false);
            setSuccess(true);
        } catch (error) {
            console.error("Failed to save employees:", error);
        }
    };

    // Cancel edit
    const handleCancel = () => {
        setEditRows([]);
        setRowErrors({});
        setIsEditing(false);
    };

    const handleRowChange = (index, field, value) => {
        setEditRows(editRows.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        ));
        if (rowErrors[index]) {
            const updatedErrors = { ...rowErrors };
            updatedErrors[index] = { ...updatedErrors[index] };
            delete updatedErrors[index][field];
            if (Object.keys(updatedErrors[index]).length === 0) {
                delete updatedErrors[index];
            }
            setRowErrors(updatedErrors);
        }
    };

    const inputClass =
        "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const errorInputClass =
        "w-full border border-red-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const errorClass = "text-red-500 text-xs mt-1";

    return (
        <AppDialog
            open
            onOpenChange={(o) => { if (!o) onClose(); }}
            title="Employees"
            size="lg"
            dismissible={!isEditing}
            footer={
                isEditing ? (
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAll} disabled={saveAllMutation.isPending}>
                            {saveAllMutation.isPending ? "Saving..." : "Save All"}
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )
            }
        >
            <div className="space-y-4">
                {/* Department Filter */}
                <div>
                    <label className={labelClass}>
                        Filter by Department
                    </label>
                    <select
                        value={selectedDeptTag}
                        onChange={(e) => {
                            setSelectedDeptTag(e.target.value);
                            setSuccess(false);
                            if (isEditing) handleCancel();
                        }}
                        disabled={isEditing}
                        className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                    >
                        <option value="">Show All</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.tag}>
                                {dept.name} ({dept.tag})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                {!isEditing && (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setShowForm(!showForm);
                                setSuccess(false);
                            }}
                        >
                            <Plus size={14} />
                            Add
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleEditClick}
                            disabled={filteredEmployees.length === 0}
                            className="bg-amber-500 text-white hover:bg-amber-600"
                        >
                            <Pencil size={14} />
                            Edit
                        </Button>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded">
                        {isEditing
                            ? "Employees updated successfully!"
                            : "Employee added successfully!"}
                    </div>
                )}

                {/* Add Form */}
                {showForm && !isEditing && (<>
                    <Separator className="my-4" />
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-3"
                    >
                        <div>
                            <label className={labelClass}>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. Juan dela Cruz"
                            />
                            {errors.name && (
                                <p className={errorClass}>
                                    {errors.name[0]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>Department</label>
                            <select
                                name="department_tag"
                                value={form.department_tag}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.tag}>
                                        {dept.name} ({dept.tag})
                                    </option>
                                ))}
                            </select>
                            {errors.department_tag && (
                                <p className={errorClass}>
                                    {errors.department_tag[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                name="branch_id"
                                value={form.branch_id}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                {branches.map((branch) => (
                                    <option
                                        key={branch.id}
                                        value={branch.id}
                                    >
                                        {branch.branch_name} ({branch.branch_code})
                                    </option>
                                ))}
                            </select>
                            {errors.branch_id && (
                                <p className={errorClass}>
                                    {errors.branch_id[0]}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button type="submit" disabled={addEmployeeMutation.isPending}>
                                {addEmployeeMutation.isPending ? "Saving..." : "Save Employee"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowForm(false);
                                    setErrors({});
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </>)}

                {/* Employees Table */}
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="skeleton h-3 w-32 rounded"></div>
                                <div className="skeleton h-3 w-24 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : isEditing ? (
                    <Table>
                        <TableHeader className="text-xs uppercase text-gray-500 border-b">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">#</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Name</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">
                                    Department
                                </TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Branch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {editRows.map((row, index) => (
                                <TableRow key={row.id} className="border-0 hover:bg-transparent">
                                    <TableCell className="py-2 px-0 align-top text-xs text-gray-400 pr-2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top pr-2">
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) =>
                                                handleRowChange(
                                                    index,
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                            className={
                                                rowErrors[index]?.name
                                                    ? errorInputClass
                                                    : inputClass
                                            }
                                            placeholder="Employee name"
                                        />
                                        {rowErrors[index]?.name && (
                                            <p className={errorClass}>
                                                {rowErrors[index].name}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top">
                                        <select
                                            value={row.department_tag}
                                            onChange={(e) =>
                                                handleRowChange(
                                                    index,
                                                    "department_tag",
                                                    e.target.value
                                                )
                                            }
                                            className={
                                                rowErrors[index]
                                                    ?.department_tag
                                                    ? errorInputClass
                                                    : inputClass
                                            }
                                        >
                                            <option value="">
                                                Select Department
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
                                        {rowErrors[index]
                                            ?.department_tag && (
                                            <p className={errorClass}>
                                                {
                                                    rowErrors[index]
                                                        .department_tag
                                                }
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top pl-2">
                                        <select
                                            value={row.branch_id}
                                            onChange={(e) =>
                                                handleRowChange(
                                                    index,
                                                    "branch_id",
                                                    e.target.value
                                                )
                                            }
                                            className={
                                                rowErrors[index]
                                                    ?.branch_id
                                                    ? errorInputClass
                                                    : inputClass
                                            }
                                        >
                                            {branches.map((branch) => (
                                                <option
                                                    key={branch.id}
                                                    value={branch.id}
                                                >
                                                    {branch.branch_name} (
                                                    {branch.branch_code})
                                                </option>
                                            ))}
                                        </select>
                                        {rowErrors[index]
                                            ?.branch_id && (
                                            <p className={errorClass}>
                                                {
                                                    rowErrors[index]
                                                        .branch_id
                                                }
                                            </p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHeader className="text-xs uppercase text-gray-500 border-b">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">#</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Name</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">
                                    Department
                                </TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Branch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {filteredEmployees.map((emp, index) => (
                                <TableRow
                                    key={emp.id}
                                    className="border-0 hover:bg-gray-50"
                                >
                                    <TableCell className="py-2 px-0 text-xs text-gray-400">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 text-gray-800">
                                        {emp.name}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 text-gray-500 text-xs">
                                        {emp.department?.name} (
                                        {emp.department_tag})
                                    </TableCell>
                                    <TableCell className="py-2 px-0 text-gray-500 text-xs">
                                        {emp.branch?.branch_name} (
                                        {emp.branch?.branch_code})
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableCell
                                        colSpan={4}
                                        className="py-4 px-0 text-center text-gray-400 text-xs"
                                    >
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </AppDialog>
    );
}
