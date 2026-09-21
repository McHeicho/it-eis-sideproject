import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Laptop, ArrowLeft } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/custom/custom-button";
import { toast } from "sonner";
import StatusBadge from "@/components/ui/StatusBadge";
import ConditionBadge from "@/components/ui/ConditionBadge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEquipmentDetail } from "@/queries/useEquipmentDetail";
import { holderLabel } from "@/lib/equipment";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError } from "@/lib/errors";

export default function EquipmentDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const { data: live, isPending, isError, error, refetch } = useEquipmentDetail(id);

    const [shown, setShown] = useState(null);
    const shownRef = useRef(null);

    // A new id is a different record, not a live update to this one —
    // reset silently (and drop any lingering toast) before it can be
    // mistaken for a change.
    useEffect(() => {
        shownRef.current = null;
        setShown(null);
        return () => toast.dismiss("equipment-detail-updated");
        }, [id]);

    // First paint for this id seeds silently. After that, compare the
    // whole payload — a timestamp alone would miss a brand/model rename,
    // since that touches the related row, not this one.
    useEffect(() => {
        if (!live) return;

        if (shownRef.current === null) {
            shownRef.current = live;
            setShown(live);
            return;
        }

        if (JSON.stringify(live) !== JSON.stringify(shownRef.current)) {
            toast("This record has been updated.", {
                id: "equipment-detail-updated",
                action: {
                    label: "Refresh",
                    onClick: () => {
                        shownRef.current = live;
                        setShown(live);
                    },
                },
                duration: Infinity,
            });
        }
        }, [live]);

        const equipment = shown;
        const loading = shown === null && isPending;

    // Loading skeleton — back link, header, then the same Card as the loaded
    // panel so radius, ring and shadow do not change on swap.
    if (loading) {
        return (
            <div className="p-6 max-w-2xl">
                <Skeleton className="h-4 w-24 rounded mb-6" />
                <Skeleton className="h-6 w-48 rounded mb-2" />
                <Skeleton className="h-3 w-32 rounded mb-6" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-4 w-20 rounded" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex justify-between py-2">
                                <Skeleton className="h-3 w-28 rounded" />
                                <Skeleton className="h-3 w-40 rounded" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!equipment) {
        const notFound = error?.response?.status === 404;
        return (
            <div className="p-6 max-w-2xl">
                <p role="alert" className="text-sm text-red-500">
                    {notFound
                        ? "Equipment record not found."
                        : describeError(error, "Could not load this equipment record.")}
                </p>
                <div className="flex gap-2 mt-4">
                    {isError && !notFound && (
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                            Retry
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate("/equipment")}>
                        Back to Equipment List
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-0 text-sm text-gray-500 hover:bg-transparent hover:text-gray-700 mb-6"
                onClick={() => navigate("/equipment")}
            >
                <ArrowLeft size={16} />
                Back to Equipment List
            </Button>

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
                    <Button
                        variant="edit"
                        size="lg"
                        onClick={() => navigate(`/equipment/${id}/edit`)}
                    >
                        Edit
                    </Button>
                )}
            </div>

            {/* Details Card */}
            <Card>
                {/* Equipment Type Banner */}
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Laptop size={20} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                            {equipment.type?.name}
                        </span>
                    </div>
                </CardHeader>

                {/* Details Grid */}
                <CardContent className="space-y-4">
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
                        <ConditionBadge condition={equipment.condition} />
                    </div>

                    {/* Status Row with Placeholder Buttons */}
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-500">Status</span>
                        {equipment.status === "Assigned" && holderLabel(equipment.current_assignment) ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <StatusBadge status={equipment.status} />
                                </TooltipTrigger>
                                <TooltipContent side="top" align="end">
                                    {holderLabel(equipment.current_assignment)}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <StatusBadge status={equipment.status} />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
