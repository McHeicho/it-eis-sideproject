import React, { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/custom/custom-button";

export default function EquipmentReports() {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/equipment/export", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `equipment-${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800 mb-1">Equipment Reports</h1>
            <p className="text-sm text-gray-500 mb-6">Export equipment data for review or record-keeping.</p>

            <div className="bg-white rounded-lg shadow-sm border p-5 max-w-md">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Full Equipment Export</h2>
                <p className="text-xs text-gray-400 mb-4">
                    Exports all equipment records including receipt details and current assignment.
                </p>
                <Button
                    variant="create"
                    size="lg"
                    onClick={handleExport}
                    disabled={exporting}
                >
                    <Download size={16} />
                    {exporting ? "Exporting..." : "Export"}
                </Button>
            </div>
        </div>
    );
}