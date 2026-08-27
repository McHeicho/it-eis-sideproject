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
import { sortBranches } from "@/lib/branches";

export default function ManageBranchesModal({ onClose }) {
    const queryClient = useQueryClient();

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        branch_code: "",
        branch_name: "",
        branch_manager: "",
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    // Inline edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editRows, setEditRows] = useState([]);
    const [rowErrors, setRowErrors] = useState({});

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await api.get("/branches");
            setBranches(sortBranches(response.data));
        } catch (error) {
            console.error("Failed to fetch branches:", error);
        } finally {
            setLoading(false);
        }
    };

    const invalidateMaintenanceData = () => {
        ["lookups", "employees", "assignments", "equipment", "deliveries"]
            .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    };

    const addBranchMutation = useMutation({
        mutationFn: (payload) => api.post("/branches", payload),
        onSuccess: async () => {
            await fetchBranches();
            invalidateMaintenanceData();
        },
    });

    const saveAllMutation = useMutation({
        mutationFn: (rows) =>
            Promise.all(
                rows.map((row) =>
                    api.put(`/branches/${row.id}`, {
                        branch_code: row.branch_code,
                        branch_name: row.branch_name,
                        branch_manager: row.branch_manager,
                    })
                )
            ),
        onSuccess: async () => {
            await fetchBranches();
            invalidateMaintenanceData();
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === "branch_code" ? value.toUpperCase() : value,
        });
        setErrors({ ...errors, [name]: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            await addBranchMutation.mutateAsync(form);
            setForm({ branch_code: "", branch_name: "", branch_manager: "" });
            setSuccess(true);
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error("Failed to save branch:", error);
            }
        }
    };

    // Enter edit mode
    const handleEditClick = () => {
        setEditRows(
            branches.map((b) => ({
                id: b.id,
                branch_code: b.branch_code,
                branch_name: b.branch_name,
                branch_manager: b.branch_manager || "",
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
        const codes = [];
        const names = [];

        editRows.forEach((row, index) => {
            const rowErr = {};

            if (!row.branch_code.trim()) {
                rowErr.branch_code = "This field is required.";
            }
            if (!row.branch_name.trim()) {
                rowErr.branch_name = "This field is required.";
            }

            const codeKey = row.branch_code.trim().toUpperCase();
            if (codes.includes(codeKey)) {
                rowErr.branch_code = "Duplicate field.";
            } else {
                codes.push(codeKey);
            }

            const nameKey = row.branch_name.trim().toLowerCase();
            if (names.includes(nameKey)) {
                rowErr.branch_name = "Duplicate field.";
            } else {
                names.push(nameKey);
            }

            if (Object.keys(rowErr).length > 0) {
                newErrors[index] = rowErr;
            }
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
            console.error("Failed to save branches:", error);
        }
    };

    // Cancel edit
    const handleCancel = () => {
        setEditRows([]);
        setRowErrors({});
        setIsEditing(false);
    };

    const handleRowChange = (index, field, value) => {
        const newValue = field === "branch_code" ? value.toUpperCase() : value;
        setEditRows(editRows.map((row, i) =>
            i === index ? { ...row, [field]: newValue } : row
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
            title="Branches"
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
                    <div className="flex justify-end w-full">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )
            }
        >
            <div className="space-y-4">
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
                            disabled={branches.length === 0}
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
                            ? "Branches updated successfully!"
                            : "Branch added successfully!"}
                    </div>
                )}

                {/* Branches Table */}
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="flex justify-between gap-4"
                            >
                                <div className="skeleton h-3 w-16 rounded"></div>
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
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Code</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Name</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">
                                    Manager
                                </TableHead>
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
                                                id={`branch-code-${index}`}
                                                type="text"
                                                value={row.branch_code}
                                                onChange={(e) =>
                                                    handleRowChange(
                                                        index,
                                                        "branch_code",
                                                        e.target.value
                                                    )
                                                }
                                                aria-invalid={
                                                    !!rowErrors[index]?.branch_code
                                                }
                                                aria-label="Branch code"
                                                placeholder="e.g. CEB01"
                                            />
                                            {rowErrors[index]
                                                ?.branch_code && (
                                                <FieldError>
                                                    {
                                                        rowErrors[index]
                                                            .branch_code
                                                    }
                                                </FieldError>
                                            )}
                                        </Field>
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top pr-2">
                                        <Field>
                                            <Input
                                                id={`branch-name-${index}`}
                                                type="text"
                                                value={row.branch_name}
                                                onChange={(e) =>
                                                    handleRowChange(
                                                        index,
                                                        "branch_name",
                                                        e.target.value
                                                    )
                                                }
                                                aria-invalid={
                                                    !!rowErrors[index]?.branch_name
                                                }
                                                aria-label="Branch name"
                                                placeholder="e.g. Cebu Branch"
                                            />
                                            {rowErrors[index]
                                                ?.branch_name && (
                                                <FieldError>
                                                    {
                                                        rowErrors[index]
                                                            .branch_name
                                                    }
                                                </FieldError>
                                            )}
                                        </Field>
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top">
                                        <Field>
                                            <Input
                                                id={`branch-manager-${index}`}
                                                type="text"
                                                value={row.branch_manager}
                                                onChange={(e) =>
                                                    handleRowChange(
                                                        index,
                                                        "branch_manager",
                                                        e.target.value
                                                    )
                                                }
                                                aria-label="Branch manager"
                                                placeholder="optional"
                                            />
                                        </Field>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHeader className="text-xs uppercase text-gray-500 border-b">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Code</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Name</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">
                                    Manager
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {branches.map((branch) => (
                                <TableRow
                                    key={branch.id}
                                    className="border-0 hover:bg-gray-50"
                                >
                                    <TableCell className="py-2 px-0 font-mono text-xs text-gray-600">
                                        {branch.branch_code}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 text-gray-800">
                                        {branch.branch_name}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 text-gray-500 text-xs">
                                        {branch.branch_manager || "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {branches.length === 0 && (
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableCell
                                        colSpan={3}
                                        className="py-4 px-0 text-center text-gray-400 text-xs"
                                    >
                                        No branches yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {/* Add Form */}
                {showForm && !isEditing && (<>
                    <Separator className="my-4" />
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-3"
                    >
                        <Field>
                            <FieldLabel htmlFor="branch-code">
                                Branch Code
                            </FieldLabel>
                            <Input
                                id="branch-code"
                                type="text"
                                name="branch_code"
                                value={form.branch_code}
                                onChange={handleChange}
                                placeholder="e.g. CEB01"
                            />
                            {errors.branch_code && (
                                <FieldError>
                                    {errors.branch_code[0]}
                                </FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="branch-name">
                                Branch Name
                            </FieldLabel>
                            <Input
                                id="branch-name"
                                type="text"
                                name="branch_name"
                                value={form.branch_name}
                                onChange={handleChange}
                                placeholder="e.g. Cebu Branch"
                            />
                            {errors.branch_name && (
                                <FieldError>
                                    {errors.branch_name[0]}
                                </FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="branch-manager">
                                Branch Manager{" "}
                                <span className="text-gray-400">
                                    (optional)
                                </span>
                            </FieldLabel>
                            <Input
                                id="branch-manager"
                                type="text"
                                name="branch_manager"
                                value={form.branch_manager}
                                onChange={handleChange}
                                placeholder="e.g. Maria Santos"
                            />
                            {errors.branch_manager && (
                                <FieldError>
                                    {errors.branch_manager[0]}
                                </FieldError>
                            )}
                        </Field>
                        <div className="flex gap-2 pt-1">
                            <Button type="submit" disabled={addBranchMutation.isPending}>
                                {addBranchMutation.isPending ? "Saving..." : "Save Branch"}
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
            </div>
        </AppDialog>
    );
}
