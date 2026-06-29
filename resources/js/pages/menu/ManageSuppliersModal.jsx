import React, { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import api from '@/api/axios';
import AppDialog from "@/components/ui/AppDialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function ManageSuppliersModal({ onClose }) {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
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

    const handleChange = (e) => {
        setForm({ name: e.target.value });
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await api.post('/suppliers', form);
            setForm({ name: '' });
            setSuccess(true);
            setShowForm(false);
            fetchSuppliers();
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to save supplier:', error);
            }
        } finally {
            setSaving(false);
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

        setSaving(true);
        try {
            await Promise.all(
                editRows.map((row) =>
                    api.put(`/suppliers/${row.id}`, { name: row.name })
                )
            );
            await fetchSuppliers();
            setIsEditing(false);
            setSuccess(true);
        } catch (error) {
            console.error('Failed to save suppliers:', error);
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

    const handleRowChange = (index, value) => {
        const updated = [...editRows];
        updated[index].name = value;
        setEditRows(updated);

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
                            disabled={suppliers.length === 0}
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
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Supplier'}
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
