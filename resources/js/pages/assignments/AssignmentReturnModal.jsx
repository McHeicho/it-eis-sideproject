import React, { useState } from "react";
import api from "@/api/axios";
import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/custom/custom-button";
import { toast } from "sonner";

const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const errorClass = "text-red-500 text-xs mt-1";

const formatDate = (date) =>
    date
        ? new Date(date).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : "—";

export default function AssignmentReturnModal({ assignment, onClose, onReturned }) {
    const [returnForm, setReturnForm] = useState({
        date_returned: new Date().toISOString().split("T")[0],
        notes: "",
    });
    const [returnErrors, setReturnErrors] = useState({});
    const [returning, setReturning] = useState(false);

    const handleReturn = async (e) => {
        e.preventDefault();
        setReturning(true);
        setReturnErrors({});
        try {
            await api.patch(`/assignments/${assignment.id}/return`, returnForm);
            // onReturned() triggers the parent's invalidateAssignmentData now —
            // cleanup #6 landed as TanStack Query, not the originally-planned
            // Zustand store. Toast stays decoupled from this line, keyed to
            // dismissal — see AssignModal.
            await onReturned();
            onClose();
            toast.success("Equipment returned");
        } catch (error) {
            if (error.response?.status === 422) {
                setReturnErrors(error.response.data.errors);
            } else {
                console.error("Failed to return:", error);
            }
        } finally {
            setReturning(false);
        }
    };

    return (
        <AppDialog
            open
            onOpenChange={(o) => { if (!o) onClose(); }}
            title="Return Equipment"
            footer={
                <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="return-form"
                        disabled={returning}
                    >
                        {returning ? "Processing..." : "Confirm Return"}
                    </Button>
                </div>
            }
        >
            {/* Read-only summary */}
            <div className="-mx-6 -mt-4 px-6 py-3 bg-gray-50 border-b mb-4 space-y-1">
                <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                        Equipment:{" "}
                    </span>
                    {assignment.equipment?.brand?.name}{" "}
                    {assignment.equipment?.model?.name} —{" "}
                    {assignment.equipment?.serial_number}
                </p>
                <p className="text-xs text-gray-500">
                    {assignment.employee ? (
                        <>
                            <span className="font-medium text-gray-700">
                                Assigned to:{" "}
                            </span>
                            {assignment.employee?.name} (
                            {assignment.employee?.department_tag})
                        </>
                    ) : (
                        <>
                            <span className="font-medium text-gray-700">
                                Held at:{" "}
                            </span>
                            {assignment.branch?.branch_name}
                        </>
                    )}
                </p>
                <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                        Date Assigned:{" "}
                    </span>
                    {formatDate(assignment.date_assigned)}
                </p>
            </div>

            <form id="return-form" onSubmit={handleReturn}>
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Date Returned</label>
                        <input
                            type="date"
                            value={returnForm.date_returned}
                            onChange={(e) =>
                                setReturnForm({
                                    ...returnForm,
                                    date_returned: e.target.value,
                                })
                            }
                            className={inputClass}
                        />
                        {returnErrors.date_returned && (
                            <p className={errorClass}>
                                {returnErrors.date_returned[0]}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Notes</label>
                        <textarea
                            value={returnForm.notes}
                            onChange={(e) =>
                                setReturnForm({
                                    ...returnForm,
                                    notes: e.target.value,
                                })
                            }
                            className={`${inputClass} resize-none`}
                            rows={3}
                            placeholder="Optional notes on return condition..."
                        />
                    </div>
                </div>
            </form>
        </AppDialog>
    );
}
