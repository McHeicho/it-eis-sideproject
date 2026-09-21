import React, { useState } from "react";
import { Download } from "lucide-react";
import api from "@/api/axios";
import { describeError } from "@/lib/errors";
import { Button } from "@/components/ui/custom/custom-button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";

export default function EquipmentReports() {
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");

    const handleExport = async () => {
        setExporting(true);
        setExportError("");
        try {
            // Through the axios client so the Bearer token, base URL and the
            // 401 redirect all apply. Files behind Sanctum come down as blobs;
            // a plain link would not carry the token.
            const response = await api.get("/equipment/export", {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `equipment-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setExportError(describeError(err, "Export failed. Please try again."));
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800 mb-1">Equipment Reports</h1>
            <p className="text-sm text-gray-500 mb-6">Export equipment data for review or record-keeping.</p>

            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>
                        <h2 className="text-sm font-semibold text-gray-700">Full Equipment Export</h2>
                    </CardTitle>
                    <CardDescription>
                        <p className="text-xs text-gray-400">
                            Exports all equipment records including receipt details and current assignment.
                        </p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="create"
                        size="lg"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        <Download size={16} />
                        {exporting ? "Exporting..." : "Export"}
                    </Button>
                    {exportError && (
                        <p role="alert" className="mt-3 text-xs text-red-500">
                            {exportError}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
