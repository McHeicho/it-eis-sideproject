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
    const [empDuplicateIndex, setEmpDuplicateIndex] = useState(0);
    const [empDecisions, setEmpDecisions] = useState([]);
    const [empCurrentChecks, setEmpCurrentChecks] = useState({
        left: false,
        right: false,
    });

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
            if (
                response.data.imported === 0 &&
                response.data.duplicates.length > 0 &&
                response.data.duplicates.every(
                    (d) => d.department_tag === d.existing_department_tag
                )
            ) {
                setEmpImportResult({ allDuplicates: true });
            } else {
                setEmpImportResult(response.data);
                if (response.data.duplicates?.length > 0) {
                    setEmpDuplicates(response.data.duplicates);
                }
            }
            setEmpSelectedFile(null);
        } catch (error) {
            console.error("Failed to import employees:", error);
        } finally {
            setEmpUploading(false);
        }
    };

    const handleCancelDuplicates = () => {
        setEmpDuplicates([]);
        setEmpDecisions([]);
        setEmpDuplicateIndex(0);
        setEmpCurrentChecks({ left: false, right: false });
    };

    const handleDuplicateDecision = async () => {
        const current = empDuplicates[empDuplicateIndex];
        const decision = {
            name: current.name,
            department_tag: current.department_tag,
            existing_department_tag: current.existing_department_tag,
            update: !empCurrentChecks.left && empCurrentChecks.right,
            addNew: empCurrentChecks.left && empCurrentChecks.right,
        };

        const newDecisions = [...empDecisions, decision];

        if (empDuplicateIndex === empDuplicates.length - 1) {
            // Last duplicate — fire batch request
            try {
                const response = await api.post(
                    "/bulk-import/employees/force",
                    {
                        decisions: newDecisions,
                    }
                );
                setEmpImportResult((prev) => ({
                    ...prev,
                    imported: prev.imported + response.data.imported,
                    updated: (prev.updated ?? 0) + response.data.updated,
                }));
            } catch (error) {
                console.error("Force import failed:", error);
            }
            setEmpDuplicates([]);
            setEmpDecisions([]);
            setEmpDuplicateIndex(0);
            setEmpCurrentChecks({ left: false, right: false });
        } else {
            setEmpDecisions(newDecisions);
            setEmpDuplicateIndex((prev) => prev + 1);
            setEmpCurrentChecks({ left: false, right: false });
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
                            {empImportResult.allDuplicates ? (
                                <p className="font-medium text-red-600">
                                    Import failed — all records are duplicate
                                    values.
                                </p>
                            ) : (
                                <p className="font-medium text-gray-700">
                                    Import complete — {empImportResult.imported}{" "}
                                    record
                                    {empImportResult.imported !== 1 ? "s" : ""}{" "}
                                    imported
                                    {empImportResult.updated > 0 &&
                                        `, ${empImportResult.updated} record${
                                            empImportResult.updated !== 1
                                                ? "s"
                                                : ""
                                        } updated`}{" "}
                                    successfully.
                                </p>
                            )}

                            {/* Duplicate Wizard Panel */}
                            {empDuplicates.length > 0 && (
                                <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded p-4 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-yellow-800">
                                            {empDuplicates.length -
                                                empDuplicateIndex}{" "}
                                            duplicate record
                                            {empDuplicates.length -
                                                empDuplicateIndex !==
                                            1
                                                ? "s"
                                                : ""}{" "}
                                            remaining
                                        </p>
                                    </div>

                                    {/* Side by Side Cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Left — Existing Record */}
                                        <div
                                            onClick={() =>
                                                setEmpCurrentChecks((prev) => ({
                                                    ...prev,
                                                    left: !prev.left,
                                                }))
                                            }
                                            className={`cursor-pointer rounded border p-3 space-y-1 transition-colors ${
                                                empCurrentChecks.left
                                                    ? "border-blue-400 bg-blue-50"
                                                    : "border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        empCurrentChecks.left
                                                    }
                                                    onChange={() =>
                                                        setEmpCurrentChecks(
                                                            (prev) => ({
                                                                ...prev,
                                                                left: !prev.left,
                                                            })
                                                        )
                                                    }
                                                    className="accent-blue-600"
                                                />
                                                <span className="text-xs font-semibold text-gray-500 uppercase">
                                                    Existing
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {
                                                    empDuplicates[
                                                        empDuplicateIndex
                                                    ].name
                                                }
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {
                                                    empDuplicates[
                                                        empDuplicateIndex
                                                    ].existing_department_name
                                                }
                                            </p>
                                        </div>

                                        {/* Right — Incoming Record */}
                                        <div
                                            onClick={() =>
                                                setEmpCurrentChecks((prev) => ({
                                                    ...prev,
                                                    right: !prev.right,
                                                }))
                                            }
                                            className={`cursor-pointer rounded border p-3 space-y-1 transition-colors ${
                                                empCurrentChecks.right
                                                    ? "border-green-400 bg-green-50"
                                                    : "border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        empCurrentChecks.right
                                                    }
                                                    onChange={() =>
                                                        setEmpCurrentChecks(
                                                            (prev) => ({
                                                                ...prev,
                                                                right: !prev.right,
                                                            })
                                                        )
                                                    }
                                                    className="accent-green-600"
                                                />
                                                <span className="text-xs font-semibold text-gray-500 uppercase">
                                                    Incoming
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {
                                                    empDuplicates[
                                                        empDuplicateIndex
                                                    ].name
                                                }
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {
                                                    empDuplicates[
                                                        empDuplicateIndex
                                                    ].department_name
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={handleCancelDuplicates}
                                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDuplicateDecision}
                                            className={`text-xs text-white px-3 py-1.5 rounded ${
                                                !empCurrentChecks.left &&
                                                !empCurrentChecks.right
                                                    ? "bg-gray-400 hover:bg-gray-500"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                        >
                                            {!empCurrentChecks.left &&
                                            !empCurrentChecks.right
                                                ? "Skip"
                                                : "OK"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {empDuplicates.length === 0 && (
                                <button
                                    onClick={() => {
                                        setEmpImportResult(null);
                                        setEmpDuplicates([]);
                                    }}
                                    className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                                >
                                    OK
                                </button>
                            )}
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
