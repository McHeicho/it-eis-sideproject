import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Laptop } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { useLookups } from "@/queries/useLookups";
import { Button } from "@/components/ui/custom/custom-button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxList,
    ComboboxItem,
} from "@/components/ui/combobox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/custom/custom-select";

// Sentinels for the form Selects — Radix throws on an empty-string item
// value, so these stand in for "" ("nothing chosen yet") at the component
// boundary and get translated back in each onValueChange.
const BRAND_NONE = "none";
const MODEL_NONE = "none";
const SUPPLIER_NONE = "none";
const CONDITION_NONE = "none";

export default function EquipmentAdd() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [models, setModels] = useState([]);
    const [lastSeenUpdatedAt, setLastSeenUpdatedAt] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
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
            setSelectedEmployee(null);
        }
        setForm({ ...form, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    // Select variant of handleChange — Radix hands onValueChange the bare
    // value instead of an event.
    const handleSelectChange = (name, value) => {
        if (name === "status" && value !== "Assigned") {
            setSelectedEmployee(null);
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

        if (!isEditMode && form.status === "Assigned" && !selectedEmployee) {
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
            ...(!isEditMode && form.status === "Assigned" && selectedEmployee
                ? { employee_id: selectedEmployee.id }
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
                className="bg-white rounded-lg shadow p-6"
            >
                <FieldGroup className="gap-5">
                {/* Equipment Type */}
                <Field>
                    <FieldLabel>Equipment Type</FieldLabel>
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
                        <FieldError>
                            {errors.equipment_type_id[0]}
                        </FieldError>
                    )}
                </Field>

                {/* Brand */}
                <Field>
                    <FieldLabel htmlFor="brand_id">Brand</FieldLabel>
                    <Select
                        value={String(form.brand_id || BRAND_NONE)}
                        onValueChange={(value) =>
                            handleSelectChange(
                                "brand_id",
                                value === BRAND_NONE ? "" : value
                            )
                        }
                    >
                        <SelectTrigger
                            id="brand_id"
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
                                <SelectItem
                                    key={brand.id}
                                    value={String(brand.id)}
                                >
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.brand_id && (
                        <FieldError>{errors.brand_id[0]}</FieldError>
                    )}
                </Field>

                {/* Model */}
                <Field>
                    <FieldLabel htmlFor="model_id">Model</FieldLabel>
                    <Select
                        value={String(form.model_id || MODEL_NONE)}
                        onValueChange={(value) =>
                            handleSelectChange(
                                "model_id",
                                value === MODEL_NONE ? "" : value
                            )
                        }
                        disabled={!form.brand_id}
                    >
                        <SelectTrigger
                            id="model_id"
                            className="w-full"
                            aria-invalid={!!errors.model_id}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={MODEL_NONE}>
                                {form.brand_id
                                    ? "Select Model"
                                    : "Select a brand first"}
                            </SelectItem>
                            {models.map((model) => (
                                <SelectItem
                                    key={model.id}
                                    value={String(model.id)}
                                >
                                    {model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.model_id && (
                        <FieldError>{errors.model_id[0]}</FieldError>
                    )}
                </Field>

                {/* Serial Number */}
                <Field>
                    <FieldLabel htmlFor="serial_number">Serial Number</FieldLabel>
                    <Input
                        id="serial_number"
                        type="text"
                        name="serial_number"
                        value={form.serial_number}
                        onChange={handleChange}
                        placeholder="e.g. PF123456"
                    />
                    {errors.serial_number && (
                        <FieldError>{errors.serial_number[0]}</FieldError>
                    )}
                </Field>

                {/* Delivery */}
                <FieldSet className="gap-3">
                    <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="delivery-handle">
                            {deliveryMode === "voucher"
                                ? "Voucher No."
                                : "Sales Invoice No."}
                        </FieldLabel>
                        <div className="flex gap-1 text-xs">
                            <p className="text-xs text-gray-500">
                                {deliveryMode === "voucher" ? (
                                    <>
                                        No voucher number?{" "}
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 align-baseline underline text-blue-500"
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
                                        >
                                            Use invoice number instead
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        Have a voucher number?{" "}
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 align-baseline underline text-blue-500"
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
                                        >
                                            Switch back to voucher
                                        </Button>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Handle input */}
                    <div className="relative">
                        <Input
                            id="delivery-handle"
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
                            className="pr-8"
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
                        <Field>
                            <FieldLabel htmlFor="supplier_id">Supplier</FieldLabel>
                            {deliveryMatched ? (
                                <Input
                                    id="supplier_id"
                                    type="text"
                                    value={deliveryFields.supplier_name}
                                    disabled
                                    className="disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            ) : (
                                <Select
                                    value={
                                        deliveryFields.supplier_id ||
                                        SUPPLIER_NONE
                                    }
                                    onValueChange={(value) => {
                                        const selected = suppliers.find(
                                            (s) => s.id === parseInt(value)
                                        );
                                        setDeliveryFields((prev) => ({
                                            ...prev,
                                            supplier_id:
                                                value === SUPPLIER_NONE
                                                    ? ""
                                                    : value,
                                            supplier_name: selected
                                                ? selected.name
                                                : "",
                                        }));
                                    }}
                                >
                                    <SelectTrigger
                                        id="supplier_id"
                                        className="w-full"
                                        aria-invalid={!!errors.supplier_id}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={SUPPLIER_NONE}>
                                            Select Supplier
                                        </SelectItem>
                                        {suppliers.map((s) => (
                                            <SelectItem
                                                key={s.id}
                                                value={String(s.id)}
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {errors.supplier_id && (
                                <FieldError>
                                    {errors.supplier_id[0]}
                                </FieldError>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="purchase_date">Purchase Date</FieldLabel>
                            <Input
                                id="purchase_date"
                                type="date"
                                value={deliveryFields.purchase_date}
                                onChange={(e) =>
                                    setDeliveryFields((prev) => ({
                                        ...prev,
                                        purchase_date: e.target.value,
                                    }))
                                }
                                disabled={deliveryMatched}
                                className="disabled:bg-gray-100 disabled:text-gray-400"
                            />
                            {errors.purchase_date && (
                                <FieldError>
                                    {errors.purchase_date[0]}
                                </FieldError>
                            )}
                        </Field>
                    </div>

                    {deliveryMatched && (
                        <p className="text-xs text-green-600">
                            Delivery matched — supplier and date pre-filled and
                            locked.{" "}
                            <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 align-baseline underline text-blue-500"
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
                            >
                                Clear
                            </Button>
                        </p>
                    )}
                </FieldSet>

                {/* Condition + Status */}
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="condition">Condition</FieldLabel>
                        <Select
                            value={form.condition || CONDITION_NONE}
                            onValueChange={(value) =>
                                handleSelectChange(
                                    "condition",
                                    value === CONDITION_NONE ? "" : value
                                )
                            }
                        >
                            <SelectTrigger
                                id="condition"
                                className="w-full"
                                aria-invalid={!!errors.condition}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={CONDITION_NONE}>
                                    Select Condition
                                </SelectItem>
                                {conditionOptions.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.condition && (
                            <FieldError>{errors.condition[0]}</FieldError>
                        )}
                    </Field>
                    {/* Status */}
                    <Field>
                        <FieldLabel htmlFor="status">Status</FieldLabel>
                        {isEditMode ? (
                            <>
                                <Select
                                    value={form.status}
                                    onValueChange={(value) =>
                                        handleSelectChange("status", value)
                                    }
                                    disabled={form.status === "Assigned"}
                                >
                                    <SelectTrigger
                                        id="status"
                                        className="w-full"
                                        aria-invalid={!!errors.status}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {form.status === "Assigned" && (
                                            <SelectItem value="Assigned">
                                                Assigned
                                            </SelectItem>
                                        )}
                                        {statusOptions
                                            .filter((s) => s !== "Assigned")
                                            .map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {form.status === "Assigned" && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Status is locked while equipment is
                                        assigned. Use Return Equipment to change
                                        it.
                                    </p>
                                )}
                            </>
                        ) : (
                            <Select
                                value={form.status}
                                onValueChange={(value) =>
                                    handleSelectChange("status", value)
                                }
                            >
                                <SelectTrigger
                                    id="status"
                                    className="w-full"
                                    aria-invalid={!!errors.status}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.status && (
                            <FieldError>{errors.status[0]}</FieldError>
                        )}
                    </Field>

                    {/* Employee assignment — add mode only, visible when Assigned is selected */}
                    {!isEditMode && form.status === "Assigned" && (
                        <Field>
                            <FieldLabel htmlFor="employee-combobox">
                                Assign to Employee
                            </FieldLabel>
                            <Combobox
                                items={employees}
                                itemToStringValue={(emp) => emp.name}
                                value={selectedEmployee}
                                onValueChange={setSelectedEmployee}
                            >
                                <ComboboxInput
                                    id="employee-combobox"
                                    placeholder="Type to search employee..."
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        No employees found.
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(emp) => (
                                            <ComboboxItem
                                                key={emp.id}
                                                value={emp}
                                            >
                                                <span>{emp.name}</span>
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    {emp.department_tag}
                                                </span>
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            {errors.employee_id && (
                                <FieldError>
                                    {errors.employee_id[0]}
                                </FieldError>
                            )}
                        </Field>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="submit"
                        variant="create"
                        size="lg"
                        disabled={loading}
                    >
                        {loading
                            ? "Saving..."
                            : isEditMode
                            ? "Update Equipment"
                            : "Save Equipment"}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={() => navigate("/equipment")}
                    >
                        Cancel
                    </Button>
                </div>
                </FieldGroup>
            </form>
        </div>
    );
}
