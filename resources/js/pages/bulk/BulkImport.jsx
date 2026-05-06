import React, { useState } from 'react';
import { FileSpreadsheet, Users, ClipboardList, Upload } from 'lucide-react';
import api from '../../api/axios';

export default function BulkImport() {
    const [downloading, setDownloading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importResult, setImportResult] = useState(null);

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        try {
            const response = await api.get('/bulk-import/equipment-template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'equipment_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download template:', error);
        } finally {
            setDownloading(false);
        }
    };

    const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setImportResult(null);
    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await api.post('/bulk-import/equipment', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        setImportResult(response.data);
        setSelectedFile(null);
    } catch (error) {
        console.error('Failed to import:', error);
    } finally {
        setUploading(false);
    }
};

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Bulk Import</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Download a template, fill it in, and upload to import records in bulk.
                </p>
            </div>

            {/* Category Cards */}
            <div className="space-y-4">

                {/* Equipment */}
                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <FileSpreadsheet size={20} className="text-blue-600" />
                        <h2 className="text-base font-semibold text-gray-800">Equipment</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Download the equipment template, fill in your records, then upload to register multiple equipment items at once.
                    </p>
                    
                    {/* Actions Row */}
<div className="flex items-center gap-3 flex-wrap">
    <button
        onClick={handleDownloadTemplate}
        disabled={downloading || uploading}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
        <FileSpreadsheet size={16} />
        {downloading ? 'Generating...' : 'Generate Template'}
    </button>

    {/* File Picker */}
    <label className={`flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors ${
    downloading || uploading
        ? 'opacity-50 cursor-not-allowed bg-gray-50'
        : 'hover:bg-gray-50 cursor-pointer'
}`}>
        <Upload size={16} />
        {selectedFile ? selectedFile.name : 'Choose File'}
        <input
    type="file"
    accept=".xlsx"
    className="hidden"
    disabled={downloading || uploading}
    onChange={(e) => {
        setSelectedFile(e.target.files[0] || null);
        setImportResult(null);
    }}
/>
    </label>

    {/* Upload Button */}
    {selectedFile && (
        <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {uploading ? 'Importing...' : 'Import'}
        </button>
    )}
</div>

{/* Result Area */}
{importResult && (
    <div className="mt-4 p-4 rounded border border-gray-200 bg-gray-50 text-sm space-y-2">
        <p className="font-medium text-gray-700">
            Import complete — {importResult.imported} record{importResult.imported !== 1 ? 's' : ''} imported successfully.
        </p>
        {importResult.failures.length > 0 && (
            <div>
                <p className="text-red-600 font-medium mb-1">{importResult.failures.length} row{importResult.failures.length !== 1 ? 's' : ''} failed:</p>
                <ul className="space-y-1">
                    {importResult.failures.map((f, i) => (
                        <li key={i} className="text-red-500">
                            <span className="font-medium">Row {f.row}:</span> {f.errors.join(' ')}
                        </li>
                    ))}
                </ul>
            </div>
        )}
        <button
            onClick={() => setImportResult(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
        >
            OK
        </button>
    </div>
)}
                </div>

                {/* Employees — Coming Soon */}
                <div className="bg-white rounded-lg shadow p-5 opacity-50">
                    <div className="flex items-center gap-3 mb-2">
                        <Users size={20} className="text-gray-400" />
                        <h2 className="text-base font-semibold text-gray-600">Employees</h2>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <p className="text-sm text-gray-400">Bulk import for employees is not yet available.</p>
                </div>

                {/* Assignments — Coming Soon */}
                <div className="bg-white rounded-lg shadow p-5 opacity-50">
                    <div className="flex items-center gap-3 mb-2">
                        <ClipboardList size={20} className="text-gray-400" />
                        <h2 className="text-base font-semibold text-gray-600">Assignments</h2>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </div>
                    <p className="text-sm text-gray-400">Bulk import for assignments is not yet available.</p>
                </div>

            </div>
        </div>
    );
}