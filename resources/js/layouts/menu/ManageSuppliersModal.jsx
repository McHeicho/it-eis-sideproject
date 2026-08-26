import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import api from '@/api/axios';
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/custom/custom-button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function ManageSuppliersModal({ onClose }) {
    const queryClient = useQueryClient();

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '' });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    // Inline edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editRows, setEditRows] = useState([]);
    const [rowErrors, setRowErrors] = useState({});

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data);
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const invalidateMaintenanceData = () => {
        ["lookups", "employees", "assignments", "equipment", "deliveries"]
            .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    };

    const addSupplierMutation = useMutation({
        mutationFn: (payload) => api.post('/suppliers', payload),
        onSuccess: async () => {
            await fetchSuppliers();
            invalidateMaintenanceData();
        },
    });

    const saveAllMutation = useMutation({
        mutationFn: (rows) =>
            Promise.all(rows.map((row) => api.put(`/suppliers/${row.id}`, { name: row.name }))),
        onSuccess: async () => {
            await fetchSuppliers();
            invalidateMaintenanceData();
        },
    });

    const handleChange = (e) => {
        setForm({ name: e.target.value });
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            await addSupplierMutation.mutateAsync(form);
            setForm({ name: '' });
            setSuccess(true);
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to save supplier:', error);
            }
        }
    };

    // Enter edit mode
    const handleEditClick = () => {
        setEditRows(suppliers.map((s) => ({
            id: s.id,
            name: s.name,
        })));
        setRowErrors({});
        setIsEditing(true);
        setShowForm(false);
        setSuccess(false);
    };

    // Validate rows
    const validate = () => {
        const newErrors = {};
        const names = [];

        editRows.forEach((row, index) => {
            const rowErr = {};

            if (!row.name.trim()) {
                rowErr.name = 'This field is required.';
            }

            const key = row.name.trim().toLowerCase();
            if (names.includes(key)) {
                rowErr.name = 'Duplicate field.';
            } else {
                names.push(key);
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
            setSuccess(true);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save suppliers:', error);
        }
    };

    // Cancel edit
    const handleCancel = () => {
        setEditRows([]);
        setRowErrors({});
        setIsEditing(false);
    };

    const handleRowChange = (index, value) => {
        setEditRows(editRows.map((row, i) =>
            i === index ? { ...row, name: value } : row
    ));

        if (rowErrors[index]) {
            const updatedErrors = { ...rowErrors };
            delete updatedErrors[index];
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
            title="Suppliers"
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
                            disabled={suppliers.length === 0}
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
                        {isEditing ? 'Suppliers updated successfully!' : 'Supplier added successfully!'}
                    </div>
                )}

                {/* Suppliers Table */}
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton h-3 w-full rounded"></div>
                        ))}
                    </div>
                ) : isEditing ? (
                    <Table>
                        <TableHeader className="text-xs uppercase text-gray-500 border-b">
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">#</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Supplier Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {editRows.map((row, index) => (
                                <TableRow key={row.id} className="border-0 hover:bg-transparent">
                                    <TableCell className="py-2 px-0 align-top text-xs text-gray-400 pr-2">{index + 1}</TableCell>
                                    <TableCell className="py-2 px-0 align-top">
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => handleRowChange(index, e.target.value)}
                                            className={rowErrors[index]?.name ? errorInputClass : inputClass}
                                            placeholder="Supplier name"
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
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">#</TableHead>
                                <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Supplier Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {suppliers.map((supplier, index) => (
                                <TableRow key={supplier.id} className="border-0 hover:bg-gray-50">
                                    <TableCell className="py-2 px-0 text-xs text-gray-400">{index + 1}</TableCell>
                                    <TableCell className="py-2 px-0 text-gray-800">{supplier.name}</TableCell>
                                </TableRow>
                            ))}
                            {suppliers.length === 0 && (
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableCell colSpan={2} className="py-4 px-0 text-center text-gray-400 text-xs">
                                        No suppliers yet.
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
                            <label className={labelClass}>Supplier Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. ProVantage"
                            />
                            {errors.name && <p className={errorClass}>{errors.name[0]}</p>}
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button type="submit" disabled={addSupplierMutation.isPending}>
                                {addSupplierMutation.isPending ? 'Saving...' : 'Save Supplier'}
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
