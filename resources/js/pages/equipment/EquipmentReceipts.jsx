import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Paperclip } from "lucide-react";
import api from "../../api/axios";

export default function EquipmentReceipts() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [expandedData, setExpandedData] = useState({});
    const [expandLoading, setExpandLoading] = useState(null);

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const res = await api.get("/deliveries");
                setDeliveries(res.data);
            } catch (error) {
                console.error("Failed to fetch deliveries:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeliveries();
    }, []);

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

    const labelClass = "text-xs text-gray-500";
    const valueClass = "text-sm font-medium text-gray-800";

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
function ReceiptDetail({
    delivery,
    onAttachmentUploaded,
    onAttachmentRemoved,
}) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

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
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Brand
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Model
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Serial No.
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Condition
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {delivery.equipment.map((eq) => (
                                    <tr key={eq.id}>
                                        <td className="px-4 py-2">
                                            {eq.brand?.name || "—"}
                                        </td>
                                        <td className="px-4 py-2">
                                            {eq.model?.name || "—"}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-xs">
                                            {eq.serial_number}
                                        </td>
                                        <td className="px-4 py-2">
                                            {eq.condition}
                                        </td>
                                        <td className="px-4 py-2">
                                            {eq.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Attachments */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Documents
                </p>

                {/* Existing Attachments */}
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
    <span>{att.uploaded_by_name || '—'}</span>
    <a
    href={`/storage/${att.file_path}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-400 hover:text-blue-600 transition-colors"
>
    View
</a>
    <button
        onClick={() => handleRemove(att.id)}
        className="text-red-400 hover:text-red-600 transition-colors"
    >
        Remove
    </button>
</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Input */}
                <div className="flex items-center gap-3">
                    <label
                        className={`cursor-pointer border rounded px-3 py-2 text-sm font-medium transition-colors ${
                            delivery.attachments?.length > 0
                                ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
                                : "bg-green-500 text-white hover:bg-green-600 border-green-500"
                        }`}
                    >
                        {delivery.attachments?.length > 0
                            ? "Replace PDF"
                            : "Choose PDF"}
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>

                    {selectedFile && (
                        <>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                                {selectedFile.name}
                            </span>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {uploading ? "Uploading..." : "Upload"}
                            </button>
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
