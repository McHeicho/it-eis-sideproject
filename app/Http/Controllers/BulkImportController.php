<?php

namespace App\Http\Controllers;

use App\Exports\EquipmentTemplateExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\EquipmentImport;
use Illuminate\Http\Request;

class BulkImportController extends Controller
{
    public function downloadEquipmentTemplate()
    {
        return Excel::download(
            new EquipmentTemplateExport(),
            "equipment_template.xlsx",
        );
    }

    public function importEquipment(Request $request)
    {
        $request->validate([
            "file" => "required|file|mimes:xlsx|max:2048",
        ]);

        $import = new EquipmentImport();
        Excel::import($import, $request->file("file"));

        return response()->json([
            "imported" => count($import->imported),
            "failures" => $import->failures,
        ]);
    }
}
