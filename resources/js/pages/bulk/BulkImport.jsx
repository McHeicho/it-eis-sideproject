import React, { useState } from 'react';
import { FileSpreadsheet, Users, ClipboardList } from 'lucide-react';
import api from '../../api/axios';

export default function BulkImport() {
    const [downloading, setDownloading] = useState(false);

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
                    <button
                        onClick={handleDownloadTemplate}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FileSpreadsheet size={16} />
                        {downloading ? 'Generating...' : 'Generate Template'}
                    </button>
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