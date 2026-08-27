import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import api from "@/api/axios";
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/custom/custom-button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/custom/custom-select";

// Employees are only ever based at Head Office or Manila Office — the two
// rows in branches whose code is HO or MLA, never the full branch list.
const ALLOWED_BRANCH_CODES = ["HO", "MLA"];

// Sentinels for the Selects below — Radix throws on an empty-string item
// value, so these stand in for "" at the component boundary and get
// translated back in each onValueChange/handleRowChange call.
const DEPT_ALL = "all";
const DEPT_NONE = "none";
const BRANCH_NONE = "none";

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
                <Field>
                    <FieldLabel htmlFor="employee-department-filter">
                        Filter by Department
                    </FieldLabel>
                    <Select
                        value={selectedDeptTag || DEPT_ALL}
                        onValueChange={(value) => {
                            setSelectedDeptTag(value === DEPT_ALL ? "" : value);
                            setSuccess(false);
                            if (isEditing) handleCancel();
                        }}
                        disabled={isEditing}
                    >
                        <SelectTrigger id="employee-department-filter" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={DEPT_ALL}>Show All</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.tag}>
                                    {dept.name} ({dept.tag})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

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
                        <Field>
                            <FieldLabel htmlFor="employee-name">Name</FieldLabel>
                            <Input
                                id="employee-name"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Juan dela Cruz"
                            />
                            {errors.name && (
                                <FieldError>
                                    {errors.name[0]}
                                </FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="employee-department">Department</FieldLabel>
                            <Select
                                value={form.department_tag || DEPT_NONE}
                                onValueChange={(value) => {
                                    setForm({
                                        ...form,
                                        department_tag:
                                            value === DEPT_NONE ? "" : value,
                                    });
                                    setErrors({ ...errors, department_tag: "" });
                                }}
                            >
                                <SelectTrigger
                                    id="employee-department"
                                    className="w-full"
                                    aria-invalid={!!errors.department_tag}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={DEPT_NONE}>
                                        Select Department
                                    </SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.tag}>
                                            {dept.name} ({dept.tag})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.department_tag && (
                                <FieldError>
                                    {errors.department_tag[0]}
                                </FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="employee-branch">Branch</FieldLabel>
                            <Select
                                value={String(form.branch_id || BRANCH_NONE)}
                                onValueChange={(value) => {
                                    setForm({
                                        ...form,
                                        branch_id:
                                            value === BRANCH_NONE ? "" : value,
                                    });
                                    setErrors({ ...errors, branch_id: "" });
                                }}
                            >
                                <SelectTrigger
                                    id="employee-branch"
                                    className="w-full"
                                    aria-invalid={!!errors.branch_id}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.branch_name} ({branch.branch_code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.branch_id && (
                                <FieldError>
                                    {errors.branch_id[0]}
                                </FieldError>
                            )}
                        </Field>

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
                    <Table className="table-fixed">
                        <TableHeader className="text-xs uppercase text-gray-500 border-b">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[8%]">#</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[32%]">Name</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[35%]">
                                    Department
                                </TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[25%]">Branch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {editRows.map((row, index) => (
                                <TableRow key={row.id} className="border-0 hover:bg-transparent">
                                    <TableCell className="py-2 px-0 align-top text-xs text-gray-400 pr-2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top pr-2">
                                        <Field>
                                            <Input
                                                id={`employee-name-${index}`}
                                                type="text"
                                                value={row.name}
                                                onChange={(e) =>
                                                    handleRowChange(
                                                        index,
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                aria-invalid={!!rowErrors[index]?.name}
                                                aria-label="Employee name"
                                                placeholder="Employee name"
                                            />
                                            {rowErrors[index]?.name && (
                                                <FieldError>
                                                    {rowErrors[index].name}
                                                </FieldError>
                                            )}
                                        </Field>
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top">
                                        <Field>
                                            <Select
                                                value={row.department_tag || DEPT_NONE}
                                                onValueChange={(value) =>
                                                    handleRowChange(
                                                        index,
                                                        "department_tag",
                                                        value === DEPT_NONE
                                                            ? ""
                                                            : value
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className="w-full"
                                                    aria-invalid={
                                                        !!rowErrors[index]?.department_tag
                                                    }
                                                    aria-label="Department"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={DEPT_NONE}>
                                                        Select Department
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
                                            {rowErrors[index]
                                                ?.department_tag && (
                                                <FieldError>
                                                    {
                                                        rowErrors[index]
                                                            .department_tag
                                                    }
                                                </FieldError>
                                            )}
                                        </Field>
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top pl-2">
                                        <Field>
                                            <Select
                                                value={String(
                                                    row.branch_id || BRANCH_NONE
                                                )}
                                                onValueChange={(value) =>
                                                    handleRowChange(
                                                        index,
                                                        "branch_id",
                                                        value === BRANCH_NONE
                                                            ? ""
                                                            : value
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className="w-full"
                                                    aria-invalid={
                                                        !!rowErrors[index]?.branch_id
                                                    }
                                                    aria-label="Branch"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {branches.map((branch) => (
                                                        <SelectItem
                                                            key={branch.id}
                                                            value={String(
                                                                branch.id
                                                            )}
                                                        >
                                                            {branch.branch_name} (
                                                            {branch.branch_code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {rowErrors[index]
                                                ?.branch_id && (
                                                <FieldError>
                                                    {
                                                        rowErrors[index]
                                                            .branch_id
                                                    }
                                                </FieldError>
                                            )}
                                        </Field>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Table className="table-fixed">
                        <TableHeader className="text-xs uppercase text-gray-500 border-b">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[8%]">#</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[32%]">Name</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[35%]">
                                    Department
                                </TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[25%]">Branch</TableHead>
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
                                    <TableCell
                                        className="py-2 px-0 text-gray-800 truncate"
                                        title={emp.name}
                                    >
                                        {emp.name}
                                    </TableCell>
                                    <TableCell
                                        className="py-2 px-0 text-gray-500 text-xs truncate"
                                        title={`${emp.department?.name || ""} (${emp.department_tag})`}
                                    >
                                        {emp.department?.name} (
                                        {emp.department_tag})
                                    </TableCell>
                                    <TableCell
                                        className="py-2 px-0 text-gray-500 text-xs truncate"
                                        title={`${emp.branch?.branch_name || ""} (${emp.branch?.branch_code || ""})`}
                                    >
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
