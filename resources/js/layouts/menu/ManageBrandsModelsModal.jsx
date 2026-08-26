import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '@/api/axios';
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/custom/custom-button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function ManageBrandsModelsModal({ onClose }) {
    const [view, setView] = useState('menu');

    // Only Models editing uses parent footer
    const [modelsEditing, setModelsEditing] = useState(false);
    const [brandsEditing, setBrandsEditing] = useState(false);
    const isEditing = modelsEditing || brandsEditing;
    const [onSave, setOnSave] = useState(null);
    const [onCancel, setOnCancel] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleBack = () => {
        if (isEditing) return;

        setView('menu');
        setBrandsEditing(false);
        setModelsEditing(false);
    };

    return (
        <AppDialog
            open
            onOpenChange={(o) => { if (!o) onClose(); }}
            title={
                view === 'menu' ? 'Brands & Models' :
                view === 'brands' ? 'Manage Brands' :
                'Manage Models'
            }
            dismissible={!isEditing}
            leftAction={
                view !== 'menu' ? (
                    <button
                        onClick={handleBack}
                        disabled={isEditing}
                        className={`transition-colors ${
                            isEditing
                                ? 'text-gray-200 cursor-not-allowed'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <ArrowLeft size={16} />
                    </button>
                ) : null
            }
            footer={
                brandsEditing ? null : (
                    modelsEditing ? (
                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => onCancel && onCancel()}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => onSave && onSave()}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save All'}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    )
                )
            }
        >
            {view === 'menu' && <MainMenu setView={setView} />}
            {view === 'brands' && (
                <BrandsView
                    setBrandsEditing={setBrandsEditing}
                    />
            )}
            {view === 'models' && (
                <ModelsView
                    setModelsEditing={setModelsEditing}
                    modelsEditing={modelsEditing}
                    setOnSave={setOnSave}
                    setOnCancel={setOnCancel}
                    setSavingParent={setSaving}
                />
            )}
        </AppDialog>
    );

}

// ─── Main Menu ────────────────────────────────────────────────────────────────
function MainMenu({ setView }) {
    const menuItems = [
        { label: 'Manage Brands', view: 'brands', description: 'Add and view equipment brands' },
        { label: 'Manage Models', view: 'models', description: 'Add and view models per brand' },
    ];

    return (
        <div className="space-y-2 py-2">
            {menuItems.map((item) => (
                <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gray-200 text-left text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                    <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                </button>
            ))}
        </div>
    );
}

// ─── Brands View ──────────────────────────────────────────────────────────────
// Fully self-contained — manages its own editing state and footer buttons
function BrandsView({ setBrandsEditing }) {
    const queryClient = useQueryClient();

    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '' });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editRows, setEditRows] = useState([]);
    const [rowErrors, setRowErrors] = useState({});

    useEffect(() => { fetchBrands(); }, []);

    const fetchBrands = async () => {
        try {
            const response = await api.get('/brands');
            setBrands(response.data);
        } catch (error) {
            console.error('Failed to fetch brands:', error);
        } finally {
            setLoading(false);
        }
    };

    const invalidateMaintenanceData = () => {
        ["lookups", "employees", "assignments", "equipment", "deliveries"]
            .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    };

    const addBrandMutation = useMutation({
        mutationFn: (payload) => api.post('/brands', payload),
        onSuccess: async () => {
            await fetchBrands();
            invalidateMaintenanceData();
        },
    });

    const saveAllMutation = useMutation({
        mutationFn: (rows) =>
            Promise.all(
                rows.map((row) =>
                    api.put(`/brands/${row.id}`, { name: row.name })
                )
            ),
        onSuccess: async () => {
            await fetchBrands();
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
            await addBrandMutation.mutateAsync(form);
            setForm({ name: '' });
            setSuccess(true);
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            }
        }
    };

    const handleEditClick = () => {
        setEditRows(brands.map((b) => ({ id: b.id, name: b.name })));
        setRowErrors({});
        setIsEditing(true);
        setBrandsEditing(true);
        setShowForm(false);
        setSuccess(false);
    };

    const validate = () => {
        const newErrors = {};
        const names = [];
        editRows.forEach((row, index) => {
            const rowErr = {};
            if (!row.name.trim()) rowErr.name = 'This field is required.';
            const key = row.name.trim().toLowerCase();
            if (names.includes(key)) {
                rowErr.name = 'Duplicate field.';
            } else {
                names.push(key);
            }
            if (Object.keys(rowErr).length > 0) newErrors[index] = rowErr;
        });
        return newErrors;
    };

    const handleSaveAll = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setRowErrors(validationErrors);
            return;
        }
        try {
            await saveAllMutation.mutateAsync(editRows);
            setIsEditing(false);
            setBrandsEditing(false);
            setSuccess(true);
        } catch (error) {
            console.error('Failed to save brands:', error);
        }
    };

    const handleCancel = () => {
        setEditRows([]);
        setRowErrors({});
        setBrandsEditing(false);
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
                        disabled={brands.length === 0}
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
                    {isEditing ? 'Brands updated successfully!' : 'Brand added successfully!'}
                </div>
            )}

            {/* Brands Table */}
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
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Brand Name</TableHead>
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
                                        placeholder="Brand name"
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
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Brand Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                        {brands.map((brand, index) => (
                            <TableRow key={brand.id} className="border-0 hover:bg-gray-50">
                                <TableCell className="py-2 px-0 text-xs text-gray-400">{index + 1}</TableCell>
                                <TableCell className="py-2 px-0 text-gray-800">{brand.name}</TableCell>
                            </TableRow>
                        ))}
                        {brands.length === 0 && (
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableCell colSpan={2} className="py-4 px-0 text-center text-gray-400 text-xs">
                                    No brands yet.
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
                        <label className={labelClass}>Brand Name</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="e.g. Lenovo"
                        />
                        {errors.name && <p className={errorClass}>{errors.name[0]}</p>}
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button type="submit" disabled={addBrandMutation.isPending}>
                            {addBrandMutation.isPending ? 'Saving...' : 'Save Brand'}
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

            {/* Brands Edit Footer — self-contained */}
            {isEditing && (
                <div className="flex justify-between border-t pt-3">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveAll} disabled={saveAllMutation.isPending}>
                        {saveAllMutation.isPending ? 'Saving...' : 'Save All'}
                    </Button>
                </div>
            )}
        </div>
    );
}

// ─── Models View ──────────────────────────────────────────────────────────────
// Uses parent footer for Cancel / Save All
function ModelsView({ setModelsEditing, modelsEditing, setOnSave, setOnCancel, setSavingParent }) {
    const queryClient = useQueryClient();

    const [brands, setBrands] = useState([]);
    const [allModels, setAllModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ brand_id: '', name: '' });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [editRows, setEditRows] = useState([]);
    const [rowErrors, setRowErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [brandsRes, modelsRes] = await Promise.all([
                    api.get('/brands'),
                    api.get('/equipment-models'),
                ]);
                setBrands(brandsRes.data);
                setAllModels(modelsRes.data);
                setFilteredModels(modelsRes.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchModels = async () => {
        const modelsRes = await api.get('/equipment-models');
        setAllModels(modelsRes.data);
    };

    const invalidateMaintenanceData = () => {
        ["lookups", "employees", "assignments", "equipment", "deliveries"]
            .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    };

    const addModelMutation = useMutation({
        mutationFn: (payload) => api.post('/equipment-models', payload),
        onSuccess: async () => {
            await fetchModels();
            invalidateMaintenanceData();
        },
    });

    const saveAllMutation = useMutation({
        mutationFn: (rows) =>
            Promise.all(
                rows.map((row) =>
                    api.put(`/equipment-models/${row.id}`, {
                        name: row.name,
                        brand_id: row.brand_id,
                    })
                )
            ),
        onSuccess: async () => {
            await fetchModels();
            invalidateMaintenanceData();
        },
    });

    useEffect(() => {
        if (!selectedBrandId) {
            setFilteredModels(allModels);
        } else {
            setFilteredModels(
                allModels.filter((m) => m.brand_id === parseInt(selectedBrandId))
            );
        }
    }, [selectedBrandId, allModels]);

    useEffect(() => {
        if (selectedBrandId) {
            setForm(prev => ({ ...prev, brand_id: selectedBrandId }));
        }
    }, [selectedBrandId]);

    const handleEditClick = () => {
        setEditRows(filteredModels.map((m) => ({
            id: m.id,
            name: m.name,
            brand_id: String(m.brand_id),
        })));
        setRowErrors({});
        setModelsEditing(true);
        setShowForm(false);
        setSuccess(false);
    };

    const validate = () => {
        const newErrors = {};
        const names = [];
        editRows.forEach((row, index) => {
            const rowErr = {};
            if (!row.name.trim()) rowErr.name = 'This field is required.';
            if (!row.brand_id) rowErr.brand_id = 'This field is required.';
            const key = `${row.brand_id}-${row.name.trim().toLowerCase()}`;
            if (names.includes(key)) {
                rowErr.name = 'Duplicate field.';
            } else {
                names.push(key);
            }
            if (Object.keys(rowErr).length > 0) newErrors[index] = rowErr;
        });
        return newErrors;
    };

    const handleSaveAll = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setRowErrors(validationErrors);
            return;
        }
        setSavingParent(true);
        try {
            await saveAllMutation.mutateAsync(editRows);
            setModelsEditing(false);
            setSuccess(true);
        } catch (error) {
            console.error('Failed to save models:', error);
        } finally {
            setSavingParent(false);
        }
    };

    const handleCancel = () => {
        setEditRows([]);
        setRowErrors({});
        setModelsEditing(false);
    };

    useEffect(() => {
        setOnSave(() => handleSaveAll);
        setOnCancel(() => handleCancel);
    }, [editRows]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            await addModelMutation.mutateAsync(form);
            setForm({ brand_id: selectedBrandId || '', name: '' });
            setSuccess(true);
            setShowForm(false);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            }
        }
    };

    const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const errorInputClass = "w-full border border-red-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const errorClass = "text-red-500 text-xs mt-1";

    return (
        <div className="space-y-4">

            {/* Brand Filter */}
            <div>
                <label className={labelClass}>Filter by Brand</label>
                <select
                    value={selectedBrandId}
                    onChange={(e) => {
                        setSelectedBrandId(e.target.value);
                        setSuccess(false);
                        if (modelsEditing) handleCancel();
                    }}
                    disabled={modelsEditing}
                    className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                </select>
            </div>

            {/* Action Buttons */}
            {!modelsEditing && (
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
                        disabled={filteredModels.length === 0}
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
                    Models saved successfully!
                </div>
            )}

            {/* Models Table */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <div className="skeleton h-3 w-32 rounded"></div>
                            <div className="skeleton h-3 w-24 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : modelsEditing ? (
                <Table>
                    <TableHeader className="text-xs uppercase text-gray-500 border-b">
                        <TableRow className="border-0 hover:bg-transparent">
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit">#</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Model Name</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Brand</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                        {editRows.map((row, index) => (
                            <TableRow key={row.id} className="border-0 hover:bg-transparent">
                                <TableCell className="py-2 px-0 align-top text-xs text-gray-400 pr-2">{index + 1}</TableCell>
                                <TableCell className="py-2 px-0 align-top pr-2">
                                    <input
                                        type="text"
                                        value={row.name}
                                        onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                                        className={rowErrors[index]?.name ? errorInputClass : inputClass}
                                        placeholder="Model name"
                                    />
                                    {rowErrors[index]?.name && (
                                        <p className={errorClass}>{rowErrors[index].name}</p>
                                    )}
                                </TableCell>
                                <TableCell className="py-2 px-0 align-top">
                                    <select
                                        value={row.brand_id}
                                        onChange={(e) => handleRowChange(index, 'brand_id', e.target.value)}
                                        className={rowErrors[index]?.brand_id ? errorInputClass : inputClass}
                                    >
                                        <option value="">Select Brand</option>
                                        {brands.map((brand) => (
                                            <option key={brand.id} value={String(brand.id)}>{brand.name}</option>
                                        ))}
                                    </select>
                                    {rowErrors[index]?.brand_id && (
                                        <p className={errorClass}>{rowErrors[index].brand_id}</p>
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
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Model Name</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit">Brand</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                        {filteredModels.map((model, index) => (
                            <TableRow key={model.id} className="border-0 hover:bg-gray-50">
                                <TableCell className="py-2 px-0 text-xs text-gray-400">{index + 1}</TableCell>
                                <TableCell className="py-2 px-0 text-gray-800">{model.name}</TableCell>
                                <TableCell className="py-2 px-0 text-gray-500 text-xs">{model.brand?.name}</TableCell>
                            </TableRow>
                        ))}
                        {filteredModels.length === 0 && (
                            <TableRow className="border-0 hover:bg-transparent">
                                <TableCell colSpan={3} className="py-4 px-0 text-center text-gray-400 text-xs">
                                    No models found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            {/* Add Form */}
            {showForm && !modelsEditing && (<>
                <Separator className="my-4" />
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className={labelClass}>Brand</label>
                        <select
                            name="brand_id"
                            value={form.brand_id}
                            onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                            className={inputClass}
                        >
                            <option value="">Select Brand</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                        {errors.brand_id && <p className={errorClass}>{errors.brand_id[0]}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Model Name</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. IdeaPad"
                        />
                        {errors.name && <p className={errorClass}>{errors.name[0]}</p>}
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button type="submit" disabled={addModelMutation.isPending}>
                            {addModelMutation.isPending ? 'Saving...' : 'Save Model'}
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
    );
}
