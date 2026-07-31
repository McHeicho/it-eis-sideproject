import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Laptop } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { useLookups } from "@/queries/useLookups";

export default function EquipmentAdd() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [models, setModels] = useState([]);
    const [lastSeenUpdatedAt, setLastSeenUpdatedAt] = useState(null);
    const [employeeId, setEmployeeId] = useState("");
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [equipmentLoading, setEquipmentLoading] = useState(isEditMode);

    const { data: lookups, isPending: lookupsPending } = useLookups();
    const dropdownsLoading = lookupsPending || equipmentLoading;

    const equipmentTypes = lookups?.types ?? [];
    const brands = lookups?.brands ?? [];
    const suppliers = lookups?.suppliers ?? [];
    const conditionOptions = lookups?.conditions ?? [];
    const statusOptions = lookups?.statuses ?? [];
    const employees = lookups?.employees ?? [];
    const allModels = useMemo(() => lookups?.models ?? [], [lookups]);

    const [form, setForm] = useState({
        equipment_type_id: "",
        brand_id: "",
        model_id: "",
        serial_number: "",
        delivery_id: "",
        condition: "",
        status: "Available",
    });

    const [deliveryMode, setDeliveryMode] = useState("voucher");
    const [deliveryMatched, setDeliveryMatched] = useState(false);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryFields, setDeliveryFields] = useState({
        voucher_no: "",
        invoice_no: "",
        supplier_id: "",
        supplier_name: "",
        purchase_date: "",
        order_no: "",
        notes: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Load the existing record on mount — edit mode only. Lookups are
    // handled separately by useLookups() above.
    useEffect(() => {
        if (!isEditMode) return;

        const controller = new AbortController();

        const fetchEquipment = async () => {
            try {
                const { data: eq } = await api.get(`/equipment/${id}`, {
                    signal: controller.signal,
                });

                setLastSeenUpdatedAt(eq.updated_at);
                setForm({
                    equipment_type_id: eq.equipment_type_id,
                    brand_id: eq.brand_id,
                    model_id: eq.model_id,
                    serial_number: eq.serial_number,
                    delivery_id: eq.delivery_id,
                    condition: eq.condition,
                    status: eq.status,
                });
                if (eq.delivery) {
                    setDeliveryMatched(true);
                    setDeliveryMode(
                        eq.delivery.voucher_no ? "voucher" : "invoice"
                    );
                    setDeliveryFields({
                        voucher_no: eq.delivery.voucher_no ?? "",
                        invoice_no: eq.delivery.invoice_no ?? "",
                        supplier_id: eq.delivery.supplier_id ?? "",
                        supplier_name: eq.delivery.supplier?.name ?? "",
                        purchase_date: eq.delivery.purchase_date
                            ? eq.delivery.purchase_date.slice(0, 10)
                            : "",
                        order_no: eq.delivery.order_no ?? "",
                        notes: eq.delivery.notes ?? "",
                    });
                }
            } catch (error) {
                if (error.name === "CanceledError") return;
                // TODO(#6): still silent on failure — visible error
                // surface lands in the next step.
                console.error("Failed to load equipment record:", error);
            } finally {
                if (!controller.signal.aborted) {
                    setEquipmentLoading(false);
                }
            }
        };
        fetchEquipment();
        return () => controller.abort();
    }, []);

    // Filter models client-side when brand changes
    useEffect(() => {
        if (!form.brand_id) {
            setModels([]);
            setForm((prev) => ({ ...prev, model_id: "" }));
            return;
        }
        const filtered = allModels.filter(
            (m) => m.brand_id === parseInt(form.brand_id)
        );
        setModels(filtered);
        if (!isEditMode) {
            setForm((prev) => ({ ...prev, model_id: "" }));
        }
    }, [form.brand_id, allModels]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "status" && value !== "Assigned") {
            setEmployeeSearch("");
            setEmployeeId("");
        }
        setForm({ ...form, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const handleDeliveryBlur = async () => {
        const handle =
            deliveryMode === "voucher"
                ? deliveryFields.voucher_no
                : deliveryFields.invoice_no;

        if (!handle.trim()) return;

        setDeliveryLoading(true);
        try {
            const res = await api.post("/deliveries/match", {
                handle,
                mode: deliveryMode,
            });

            if (res.data.matched) {
                setDeliveryMatched(true);
                setForm((prev) => ({
                    ...prev,
                    delivery_id: res.data.delivery_id,
                }));
                setDeliveryFields((prev) => ({
                    ...prev,
                    supplier_id: res.data.supplier_id,
                    supplier_name: res.data.supplier_name,
                    purchase_date: res.data.purchase_date,
                }));
            } else {
                setDeliveryMatched(false);
                setForm((prev) => ({ ...prev, delivery_id: "" }));
            }
        } catch (error) {
            console.error("Delivery match failed:", error);
        } finally {
            setDeliveryLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (!isEditMode && form.status === "Assigned" && !employeeId) {
            setErrors({ employee_id: ["Please select a valid employee."] });
            setLoading(false);
            return;
        }

        const payload = {
            ...form,
            ...(form.delivery_id
                ? { delivery_id: form.delivery_id }
                : {
                      voucher_no: deliveryFields.voucher_no,
                      invoice_no: deliveryFields.invoice_no,
                      supplier_id: deliveryFields.supplier_id,
                      purchase_date: deliveryFields.purchase_date,
                      order_no: deliveryFields.order_no,
                      notes: deliveryFields.notes,
                  }),
            ...(isEditMode && lastSeenUpdatedAt
                ? { last_seen_updated_at: lastSeenUpdatedAt }
                : {}),
            ...(!isEditMode && form.status === "Assigned" && employeeId
                ? { employee_id: employeeId }
                : {}),
        };

        try {
            if (isEditMode) {
                await api.patch(`/equipment/${id}`, payload);
            } else {
                await api.post("/equipment", payload);
            }
            // Toaster is mounted at the app root (Main.jsx), above the router —
            // this toast survives the navigation below.
            toast.success(isEditMode ? "Equipment updated" : "Equipment added");
            navigate("/equipment");
        } catch (error) {
            if (error.response?.status === 409) {
                alert(error.response.data.message);
                navigate("/equipment");
            } else if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error("Failed to save equipment:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const errorClass = "text-red-500 text-xs mt-1";

    // Loading skeleton
    if (dropdownsLoading) {
        return (
            <div className="p-6 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditMode ? "Edit Equipment" : "Add Equipment"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isEditMode
                            ? "Update the equipment details below."
                            : "Fill in the details below to register a new equipment record."}
                    </p>
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
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? "Edit Equipment" : "Add Equipment"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {isEditMode
                        ? "Update the equipment details below."
                        : "Fill in the details below to register a new equipment record."}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow p-6 space-y-5"
            >
                {/* Equipment Type */}
                <div>
                    <label className={labelClass}>Equipment Type</label>
                    <div className="flex gap-3">
                        {equipmentTypes.map((type) => (
                            <button
                                type="button"
                                key={type.id}
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        equipment_type_id: type.id,
                                    })
                                }
                                className={`flex flex-col items-center gap-1 px-4 py-3 rounded border text-sm transition-colors ${
                                    form.equipment_type_id === type.id
                                        ? "border-blue-500 bg-blue-50 text-blue-600"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <Laptop size={20} />
                                {type.name}
                            </button>
                        ))}
                    </div>
                    {errors.equipment_type_id && (
                        <p className={errorClass}>
                            {errors.equipment_type_id[0]}
                        </p>
                    )}
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
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                    {errors.brand_id && (
                        <p className={errorClass}>{errors.brand_id[0]}</p>
                    )}
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
                            {form.brand_id
                                ? "Select Model"
                                : "Select a brand first"}
                        </option>
                        {models.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    {errors.model_id && (
                        <p className={errorClass}>{errors.model_id[0]}</p>
                    )}
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
                        placeholder="e.g. PF123456"
                    />
                    {errors.serial_number && (
                        <p className={errorClass}>{errors.serial_number[0]}</p>
                    )}
                </div>

                {/* Delivery */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>
                            {deliveryMode === "voucher"
                                ? "Voucher No."
                                : "Sales Invoice No."}
                        </label>
                        <div className="flex gap-1 text-xs">
                            <p className="text-xs text-gray-500">
                                {deliveryMode === "voucher" ? (
                                    <>
                                        No voucher number?{" "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeliveryMode("invoice");
                                                if (!isEditMode) {
                                                    setDeliveryMatched(false);
                                                    setDeliveryFields({
                                                        voucher_no: "",
                                                        invoice_no: "",
                                                        supplier_id: "",
                                                        supplier_name: "",
                                                        purchase_date: "",
                                                        order_no: "",
                                                        notes: "",
                                                    });
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        delivery_id: "",
                                                    }));
                                                }
                                            }}
                                            className="underline text-blue-500"
                                        >
                                            Use invoice number instead
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Have a voucher number?{" "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeliveryMode("voucher");
                                                if (!isEditMode) {
                                                    setDeliveryMatched(false);
                                                    setDeliveryFields({
                                                        voucher_no: "",
                                                        invoice_no: "",
                                                        supplier_id: "",
                                                        supplier_name: "",
                                                        purchase_date: "",
                                                        order_no: "",
                                                        notes: "",
                                                    });
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        delivery_id: "",
                                                    }));
                                                }
                                            }}
                                            className="underline text-blue-500"
                                        >
                                            Switch back to voucher
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Handle input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={
                                deliveryMode === "voucher"
                                    ? deliveryFields.voucher_no
                                    : deliveryFields.invoice_no
                            }
                            onChange={(e) => {
                                const key =
                                    deliveryMode === "voucher"
                                        ? "voucher_no"
                                        : "invoice_no";
                                setDeliveryFields((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                }));
                                setDeliveryMatched(false);
                                setForm((prev) => ({
                                    ...prev,
                                    delivery_id: "",
                                }));
                            }}
                            onBlur={handleDeliveryBlur}
                            className={`${inputClass} pr-8`}
                        />
                        {deliveryLoading && (
                            <span className="absolute right-2 top-2.5 text-xs text-gray-400">
                                ...
                            </span>
                        )}
                        {deliveryMatched && !deliveryLoading && (
                            <span className="absolute right-2 top-2.5 text-xs text-green-500">
                                ✓
                            </span>
                        )}
                    </div>

                    {/* Matched / manual fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Supplier</label>
                            {deliveryMatched ? (
                                <input
                                    type="text"
                                    value={deliveryFields.supplier_name}
                                    disabled
                                    className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                                />
                            ) : (
                                <select
                                    value={deliveryFields.supplier_id}
                                    onChange={(e) => {
                                        const selected = suppliers.find(
                                            (s) =>
                                                s.id ===
                                                parseInt(e.target.value)
                                        );
                                        setDeliveryFields((prev) => ({
                                            ...prev,
                                            supplier_id: e.target.value,
                                            supplier_name: selected
                                                ? selected.name
                                                : "",
                                        }));
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.supplier_id && (
                                <p className={errorClass}>
                                    {errors.supplier_id[0]}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>Purchase Date</label>
                            <input
                                type="date"
                                value={deliveryFields.purchase_date}
                                onChange={(e) =>
                                    setDeliveryFields((prev) => ({
                                        ...prev,
                                        purchase_date: e.target.value,
                                    }))
                                }
                                disabled={deliveryMatched}
                                className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                            />
                            {errors.purchase_date && (
                                <p className={errorClass}>
                                    {errors.purchase_date[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {deliveryMatched && (
                        <p className="text-xs text-green-600">
                            Delivery matched — supplier and date pre-filled and
                            locked.{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setDeliveryMatched(false);
                                    setDeliveryFields({
                                        voucher_no: "",
                                        invoice_no: "",
                                        supplier_id: "",
                                        supplier_name: "",
                                        purchase_date: "",
                                        order_no: "",
                                        notes: "",
                                    });
                                    setForm((prev) => ({
                                        ...prev,
                                        delivery_id: "",
                                    }));
                                }}
                                className="underline text-blue-500"
                            >
                                Clear
                            </button>
                        </p>
                    )}
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
                            {conditionOptions.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        {errors.condition && (
                            <p className={errorClass}>{errors.condition[0]}</p>
                        )}
                    </div>
                    {/* Status */}
                    <div>
                        <label className={labelClass}>Status</label>
                        {isEditMode ? (
                            <>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    disabled={form.status === "Assigned"}
                                    className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
                                >
                                    {form.status === "Assigned" && (
                                        <option value="Assigned">
                                            Assigned
                                        </option>
                                    )}
                                    {statusOptions
                                        .filter((s) => s !== "Assigned")
                                        .map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                </select>
                                {form.status === "Assigned" && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Status is locked while equipment is
                                        assigned. Use Return Equipment to change
                                        it.
                                    </p>
                                )}
                            </>
                        ) : (
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.status && (
                            <p className={errorClass}>{errors.status[0]}</p>
                        )}
                    </div>

                    {/* Employee assignment — add mode only, visible when Assigned is selected */}
                    {!isEditMode && form.status === "Assigned" && (
                        <div>
                            <label className={labelClass}>
                                Assign to Employee
                            </label>
                            <input
                                list="employee-list"
                                value={employeeSearch}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setEmployeeSearch(val);
                                    const match = employees.find(
                                        (emp) => emp.name === val
                                    );
                                    setEmployeeId(match ? match.id : "");
                                }}
                                placeholder="Type to search employee..."
                                className={inputClass}
                            />
                            <datalist id="employee-list">
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.name} />
                                ))}
                            </datalist>
                            {errors.employee_id && (
                                <p className={errorClass}>
                                    {errors.employee_id[0]}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading
                            ? "Saving..."
                            : isEditMode
                            ? "Update Equipment"
                            : "Save Equipment"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/equipment")}
                        className="bg-gray-100 text-gray-700 px-5 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
