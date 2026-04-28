import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Laptop } from 'lucide-react';
import api from '../../api/axios';

export default function EquipmentAdd() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [allModels, setAllModels] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [dropdownsLoading, setDropdownsLoading] = useState(true);

    const [form, setForm] = useState({
        equipment_type_id: '',
        brand_id: '',
        model_id: '',
        serial_number: '',
        supplier_id: '',
        purchase_date: '',
        voucher_no: '',
        condition: '',
        status: 'Available',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Load all dropdowns at once on mount
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [typesRes, brandsRes, suppliersRes, modelsRes] = await Promise.all([
                    api.get('/equipment-types'),
                    api.get('/brands'),
                    api.get('/suppliers'),
                    api.get('/equipment-models'),
                ]);
                setEquipmentTypes(typesRes.data);
                setBrands(brandsRes.data);
                setSuppliers(suppliersRes.data);
                setAllModels(modelsRes.data);
                if (isEditMode) {
                    const equipmentRes = await api.get(`/equipment/${id}`);
                    const eq = equipmentRes.data;
                    setForm({
                        equipment_type_id: eq.equipment_type_id,
                        brand_id:          eq.brand_id,
                        model_id:          eq.model_id,
                        serial_number:     eq.serial_number,
                        supplier_id:       eq.supplier_id,
                        purchase_date:     eq.purchase_date,
                        voucher_no:        eq.voucher_no || '',
                        condition:         eq.condition,
                        status:            eq.status,
                    });
                }
            } catch (error) {
                console.error('Failed to load dropdowns:', error);
            } finally {
                setDropdownsLoading(false);
            }
        };
        fetchDropdowns();
    }, []);

    // Filter models client-side when brand changes
    useEffect(() => {
        if (!form.brand_id) {
            setModels([]);
            setForm(prev => ({ ...prev, model_id: '' }));
            return;
        }
        const filtered = allModels.filter(
            (m) => m.brand_id === parseInt(form.brand_id)
        );
        setModels(filtered);
        if (!isEditMode) {
            setForm(prev => ({ ...prev, model_id: '' }));
        }
    }, [form.brand_id, allModels]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (isEditMode) {
                await api.put(`/equipment/${id}`, form);
            } else {
                await api.post('/equipment', form);
            }
            navigate('/equipment');
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Failed to save equipment:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const errorClass = "text-red-500 text-xs mt-1";

    // Loading skeleton
    if (dropdownsLoading) {
        return (
            <div className="p-6 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Equipment' : 'Add Equipment'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{isEditMode ? 'Update the equipment details below.' : 'Fill in the details below to register a new equipment record.'}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 space-y-5">

                    {/* Equipment Type skeleton */}
                    <div>
                        <div className="skeleton h-3 w-28 rounded mb-3"></div>
                        <div className="flex gap-3">
                            <div className="skeleton h-16 w-20 rounded"></div>
                            <div className="skeleton h-16 w-20 rounded"></div>
                        </div>
                    </div>

                    {/* Brand skeleton */}
                    <div>
                        <div className="skeleton h-3 w-16 rounded mb-2"></div>
                        <div className="skeleton h-9 w-full rounded"></div>
                    </div>

                    {/* Model skeleton */}
                    <div>
                        <div className="skeleton h-3 w-16 rounded mb-2"></div>
                        <div className="skeleton h-9 w-full rounded"></div>
                    </div>

                    {/* Serial Number skeleton */}
                    <div>
                        <div className="skeleton h-3 w-24 rounded mb-2"></div>
                        <div className="skeleton h-9 w-full rounded"></div>
                    </div>

                    {/* Supplier skeleton */}
                    <div>
                        <div className="skeleton h-3 w-20 rounded mb-2"></div>
                        <div className="skeleton h-9 w-full rounded"></div>
                    </div>

                    {/* Purchase Date + Voucher No skeleton */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="skeleton h-3 w-24 rounded mb-2"></div>
                            <div className="skeleton h-9 w-full rounded"></div>
                        </div>
                        <div>
                            <div className="skeleton h-3 w-20 rounded mb-2"></div>
                            <div className="skeleton h-9 w-full rounded"></div>
                        </div>

                    </div>

                    {/* Condition + Status skeleton */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="skeleton h-3 w-20 rounded mb-2"></div>
                            <div className="skeleton h-9 w-full rounded"></div>
                        </div>
                        <div>
                            <div className="skeleton h-3 w-16 rounded mb-2"></div>
                            <div className="skeleton h-9 w-full rounded"></div>
                        </div>
                    </div>

                    {/* Buttons skeleton */}
                    <div className="flex gap-3 pt-2">
                        <div className="skeleton h-9 w-32 rounded"></div>
                        <div className="skeleton h-9 w-24 rounded"></div>
                    </div>

                    </div>
                    </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Equipment' : 'Add Equipment'}</h1>
                <p className="text-sm text-gray-500 mt-1">{isEditMode ? 'Update the equipment details below.' : 'Fill in the details below to register a new equipment record.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">

                {/* Equipment Type */}
                <div>
                    <label className={labelClass}>Equipment Type</label>
                    <div className="flex gap-3">
                        {equipmentTypes.map((type) => (
                            <button
                                type="button"
                                key={type.id}
                                onClick={() => setForm({ ...form, equipment_type_id: type.id })}
                                className={`flex flex-col items-center gap-1 px-4 py-3 rounded border text-sm transition-colors ${
                                    form.equipment_type_id === type.id
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Laptop size={20} />
                                {type.name}
                            </button>
                        ))}
                    </div>
                    {errors.equipment_type_id && <p className={errorClass}>{errors.equipment_type_id[0]}</p>}
                </div>

                {/* Brand */}
                <div>
                    <label className={labelClass}>Brand</label>
                    <select
                        name="brand_id"
                        value={form.brand_id}
                        onChange={handleChange}
                        className={inputClass}
                    >
                        <option value="">Select Brand</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                    {errors.brand_id && <p className={errorClass}>{errors.brand_id[0]}</p>}
                </div>

                {/* Model */}
                <div>
                    <label className={labelClass}>Model</label>
                    <select
                        name="model_id"
                        value={form.model_id}
                        onChange={handleChange}
                        disabled={!form.brand_id}
                        className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                    >
                        <option value="">
                            {form.brand_id ? 'Select Model' : 'Select a brand first'}
                        </option>
                        {models.map((model) => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                    {errors.model_id && <p className={errorClass}>{errors.model_id[0]}</p>}
                </div>

                {/* Serial Number */}
                <div>
                    <label className={labelClass}>Serial Number</label>
                    <input
                        type="text"
                        name="serial_number"
                        value={form.serial_number}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g. SN-2024-00123"
                    />
                    {errors.serial_number && <p className={errorClass}>{errors.serial_number[0]}</p>}
                </div>

                {/* Supplier */}
                <div>
                    <label className={labelClass}>Supplier</label>
                    <select
                        name="supplier_id"
                        value={form.supplier_id}
                        onChange={handleChange}
                        className={inputClass}
                    >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                    </select>
                    {errors.supplier_id && <p className={errorClass}>{errors.supplier_id[0]}</p>}
                </div>

                {/* Purchase Date + Voucher No */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Purchase Date</label>
                        <input
                            type="date"
                            name="purchase_date"
                            value={form.purchase_date}
                            onChange={handleChange}
                            className={inputClass}
                        />
                        {errors.purchase_date && <p className={errorClass}>{errors.purchase_date[0]}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Voucher No.</label>
                        <input
                            type="text"
                            name="voucher_no"
                            value={form.voucher_no}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="e.g. DV-2024-001"
                        />
                        {errors.voucher_no && <p className={errorClass}>{errors.voucher_no[0]}</p>}
                    </div>
                </div>

                {/* Condition + Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Condition</label>
                        <select
                            name="condition"
                            value={form.condition}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="">Select Condition</option>
                            <option value="Good">Good</option>
                            <option value="Defective">Defective</option>
                        </select>
                        {errors.condition && <p className={errorClass}>{errors.condition[0]}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            disabled={form.status === 'Assigned'}
                            className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                        >
                            {form.status === 'Assigned' && (
                                <option value="Assigned">Assigned</option>
                            )}
                            <option value="Available">Available</option>
                            <option value="Under Repair">Under Repair</option>
                            <option value="Lost/Missing">Lost/Missing</option>
                            <option value="Retired/Disposed">Retired/Disposed</option>
                            <option value="Spare Unit">Spare Unit</option>
                        </select>
                        {form.status === 'Assigned' && (
                            <p className="text-xs text-gray-400 mt-1">Status is locked while equipment is assigned. Use Return Equipment to change it.</p>
                        )}
                        {errors.status && <p className={errorClass}>{errors.status[0]}</p>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Saving...' : isEditMode ? 'Update Equipment' : 'Save Equipment'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/equipment')}
                        className="bg-gray-100 text-gray-700 px-5 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}