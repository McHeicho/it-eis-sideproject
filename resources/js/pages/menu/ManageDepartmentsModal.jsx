import React, { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import api from '../../api/axios';
import AppDialog from "@/components/ui/AppDialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function ManageDepartmentsModal({ onClose }) {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ tag: '', name: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Inline edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editRows, setEditRows] = useState([]);
    const [rowErrors, setRowErrors] = useState({});

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === 'tag' ? value.toUpperCase() : value,
        });
        setErrors({ ...errors, [name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await api.post('/departments', form);
            setForm({ tag: '', name: '' });
            setSuccess(true);
            setShowForm(false);
            fetchDepartments();
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to save department:', error);
            }
        } finally {
            setSaving(false);
        }
    };

    // Enter edit mode
    const handleEditClick = () => {
        setEditRows(departments.map((d) => ({
            id: d.id,
            tag: d.tag,
            name: d.name,
        })));
        setRowErrors({});
        setIsEditing(true);
        setShowForm(false);
        setSuccess(false);
    };

    // Validate rows
    const validate = () => {
        const newErrors = {};
        const tags = [];
        const names = [];

        editRows.forEach((row, index) => {
            const rowErr = {};

            if (!row.tag.trim()) {
                rowErr.tag = 'This field is required.';
            }
            if (!row.name.trim()) {
                rowErr.name = 'This field is required.';
            }

            const tagKey = row.tag.trim().toUpperCase();
            if (tags.includes(tagKey)) {
                rowErr.tag = 'Duplicate field.';
            } else {
                tags.push(tagKey);
            }

            const nameKey = row.name.trim().toLowerCase();
            if (names.includes(nameKey)) {
                rowErr.name = 'Duplicate field.';
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
                    api.put(`/departments/${row.id}`, {
                        tag: row.tag,
                        name: row.name,
                    })
                )
            );
            await fetchDepartments();
            setIsEditing(false);
            setSuccess(true);
        } catch (error) {
            console.error('Failed to save departments:', error);
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
        updated[index][field] = field === 'tag' ? value.toUpperCase() : value;
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

    const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const errorInputClass = "w-full border border-red-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const errorClass = "text-red-500 text-xs mt-1";

    return (
        <AppDialog
            open
            onOpenChange={(o) => { if (!o) onClose(); }}
            title="Departments"
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
                            {saving ? 'Saving...' : 'Save All'}
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
                            onClick={() => { setShowForm(!showForm); setSuccess(false); }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={14} />
                            Add
                        </button>
                        <button
                            onClick={handleEditClick}
                            disabled={departments.length === 0}
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
                        {isEditing ? 'Departments updated successfully!' : 'Department added successfully!'}
                    </div>
                )}

                {/* Departments Table */}
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="skeleton h-3 w-16 rounded"></div>
                                <div className="skeleton h-3 w-32 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : isEditing ? (
                    <Table>
                        <TableHeader className="text-xs uppercase text-gray-500 border-b">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">#</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Tag</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {editRows.map((row, index) => (
                                <TableRow key={row.id} className="border-0 hover:bg-transparent">
                                    <TableCell className="py-2 px-0 align-top text-xs text-gray-400 pr-2">{index + 1}</TableCell>
                                    <TableCell className="py-2 px-0 align-top pr-2">
                                        <input
                                            type="text"
                                            value={row.tag}
                                            onChange={(e) => handleRowChange(index, 'tag', e.target.value)}
                                            className={rowErrors[index]?.tag ? errorInputClass : inputClass}
                                            placeholder="e.g. CLMS"
                                            maxLength={10}
                                        />
                                        {rowErrors[index]?.tag && (
                                            <p className={errorClass}>{rowErrors[index].tag}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top">
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                                            className={rowErrors[index]?.name ? errorInputClass : inputClass}
                                            placeholder="e.g. Claims"
                                        />
                                        {rowErrors[index]?.name && (
                                            <p className={errorClass}>{rowErrors[index].name}</p>
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
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Tag</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {departments.map((dept) => (
                                <TableRow key={dept.id} className="border-0 hover:bg-gray-50">
                                    <TableCell className="py-2 px-0 font-mono text-xs text-gray-600">{dept.tag}</TableCell>
                                    <TableCell className="py-2 px-0 text-gray-800">{dept.name}</TableCell>
                                </TableRow>
                            ))}
                            {departments.length === 0 && (
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableCell colSpan={2} className="py-4 px-0 text-center text-gray-400 text-xs">
                                        No departments yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {/* Add Form */}
                {showForm && !isEditing && (<>
                    <Separator className="my-4" />
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className={labelClass}>Department Tag</label>
                            <input
                                type="text"
                                name="tag"
                                value={form.tag}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. CLMS"
                                maxLength={10}
                            />
                            {errors.tag && <p className={errorClass}>{errors.tag[0]}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Department Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. Claims"
                            />
                            {errors.name && <p className={errorClass}>{errors.name[0]}</p>}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Department'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setErrors({}); }}
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
