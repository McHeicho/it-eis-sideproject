import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '@/api/axios';
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

// Sentinels for the Selects in ModelsView below — Radix throws on an
// empty-string item value, so these stand in for "" at the component
// boundary and get translated back in each onValueChange/handleRowChange.
const BRAND_ALL = "all";
const BRAND_NONE = "none";

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
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-gray-400 hover:bg-transparent hover:text-gray-600"
                        onClick={handleBack}
                        disabled={isEditing}
                    >
                        <ArrowLeft size={16} />
                    </Button>
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
                <Table className="table-fixed">
                    <TableHeader className="text-xs uppercase text-gray-500 border-b">
                        <TableRow className="border-0 hover:bg-transparent">
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[10%]">#</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[90%]">Brand Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                        {editRows.map((row, index) => (
                            <TableRow key={row.id} className="border-0 hover:bg-transparent">
                                <TableCell className="py-2 px-0 align-top text-xs text-gray-400 pr-2">{index + 1}</TableCell>
                                <TableCell className="py-2 px-0 align-top">
                                    <Field>
                                        <Input
                                            id={`brand-name-${index}`}
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => handleRowChange(index, e.target.value)}
                                            aria-invalid={!!rowErrors[index]?.name}
                                            aria-label="Brand name"
                                            placeholder="Brand name"
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
                <Table className="table-fixed">
                    <TableHeader className="text-xs uppercase text-gray-500 border-b">
                        <TableRow className="border-0 hover:bg-transparent">
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[10%]">#</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[90%]">Brand Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                        {brands.map((brand, index) => (
                            <TableRow key={brand.id} className="border-0 hover:bg-gray-50">
                                <TableCell className="py-2 px-0 text-xs text-gray-400">{index + 1}</TableCell>
                                <TableCell
                                    className="py-2 px-0 text-gray-800 truncate"
                                    title={brand.name}
                                >
                                    {brand.name}
                                </TableCell>
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
                    <Field>
                        <FieldLabel htmlFor="brand-name">Brand Name</FieldLabel>
                        <Input
                            id="brand-name"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Lenovo"
                        />
                        {errors.name && <FieldError>{errors.name[0]}</FieldError>}
                    </Field>
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

    return (
        <div className="space-y-4">

            {/* Brand Filter */}
            <Field>
                <FieldLabel htmlFor="model-brand-filter">Filter by Brand</FieldLabel>
                <Select
                    value={selectedBrandId || BRAND_ALL}
                    onValueChange={(value) => {
                        setSelectedBrandId(value === BRAND_ALL ? "" : value);
                        setSuccess(false);
                        if (modelsEditing) handleCancel();
                    }}
                    disabled={modelsEditing}
                >
                    <SelectTrigger id="model-brand-filter" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={BRAND_ALL}>All Brands</SelectItem>
                        {brands.map((brand) => (
                            <SelectItem key={brand.id} value={String(brand.id)}>
                                {brand.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

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
                <Table className="table-fixed">
                    <TableHeader className="text-xs uppercase text-gray-500 border-b">
                        <TableRow className="border-0 hover:bg-transparent">
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[10%]">#</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[55%]">Model Name</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[35%]">Brand</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                        {editRows.map((row, index) => (
                            <TableRow key={row.id} className="border-0 hover:bg-transparent">
                                <TableCell className="py-2 px-0 align-top text-xs text-gray-400 pr-2">{index + 1}</TableCell>
                                <TableCell className="py-2 px-0 align-top pr-2">
                                    <Field>
                                        <Input
                                            id={`model-name-${index}`}
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                                            aria-invalid={!!rowErrors[index]?.name}
                                            aria-label="Model name"
                                            placeholder="Model name"
                                        />
                                        {rowErrors[index]?.name && (
                                            <FieldError>{rowErrors[index].name}</FieldError>
                                        )}
                                    </Field>
                                </TableCell>
                                <TableCell className="py-2 px-0 align-top">
                                    <Field>
                                        <Select
                                            value={row.brand_id || BRAND_NONE}
                                            onValueChange={(value) =>
                                                handleRowChange(
                                                    index,
                                                    'brand_id',
                                                    value === BRAND_NONE ? '' : value
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                className="w-full"
                                                aria-invalid={!!rowErrors[index]?.brand_id}
                                                aria-label="Brand"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={BRAND_NONE}>
                                                    Select Brand
                                                </SelectItem>
                                                {brands.map((brand) => (
                                                    <SelectItem key={brand.id} value={String(brand.id)}>
                                                        {brand.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {rowErrors[index]?.brand_id && (
                                            <FieldError>{rowErrors[index].brand_id}</FieldError>
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
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[10%]">#</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[55%]">Model Name</TableHead>
                            <TableHead className="py-2 px-0 h-auto font-normal text-inherit w-[35%]">Brand</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                        {filteredModels.map((model, index) => (
                            <TableRow key={model.id} className="border-0 hover:bg-gray-50">
                                <TableCell className="py-2 px-0 text-xs text-gray-400">{index + 1}</TableCell>
                                <TableCell
                                    className="py-2 px-0 text-gray-800 truncate"
                                    title={model.name}
                                >
                                    {model.name}
                                </TableCell>
                                <TableCell
                                    className="py-2 px-0 text-gray-500 text-xs truncate"
                                    title={model.brand?.name || ""}
                                >
                                    {model.brand?.name}
                                </TableCell>
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
                    <Field>
                        <FieldLabel htmlFor="model-brand">Brand</FieldLabel>
                        <Select
                            value={form.brand_id || BRAND_NONE}
                            onValueChange={(value) =>
                                setForm({
                                    ...form,
                                    brand_id: value === BRAND_NONE ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger
                                id="model-brand"
                                className="w-full"
                                aria-invalid={!!errors.brand_id}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={BRAND_NONE}>
                                    Select Brand
                                </SelectItem>
                                {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={String(brand.id)}>
                                        {brand.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.brand_id && <FieldError>{errors.brand_id[0]}</FieldError>}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="model-name">Model Name</FieldLabel>
                        <Input
                            id="model-name"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. IdeaPad"
                        />
                        {errors.name && <FieldError>{errors.name[0]}</FieldError>}
                    </Field>
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
