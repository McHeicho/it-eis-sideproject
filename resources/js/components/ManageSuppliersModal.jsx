import React, { useEffect, useState } from 'react';
import { X, Plus, Pencil, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-base font-bold text-gray-800">Suppliers</h2>
                    <button
                        onClick={onClose}
                        disabled={isEditing}
                        className={`transition-colors ${
                            isEditing
                                ? 'text-gray-200 cursor-not-allowed'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">

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
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-gray-500 border-b">
                                <tr>
                                    <th className="py-2 text-left">#</th>
                                    <th className="py-2 text-left">Supplier Name</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {editRows.map((row, index) => (
                                    <tr key={row.id} className="align-top">
                                        <td className="py-2 text-xs text-gray-400 pr-2">{index + 1}</td>
                                        <td className="py-2">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-gray-500 border-b">
                                <tr>
                                    <th className="py-2 text-left">#</th>
                                    <th className="py-2 text-left">Supplier Name</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {suppliers.map((supplier, index) => (
                                    <tr key={supplier.id} className="hover:bg-gray-50">
                                        <td className="py-2 text-xs text-gray-400">{index + 1}</td>
                                        <td className="py-2 text-gray-800">{supplier.name}</td>
                                    </tr>
                                ))}
                                {suppliers.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="py-4 text-center text-gray-400 text-xs">
                                            No suppliers yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Add Form */}
                    {showForm && !isEditing && (
                        <form onSubmit={handleSubmit} className="border-t pt-4 space-y-3">
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
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t flex justify-between">
                    {isEditing ? (
                        <>
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
                        </>
                    ) : (
                        <div className="flex justify-end w-full">
                            <button
                                onClick={onClose}
                                className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}