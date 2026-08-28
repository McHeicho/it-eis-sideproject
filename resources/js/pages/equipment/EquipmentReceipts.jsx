import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    ChevronDown,
    ChevronRight,
    Paperclip,
    Pencil,
    Laptop,
} from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/custom/custom-button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useLookups } from "@/queries/useLookups";
import { useDeliveries } from "@/queries/useDeliveries";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/custom/custom-select";

// Sentinels for the filter-bar Selects — Radix throws on an empty-string item
// value, so these stand in for "" ("All X") at the component boundary and get
// translated back in each onValueChange.
const SUPPLIER_ALL = "all";
const STATUS_ALL = "all";
// Used only by ReceiptDetail's inline-edit Supplier Select below, in case
// editForm.supplier_id is ever "" (delivery.supplier_id ?? "").
const SUPPLIER_NONE = "none";

const EMPTY_FILTERS = {
    voucher_no: "",
    invoice_no: "",
    order_no: "",
    supplier_id: "",
    no_attachment: false,
    serial_number: "",
    status: "",
};

export default function EquipmentReceipts() {
    const isAdmin =
        JSON.parse(localStorage.getItem("user") || "{}")?.role_id === 1;
    const [expandedId, setExpandedId] = useState(null);
    const [expandedData, setExpandedData] = useState({});
    const [expandLoading, setExpandLoading] = useState(null);
    const [filterForm, setFilterForm] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

    const queryClient = useQueryClient();

    const { data: lookups } = useLookups();
    const suppliers = lookups?.suppliers ?? [];
    const statuses = lookups?.statuses ?? [];

    const {
        data: deliveries = [],
        isPending: loading,
        isFetching,
    } = useDeliveries(appliedFilters);
    const filtering = isFetching && !loading;

    const handleExpand = async (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        if (expandedData[id]) return;
        setExpandLoading(id);
        try {
            const res = await api.get(`/deliveries/${id}`);
            setExpandedData((prev) => ({ ...prev, [id]: res.data }));
        } catch (error) {
            console.error("Failed to fetch delivery detail:", error);
        } finally {
            setExpandLoading(null);
        }
    };

    const handleDeliveryUpdated = (updatedDelivery) => {
        queryClient.setQueryData(
            ["deliveries", "list", appliedFilters],
            (prev) =>
                prev?.map((d) =>
                    d.id === updatedDelivery.id
            ? {
                ...d,
                voucher_no: updatedDelivery.voucher_no,
                invoice_no: updatedDelivery.invoice_no,
                purchase_date: updatedDelivery.purchase_date,
                supplier: updatedDelivery.supplier,
                supplier_id: updatedDelivery.supplier_id,
            }
            : d
        )
    );
        setExpandedData((prev) => ({
            ...prev,
            [updatedDelivery.id]: {
                ...prev[updatedDelivery.id],
                ...updatedDelivery,
            },
        }));
    };

    const handleFilter = () => {
        setExpandedId(null);
        setExpandedData({});
        setAppliedFilters(filterForm);
    };

    const handleReset = () => {
        setFilterForm(EMPTY_FILTERS);
        setExpandedId(null);
        setExpandedData({});
        setAppliedFilters(EMPTY_FILTERS);
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl space-y-3">
                <div className="skeleton h-6 w-48 rounded mb-4"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton h-14 w-full rounded"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Equipment Receipts
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Procurement records and delivery documents.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Voucher No.
                        </label>
                        <input
                            type="text"
                            value={filterForm.voucher_no}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    voucher_no: e.target.value,
                                }))
                            }
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleFilter()
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full"
                            placeholder="Enter Voucher No."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Invoice No.
                        </label>
                        <input
                            type="text"
                            value={filterForm.invoice_no}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    invoice_no: e.target.value,
                                }))
                            }
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleFilter()
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full"
                            placeholder="Enter Invoice No."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Purchase Order No.
                        </label>
                        <input
                            type="text"
                            value={filterForm.order_no}
                            onChange={(e) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    order_no: e.target.value,
                                }))
                            }
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleFilter()
                            }
                            className="border rounded px-2 py-1.5 text-sm w-full"
                            placeholder="Enter Purchase Order No."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">
                            Supplier
                        </label>
                        <Select
                            value={filterForm.supplier_id || SUPPLIER_ALL}
                            onValueChange={(value) =>
                                setFilterForm((prev) => ({
                                    ...prev,
                                    supplier_id:
                                        value === SUPPLIER_ALL ? "" : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SUPPLIER_ALL}>
                                    All Suppliers
                                </SelectItem>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">
                                Serial Number
                            </label>
                            <input
                                type="text"
                                value={filterForm.serial_number}
                                onChange={(e) =>
                                    setFilterForm((prev) => ({
                                        ...prev,
                                        serial_number: e.target.value,
                                    }))
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleFilter()
                                }
                                className="border rounded px-2 py-1.5 text-sm w-full"
                                placeholder="Starts with..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">
                                Equipment Status
                            </label>
                            <Select
                                value={filterForm.status || STATUS_ALL}
                                onValueChange={(value) =>
                                    setFilterForm((prev) => ({
                                        ...prev,
                                        status:
                                            value === STATUS_ALL ? "" : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={STATUS_ALL}>
                                        All Statuses
                                    </SelectItem>
                                    {statuses.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <input
                        type="checkbox"
                        id="no_attachment"
                        checked={filterForm.no_attachment}
                        onChange={(e) =>
                            setFilterForm((prev) => ({
                                ...prev,
                                no_attachment: e.target.checked,
                            }))
                        }
                        className="rounded border-gray-300"
                    />
                    <label
                        htmlFor="no_attachment"
                        className="text-xs text-gray-600 cursor-pointer"
                    >
                        Missing documents only
                    </label>
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-500 hover:bg-transparent hover:text-gray-700"
                        onClick={handleReset}
                        disabled={filtering}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="create"
                        size="sm"
                        className="text-xs"
                        onClick={handleFilter}
                        disabled={filtering}
                    >
                        {filtering ? "Filtering..." : "Filter"}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">Supplier</div>
                    <div className="col-span-2">Voucher No.</div>
                    <div className="col-span-2">Invoice No.</div>
                    <div className="col-span-2">Purchase Date</div>
                    <div className="col-span-2 text-right">Equipment</div>
                </div>

                {/* Rows */}
                {deliveries.length === 0 && (
                    <div className="px-6 py-8 text-sm text-gray-400 text-center">
                        No receipts found.
                    </div>
                )}

                {deliveries.map((delivery) => (
                    <div key={delivery.id} className="border-b last:border-0">
                        {/* Summary Row */}
                        <button
                            onClick={() => handleExpand(delivery.id)}
                            className="grid grid-cols-12 gap-4 px-6 py-4 w-full text-left hover:bg-gray-50 transition-colors"
                        >
                            <div className="col-span-1 flex items-center">
                                {expandedId === delivery.id ? (
                                    <ChevronDown
                                        size={16}
                                        className="text-gray-400"
                                    />
                                ) : (
                                    <ChevronRight
                                        size={16}
                                        className="text-gray-400"
                                    />
                                )}
                            </div>
                            <div className="col-span-3 text-sm font-medium text-gray-800">
                                {delivery.supplier?.name || "—"}
                            </div>
                            <div className="col-span-2 text-sm text-gray-600">
                                {delivery.voucher_no || "—"}
                            </div>
                            <div className="col-span-2 text-sm text-gray-600">
                                {delivery.invoice_no || "—"}
                            </div>
                            <div className="col-span-2 text-sm text-gray-600">
                                {delivery.purchase_date
                                    ? new Date(
                                          delivery.purchase_date
                                      ).toLocaleDateString("en-PH", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "—"}
                            </div>
                            <div className="col-span-2 text-sm text-gray-600 text-right">
                                {delivery.equipment_count} item
                                {delivery.equipment_count !== 1 ? "s" : ""}
                            </div>
                        </button>

                        {/* Expanded Row */}
                        {expandedId === delivery.id && (
                            <div className="px-6 pb-4 bg-gray-50 border-t">
                                {expandLoading === delivery.id ? (
                                    <div className="py-4 space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="skeleton h-8 w-full rounded"
                                            ></div>
                                        ))}
                                    </div>
                                ) : expandedData[delivery.id] ? (
                                    <ReceiptDetail
                                        delivery={expandedData[delivery.id]}
                                        suppliers={suppliers}
                                        onDeliveryUpdated={
                                            handleDeliveryUpdated
                                        }
                                        onAttachmentUploaded={(attachment) => {
                                            setExpandedData((prev) => ({
                                                ...prev,
                                                [delivery.id]: {
                                                    ...prev[delivery.id],
                                                    attachments: [attachment],
                                                },
                                            }));
                                        }}
                                        onAttachmentRemoved={(attachmentId) => {
                                            setExpandedData((prev) => ({
                                                ...prev,
                                                [delivery.id]: {
                                                    ...prev[delivery.id],
                                                    attachments: prev[
                                                        delivery.id
                                                    ].attachments.filter(
                                                        (a) =>
                                                            a.id !==
                                                            attachmentId
                                                    ),
                                                },
                                            }));
                                        }}
                                    />
                                ) : null}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const TYPE_ICONS = {
    Laptop: Laptop,
};

function ReceiptDetail({
    delivery,
    suppliers,
    onDeliveryUpdated,
    onAttachmentUploaded,
    onAttachmentRemoved,
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const [isAdmin] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"))?.role_id === 1;
        } catch {
            return false;
        }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const handleEditStart = () => {
        setIsEditing(true);
        setEditForm({
            voucher_no: delivery.voucher_no ?? "",
            invoice_no: delivery.invoice_no ?? "",
            supplier_id: delivery.supplier_id ?? "",
            purchase_date: delivery.purchase_date
                ? delivery.purchase_date.slice(0, 10)
                : "",
            order_no: delivery.order_no ?? "",
            notes: delivery.notes ?? "",
        });
        setSaveError("");
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditForm({});
        setSaveError("");
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError("");
        const payload = {
            voucher_no: editForm.voucher_no === "" ? null : editForm.voucher_no,
            invoice_no: editForm.invoice_no === "" ? null : editForm.invoice_no,
            supplier_id: editForm.supplier_id,
            purchase_date: editForm.purchase_date,
            order_no: editForm.order_no === "" ? null : editForm.order_no,
            notes: editForm.notes === "" ? null : editForm.notes,
        };
        try {
            const res = await api.patch(`/deliveries/${delivery.id}`, payload);
            onDeliveryUpdated(res.data);
            setIsEditing(false);
            setEditForm({});
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)?.[0]?.[0];
                setSaveError(firstError || "Validation failed.");
            } else {
                setSaveError("Failed to save. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0] || null);
        setUploadError("");
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setUploadError("");

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await api.post(
                `/deliveries/${delivery.id}/attachments`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            onAttachmentUploaded(res.data);
            setSelectedFile(null);
        } catch (error) {
            if (error.response?.status === 422) {
                setUploadError(
                    error.response.data.errors?.file?.[0] || "Invalid file."
                );
            } else {
                setUploadError("Upload failed. Please try again.");
            }
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "—";
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleRemove = async (attachmentId) => {
        try {
            await api.delete(
                `/deliveries/${delivery.id}/attachments/${attachmentId}`
            );
            onAttachmentRemoved(attachmentId);
        } catch (error) {
            console.error("Failed to remove attachment:", error);
        }
    };

    return (
        <div className="pt-4 space-y-5">
            {/* Receipt Details */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Receipt Details
                    </p>
                    {isAdmin && !isEditing && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 px-0 text-xs text-gray-400 hover:bg-transparent hover:text-action-edit"
                            onClick={handleEditStart}
                        >
                            <Pencil size={12} />
                            Edit
                        </Button>
                    )}
                </div>
                <div className="bg-white border rounded divide-y text-sm">
                    {/* Voucher No. */}
                    <div className="flex items-center px-4 py-2 gap-3">
                        <span className="text-xs text-gray-500 w-36 shrink-0">
                            Voucher No.
                        </span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.voucher_no}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        voucher_no: e.target.value,
                                    }))
                                }
                                className="border rounded px-2 py-1 text-sm flex-1"
                            />
                        ) : (
                            <span className="text-gray-800 flex-1">
                                {delivery.voucher_no || "—"}
                            </span>
                        )}
                    </div>
                    {/* Invoice No. */}
                    <div className="flex items-center px-4 py-2 gap-3">
                        <span className="text-xs text-gray-500 w-36 shrink-0">
                            Invoice No.
                        </span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.invoice_no}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        invoice_no: e.target.value,
                                    }))
                                }
                                className="border rounded px-2 py-1 text-sm flex-1"
                            />
                        ) : (
                            <span className="text-gray-800 flex-1">
                                {delivery.invoice_no || "—"}
                            </span>
                        )}
                    </div>
                    {/* Supplier */}
                    <div className="flex items-center px-4 py-2 gap-3">
                        <span className="text-xs text-gray-500 w-36 shrink-0">
                            Supplier
                        </span>
                        {isEditing ? (
                            <Select
                                value={editForm.supplier_id || SUPPLIER_NONE}
                                onValueChange={(value) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        supplier_id:
                                            value === SUPPLIER_NONE
                                                ? ""
                                                : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                        ) : (
                            <span className="text-gray-800 flex-1">
                                {delivery.supplier?.name || "—"}
                            </span>
                        )}
                    </div>
                    {/* Purchase Date */}
                    <div className="flex items-center px-4 py-2 gap-3">
                        <span className="text-xs text-gray-500 w-36 shrink-0">
                            Purchase Date
                        </span>
                        {isEditing ? (
                            <input
                                type="date"
                                value={editForm.purchase_date}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        purchase_date: e.target.value,
                                    }))
                                }
                                className="border rounded px-2 py-1 text-sm flex-1"
                            />
                        ) : (
                            <span className="text-gray-800 flex-1">
                                {delivery.purchase_date
                                    ? new Date(
                                          delivery.purchase_date
                                      ).toLocaleDateString("en-PH", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "—"}
                            </span>
                        )}
                    </div>
                    {/* Purchase Order No. */}
                    <div className="flex items-center px-4 py-2 gap-3">
                        <span className="text-xs text-gray-500 w-36 shrink-0">
                            Purchase Order No.
                        </span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.order_no}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        order_no: e.target.value,
                                    }))
                                }
                                className="border rounded px-2 py-1 text-sm flex-1"
                            />
                        ) : (
                            <span className="text-gray-800 flex-1">
                                {delivery.order_no || "—"}
                            </span>
                        )}
                    </div>
                    {/* Notes */}
                    <div className="flex items-start px-4 py-2 gap-3">
                        <span className="text-xs text-gray-500 w-36 shrink-0 pt-1">
                            Notes
                        </span>
                        {isEditing ? (
                            <Textarea
                                value={editForm.notes}
                                onChange={(e) =>
                                    setEditForm((prev) => ({
                                        ...prev,
                                        notes: e.target.value,
                                    }))
                                }
                                aria-label="Notes"
                                className="flex-1"
                                rows={3}
                            />
                        ) : (
                            <span
                                className={`flex-1 ${
                                    delivery.notes
                                        ? "text-gray-800"
                                        : "text-gray-400 italic"
                                }`}
                            >
                                {delivery.notes || "no notes provided"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Save / Cancel */}
            {isEditing && (
                <div className="flex items-center gap-3">
                    {saveError && (
                        <p className="text-xs text-red-500 flex-1">
                            {saveError}
                        </p>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500 hover:bg-transparent hover:text-gray-700"
                            onClick={handleEditCancel}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="create"
                            size="sm"
                            className="text-xs"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Linked Equipment */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Linked Equipment
                </p>
                {delivery.equipment?.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        No equipment linked to this receipt.
                    </p>
                ) : (
                    <div className="rounded border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-100 text-xs text-gray-500 uppercase">
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableHead className="px-4 py-2 h-auto font-normal text-inherit">
                                        Type
                                    </TableHead>
                                    <TableHead className="px-4 py-2 h-auto font-normal text-inherit">
                                        Brand
                                    </TableHead>
                                    <TableHead className="px-4 py-2 h-auto font-normal text-inherit">
                                        Model
                                    </TableHead>
                                    <TableHead className="px-4 py-2 h-auto font-normal text-inherit">
                                        Serial No.
                                    </TableHead>
                                    <TableHead className="px-4 py-2 h-auto font-normal text-inherit">
                                        Condition
                                    </TableHead>
                                    <TableHead className="px-4 py-2 h-auto font-normal text-inherit">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 bg-white">
                                {delivery.equipment.map((eq) => (
                                    <TableRow key={eq.id} className="border-0 hover:bg-transparent">
                                        <TableCell className="px-4 py-2">
                                            {(() => {
                                                const Icon =
                                                    TYPE_ICONS[eq.type?.name];
                                                return Icon ? (
                                                    <Icon
                                                        size={15}
                                                        className="text-gray-500"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            {eq.brand?.name || "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            {eq.model?.name || "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-2 font-mono text-xs">
                                            {eq.serial_number}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            {eq.condition}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            {eq.status}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Documents */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Documents
                </p>

                {/* Empty state */}
                {delivery.attachments?.length === 0 && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between bg-white border rounded px-4 py-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-400 italic">
                                <Paperclip
                                    size={14}
                                    className="text-gray-300"
                                />
                                No documents provided.
                            </div>
                            <label className="cursor-pointer border rounded px-3 py-1.5 text-xs font-medium bg-green-500 text-white hover:bg-green-600 border-green-500 transition-colors">
                                Choose PDF
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* Existing attachments */}
                {delivery.attachments?.length > 0 && (
                    <div className="mb-3 space-y-2">
                        {delivery.attachments.map((att) => (
                            <div
                                key={att.id}
                                className="flex items-center justify-between bg-white border rounded px-4 py-2 text-sm"
                            >
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Paperclip
                                        size={14}
                                        className="text-gray-400"
                                    />
                                    {att.original_filename}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>{formatFileSize(att.file_size)}</span>
                                    <span>{att.uploaded_by_name || "—"}</span>
                                    <a
                                        href={`/storage/${att.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-600 transition-colors"
                                    >
                                        View
                                    </a>
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-red-400 hover:text-red-600 hover:no-underline"
                                        onClick={() => handleRemove(att.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Replace PDF + Upload */}
                <div className="flex items-center gap-3">
                    {delivery.attachments?.length > 0 && (
                        <label className="cursor-pointer border rounded px-3 py-2 text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 border-amber-500 transition-colors">
                            Replace PDF
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    )}
                    {selectedFile && (
                        <>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                                {selectedFile.name}
                            </span>
                            <Button
                                variant="create"
                                size="lg"
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? "Uploading..." : "Upload"}
                            </Button>
                        </>
                    )}
                </div>
                {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                )}
            </div>
        </div>
    );
}
