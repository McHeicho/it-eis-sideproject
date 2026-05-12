import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Laptop, ArrowLeft } from "lucide-react";
import api from "../../api/axios";

export default function EquipmentDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const response = await api.get(`/equipment/${id}`);
                setEquipment(response.data);
            } catch (error) {
                console.error("Failed to fetch equipment:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEquipment();
    }, [id]);

    const getStatusStyle = (status) => {
        const styles = {
            Available: "bg-green-100 text-green-700",
            Assigned: "bg-blue-100 text-blue-700",
            "Under Repair": "bg-yellow-100 text-yellow-700",
            "Lost/Missing": "bg-red-100 text-red-700",
            "Retired/Disposed": "bg-gray-100 text-gray-600",
            "Spare Unit": "bg-purple-100 text-purple-700",
        };
        return styles[status] || "bg-gray-100 text-gray-600";
    };

    const getConditionStyle = (condition) => {
        const styles = {
            Good: "bg-green-100 text-green-700",
            Defective: "bg-red-100 text-red-700",
        };
        return styles[condition] || "bg-gray-100 text-gray-600";
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="p-6 max-w-2xl">
                <div className="skeleton h-4 w-24 rounded mb-6"></div>
                <div className="skeleton h-6 w-48 rounded mb-2"></div>
                <div className="skeleton h-3 w-32 rounded mb-6"></div>
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <div className="skeleton h-3 w-28 rounded"></div>
                            <div className="skeleton h-3 w-40 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!equipment) {
        return (
            <div className="p-6 text-sm text-red-500">
                Equipment record not found.
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl">
            {/* Back Button */}
            <button
                onClick={() => navigate("/equipment")}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Equipment List
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Equipment Detail
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {equipment.brand?.name} — {equipment.model?.name}
                    </p>
                </div>
                {user.role_id === 1 && (
                    <button
                        onClick={() => navigate(`/equipment/${id}/edit`)}
                        className="bg-amber-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Equipment Type Banner */}
                <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-b">
                    <Laptop size={20} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                        {equipment.type?.name}
                    </span>
                </div>

                {/* Details Grid */}
                <div className="px-6 py-4 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Brand</span>
                        <span className="text-sm font-medium text-gray-800">
                            {equipment.brand?.name}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Model</span>
                        <span className="text-sm font-medium text-gray-800">
                            {equipment.model?.name}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">
                            Serial Number
                        </span>
                        <span className="text-sm font-mono text-gray-800">
                            {equipment.serial_number}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Supplier</span>
                        <span className="text-sm font-medium text-gray-800">
                            {equipment.delivery?.supplier?.name || "—"}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">
                            Purchase Date
                        </span>
                        <span className="text-sm text-gray-800">
                            {equipment.delivery?.purchase_date
                                ? new Date(
                                      equipment.delivery.purchase_date
                                  ).toLocaleDateString("en-PH", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                  })
                                : "—"}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">
                            {equipment.delivery?.voucher_no
                                ? "Voucher No."
                                : "Sales Invoice No."}
                        </span>
                        <span className="text-sm text-gray-800">
                            {equipment.delivery?.voucher_no ||
                                equipment.delivery?.invoice_no ||
                                "—"}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Condition</span>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionStyle(
                                equipment.condition
                            )}`}
                        >
                            {equipment.condition}
                        </span>
                    </div>

                    {/* Status Row with Placeholder Buttons */}
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-500">Status</span>
                        <div className="flex items-center gap-3">
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                                    equipment.status
                                )}`}
                            >
                                {equipment.status}
                            </span>
                            {(equipment.status === "Available" ||
                                equipment.status === "Spare Unit") && (
                                <button
                                    disabled
                                    className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium opacity-60 cursor-not-allowed"
                                >
                                    Assign Equipment
                                </button>
                            )}
                            {equipment.status === "Assigned" && (
                                <button
                                    disabled
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium opacity-60 cursor-not-allowed"
                                >
                                    Return Equipment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
