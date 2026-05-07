import React, { useState } from "react";
import { FileSpreadsheet, Users, ClipboardList, Upload } from "lucide-react";
import api from "../../api/axios";

export default function BulkImport() {
    const [eqDownloading, setEqDownloading] = useState(false);
    const [eqUploading, setEqUploading] = useState(false);
    const [eqSelectedFile, setEqSelectedFile] = useState(null);
    const [eqImportResult, setEqImportResult] = useState(null);
    const [empDownloading, setEmpDownloading] = useState(false);
    const [empUploading, setEmpUploading] = useState(false);
    const [empSelectedFile, setEmpSelectedFile] = useState(null);
    const [empImportResult, setEmpImportResult] = useState(null);
    const [empDuplicates, setEmpDuplicates] = useState([]);

    const handleDownloadTemplate = async () => {
        setEqDownloading(true);
        try {
            const response = await api.get("/bulk-import/equipment-template", {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "equipment_template.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download equipment template:", error);
        } finally {
            setEqDownloading(false);
        }
    };

    const handleUpload = async () => {
        if (!eqSelectedFile) return;
        setEqUploading(true);
        setEqImportResult(null);
        try {
            const formData = new FormData();
            formData.append("file", eqSelectedFile);
            const response = await api.post(
                "/bulk-import/equipment",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            setEqImportResult(response.data);
            setEqSelectedFile(null);
        } catch (error) {
            console.error("Failed to import:", error);
        } finally {
            setEqUploading(false);
        }
    };

    const handleEmpDownloadTemplate = async () => {
        setEmpDownloading(true);
        try {
            const response = await api.get("/bulk-import/employee-template", {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "employee_template.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download employee template:", error);
        } finally {
            setEmpDownloading(false);
        }
    };

    const handleEmpUpload = async () => {
        if (!empSelectedFile) return;
        setEmpUploading(true);
        setEmpImportResult(null);
        setEmpDuplicates([]);
        try {
            const formData = new FormData();
            formData.append("file", empSelectedFile);
            const response = await api.post(
                "/bulk-import/employees",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            setEmpImportResult(response.data);
            if (response.data.duplicates?.length > 0) {
                setEmpDuplicates(response.data.duplicates);
            }
            setEmpSelectedFile(null);
        } catch (error) {
            console.error("Failed to import employees:", error);
        } finally {
            setEmpUploading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Bulk Import
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Download a template, fill it in, and upload to import
                    records in bulk.
                </p>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">
                {/* Equipment */}
                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <FileSpreadsheet size={20} className="text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-800">
                            Equipment
                        </h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Download the equipment template, fill in your records,
                        then upload to register multiple equipment items at
                        once.
                    </p>

                    {/* Actions Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleDownloadTemplate}
                            disabled={eqDownloading || eqUploading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FileSpreadsheet size={16} />
                            {eqDownloading
                                ? "Generating..."
                                : "Generate Template"}
                        </button>

                        {/* File Picker */}
                        <label
                            className={`flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors ${
                                eqDownloading || eqUploading
                                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                                    : "hover:bg-gray-50 cursor-pointer"
                            }`}
                        >
                            <Upload size={16} />
                            {eqSelectedFile
                                ? eqSelectedFile.name
                                : "Choose File"}
                            <input
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                disabled={eqDownloading || eqUploading}
                                onChange={(e) => {
                                    setEqSelectedFile(
                                        e.target.files[0] || null
                                    );
                                    setEqImportResult(null);
                                }}
                            />
                        </label>

                        {/* Upload Button */}
                        {eqSelectedFile && (
                            <button
                                onClick={handleUpload}
                                disabled={eqUploading}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {eqUploading ? "Importing..." : "Import"}
                            </button>
                        )}
                    </div>

                    {/* Result Area */}
                    {eqImportResult && (
                        <div className="mt-4 p-4 rounded border border-gray-200 bg-gray-50 text-sm space-y-2">
                            <p className="font-medium text-gray-700">
                                Import complete — {eqImportResult.imported}{" "}
                                record{eqImportResult.imported !== 1 ? "s" : ""}{" "}
                                imported successfully.
                            </p>
                            {eqImportResult.failures.length > 0 && (
                                <div>
                                    <p className="text-red-600 font-medium mb-1">
                                        {eqImportResult.failures.length} row
                                        {eqImportResult.failures.length !== 1
                                            ? "s"
                                            : ""}{" "}
                                        failed:
                                    </p>
                                    <ul className="space-y-1">
                                        {eqImportResult.failures.map((f, i) => (
                                            <li
                                                key={i}
                                                className="text-red-500"
                                            >
                                                <span className="font-medium">
                                                    Row {f.row}:
                                                </span>{" "}
                                                {f.errors.join(" ")}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <button
                                onClick={() => setEqImportResult(null)}
                                className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                                OK
                            </button>
                        </div>
                    )}
                </div>

                {/* Employees */}
                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Users size={20} className="text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-800">
                            Employees
                        </h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Download the employee template, fill in your records,
                        then upload to register multiple employees at once.
                    </p>

                    {/* Actions Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleEmpDownloadTemplate}
                            disabled={empDownloading || empUploading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FileSpreadsheet size={16} />
                            {empDownloading
                                ? "Generating..."
                                : "Generate Template"}
                        </button>

                        <label
                            className={`flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors ${
                                empDownloading || empUploading
                                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                                    : "hover:bg-gray-50 cursor-pointer"
                            }`}
                        >
                            <Upload size={16} />
                            {empSelectedFile
                                ? empSelectedFile.name
                                : "Choose File"}
                            <input
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                disabled={empDownloading || empUploading}
                                onChange={(e) => {
                                    setEmpSelectedFile(
                                        e.target.files[0] || null
                                    );
                                    setEmpImportResult(null);
                                    setEmpDuplicates([]);
                                }}
                            />
                        </label>

                        {empSelectedFile && (
                            <button
                                onClick={handleEmpUpload}
                                disabled={empUploading}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {empUploading ? "Importing..." : "Import"}
                            </button>
                        )}
                    </div>

                    {/* Result Area */}
                    {empImportResult && (
                        <div className="mt-4 p-4 rounded border border-gray-200 bg-gray-50 text-sm space-y-2">
                            <p className="font-medium text-gray-700">
                                Import complete — {empImportResult.imported}{" "}
                                record
                                {empImportResult.imported !== 1 ? "s" : ""}{" "}
                                imported successfully.
                            </p>

                            {/* Duplicate Names Panel */}
                            {empDuplicates.length > 0 && (
                                <div className="border border-yellow-300 bg-yellow-50 rounded p-3 space-y-2">
                                    <p className="text-yellow-700 font-medium">
                                        {empDuplicates.length} name
                                        {empDuplicates.length !== 1 ? "s" : ""}{" "}
                                        already exist in the system:
                                    </p>
                                    <ul className="space-y-1">
                                        {empDuplicates.map((d, i) => (
                                            <li
                                                key={i}
                                                className="text-yellow-600"
                                            >
                                                Row {d.row}: {d.name}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => setEmpDuplicates([])}
                                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
                                        >
                                            Skip All
                                        </button>
                                        <button
    onClick={async () => {
        try {
            const response = await api.post('/bulk-import/employees/force', {
                employees: empDuplicates,
            });
            setEmpDuplicates([]);
            setEmpImportResult(prev => ({
                ...prev,
                imported: prev.imported + response.data.imported,
            }));
        } catch (error) {
            console.error('Failed to force import:', error);
        }
    }}
    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
>
    Add Anyway
</button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setEmpImportResult(null);
                                    setEmpDuplicates([]);
                                }}
                                className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                                OK
                            </button>
                        </div>
                    )}
                </div>

                {/* Assignments — Coming Soon */}
                <div className="bg-white rounded-lg shadow p-5 opacity-50">
                    <div className="flex items-center gap-3 mb-2">
                        <ClipboardList size={20} className="text-gray-400" />
                        <h2 className="text-base font-semibold text-gray-600">
                            Assignments
                        </h2>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Coming Soon
                        </span>
                    </div>
                    <p className="text-sm text-gray-400">
                        Bulk import for assignments is not yet available.
                    </p>
                </div>
            </div>
        </div>
    );
}
