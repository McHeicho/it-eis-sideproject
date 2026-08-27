import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import api from '../../api/axios';
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/custom/custom-button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function ManageDepartmentsModal({ onClose }) {
    const queryClient = useQueryClient();

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ tag: '', name: '' });
    const [errors, setErrors] = useState({});
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

    const invalidateMaintenanceData = () => {
        ["lookups", "employees", "assignments", "equipment", "deliveries"]
            .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    };

    const addDepartmentMutation = useMutation({
        mutationFn: (payload) => api.post('/departments', payload),
        onSuccess: async () => {
            await fetchDepartments();
            invalidateMaintenanceData();
        },
    });

    const saveAllMutation = useMutation({
        mutationFn: (rows) =>
            Promise.all(
                rows.map((row) =>
                    api.put(`/departments/${row.id}`, {
                        tag: row.tag,
                        name: row.name,
                    })
                )
            ),
        onSuccess: async () => {
            await fetchDepartments();
            invalidateMaintenanceData();
        },
    });

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
        setErrors({});

        try {
            await addDepartmentMutation.mutateAsync(form);
            setForm({ tag: '', name: '' });
            setSuccess(true);
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to save department:', error);
            }
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

        try {
            await saveAllMutation.mutateAsync(editRows);
            setIsEditing(false);
            setSuccess(true);
        } catch (error) {
            console.error('Failed to save departments:', error);
        }
    };

    // Cancel edit
    const handleCancel = () => {
        setEditRows([]);
        setRowErrors({});
        setIsEditing(false);
    };

    const handleRowChange = (index, field, value) => {
        const newValue = field === 'tag' ? value.toUpperCase() : value;
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
            title="Departments"
            dismissible={!isEditing}
            footer={
                isEditing ? (
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAll} disabled={saveAllMutation.isPending}>
                            {saveAllMutation.isPending ? 'Saving...' : 'Save All'}
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
                            onClick={() => { setShowForm(!showForm); setSuccess(false); }}
                        >
                            <Plus size={14} />
                            Add
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleEditClick}
                            disabled={departments.length === 0}
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
                                        <Field>
                                            <Input
                                                id={`department-tag-${index}`}
                                                type="text"
                                                value={row.tag}
                                                onChange={(e) => handleRowChange(index, 'tag', e.target.value)}
                                                aria-invalid={!!rowErrors[index]?.tag}
                                                aria-label="Department tag"
                                                placeholder="e.g. CLMS"
                                                maxLength={10}
                                            />
                                            {rowErrors[index]?.tag && (
                                                <FieldError>{rowErrors[index].tag}</FieldError>
                                            )}
                                        </Field>
                                    </TableCell>
                                    <TableCell className="py-2 px-0 align-top">
                                        <Field>
                                            <Input
                                                id={`department-name-${index}`}
                                                type="text"
                                                value={row.name}
                                                onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                                                aria-invalid={!!rowErrors[index]?.name}
                                                aria-label="Department name"
                                                placeholder="e.g. Claims"
                                            />
                                            {rowErrors[index]?.name && (
                                                <FieldError>{rowErrors[index].name}</FieldError>
                                            )}
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
                        <Field>
                            <FieldLabel htmlFor="department-tag">Department Tag</FieldLabel>
                            <Input
                                id="department-tag"
                                type="text"
                                name="tag"
                                value={form.tag}
                                onChange={handleChange}
                                placeholder="e.g. CLMS"
                                maxLength={10}
                            />
                            {errors.tag && <FieldError>{errors.tag[0]}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="department-name">Department Name</FieldLabel>
                            <Input
                                id="department-name"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Claims"
                            />
                            {errors.name && <FieldError>{errors.name[0]}</FieldError>}
                        </Field>
                        <div className="flex gap-2 pt-1">
                            <Button type="submit" disabled={addDepartmentMutation.isPending}>
                                {addDepartmentMutation.isPending ? 'Saving...' : 'Save Department'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setShowForm(false); setErrors({}); }}
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
