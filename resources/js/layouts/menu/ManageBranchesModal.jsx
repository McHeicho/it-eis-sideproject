import React, { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import api from "@/api/axios";
import AppDialog from "@/components/ui/AppDialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { sortBranches } from "@/lib/branches";

export default function ManageBranchesModal({ onClose }) {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        branch_code: "",
        branch_name: "",
        branch_manager: "",
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
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
        setSaving(true);
        setErrors({});

        try {
            await api.post("/branches", form);
            setForm({ branch_code: "", branch_name: "", branch_manager: "" });
            setSuccess(true);
            setShowForm(false);
            fetchBranches();
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error("Failed to save branch:", error);
            }
        } finally {
            setSaving(false);
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

        setSaving(true);
        try {
            await Promise.all(
                editRows.map((row) =>
                    api.put(`/branches/${row.id}`, {
                        branch_code: row.branch_code,
                        branch_name: row.branch_name,
                        branch_manager: row.branch_manager,
                    })
                )
            );
            await fetchBranches();
            setIsEditing(false);
            setSuccess(true);
        } catch (error) {
            console.error("Failed to save branches:", error);
        } finally {
            setSaving(false);
        }
    };

    // Cancel edit
    const handleCancel = () => {
        setEditRows([]);
        setRowErrors({});
        setIsEditing(false);
    };

    const handleRowChange = (index, field, value) => {
        const updated = [...editRows];
        updated[index][field] =
            field === "branch_code" ? value.toUpperCase() : value;
        setEditRows(updated);

        if (rowErrors[index]) {
            const updatedErrors = { ...rowErrors };
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
            title="Branches"
            dismissible={!isEditing}
            footer={
                isEditing ? (
                    <div className="flex justify-between">
                        <button
                            onClick={handleCancel}
                            className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? "Saving..." : "Save All"}
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-end w-full">
                        <button
                            onClick={onClose}
                            className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )
            }
        >
            <div className="space-y-4">
                {/* Action Buttons */}
                {!isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setShowForm(!showForm);
                                setSuccess(false);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={14} />
                            Add
                        </button>
                        <button
                            onClick={handleEditClick}
                            disabled={branches.length === 0}
                            className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Pencil size={14} />
                            Edit
                        </button>
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
                                        <input
                                            type="text"
                                            value={row.branch_code}
                                            onChange={(e) =>
                                                handleRowChange(
                                                    index,
                                                    "branch_code",
                                                    e.target.value
                                                )
                                            }
                                            className={
                                                rowErrors[index]
                                                    ?.branch_code
                                                    ? errorInputClass
                                                    : inputClass
                                            }
                                            placeholder="e.g. CEB01"
                                        />
                                        {rowErrors[index]
                                            ?.branch_code && (
                                            <p className={errorClass}>
                                                {
                                                    rowErrors[index]
                                                        .branch_code
                                                }
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top pr-2">
                                        <input
                                            type="text"
                                            value={row.branch_name}
                                            onChange={(e) =>
                                                handleRowChange(
                                                    index,
                                                    "branch_name",
                                                    e.target.value
                                                )
                                            }
                                            className={
                                                rowErrors[index]
                                                    ?.branch_name
                                                    ? errorInputClass
                                                    : inputClass
                                            }
                                            placeholder="e.g. Cebu Branch"
                                        />
                                        {rowErrors[index]
                                            ?.branch_name && (
                                            <p className={errorClass}>
                                                {
                                                    rowErrors[index]
                                                        .branch_name
                                                }
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top">
                                        <input
                                            type="text"
                                            value={row.branch_manager}
                                            onChange={(e) =>
                                                handleRowChange(
                                                    index,
                                                    "branch_manager",
                                                    e.target.value
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="optional"
                                        />
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
                        <div>
                            <label className={labelClass}>
                                Branch Code
                            </label>
                            <input
                                type="text"
                                name="branch_code"
                                value={form.branch_code}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. CEB01"
                            />
                            {errors.branch_code && (
                                <p className={errorClass}>
                                    {errors.branch_code[0]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>
                                Branch Name
                            </label>
                            <input
                                type="text"
                                name="branch_name"
                                value={form.branch_name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. Cebu Branch"
                            />
                            {errors.branch_name && (
                                <p className={errorClass}>
                                    {errors.branch_name[0]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>
                                Branch Manager{" "}
                                <span className="text-gray-400">
                                    (optional)
                                </span>
                            </label>
                            <input
                                type="text"
                                name="branch_manager"
                                value={form.branch_manager}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. Maria Santos"
                            />
                            {errors.branch_manager && (
                                <p className={errorClass}>
                                    {errors.branch_manager[0]}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? "Saving..." : "Save Branch"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setErrors({});
                                }}
                                className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </>)}
            </div>
        </AppDialog>
    );
}
