<?php

namespace App\Http\Controllers;

use App\Exports\EquipmentTemplateExport;
use App\Exports\EmployeeTemplateExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\EquipmentImport;
use App\Imports\EmployeeImport;
use App\Models\Employee;
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

    public function downloadEmployeeTemplate()
    {
        return Excel::download(
            new EmployeeTemplateExport(),
            "employee_template.xlsx",
        );
    }

    public function importEmployees(Request $request)
    {
        $request->validate([
            "file" => "required|file|mimes:xlsx|max:2048",
        ]);

        $import = new EmployeeImport();
        Excel::import($import, $request->file("file"));

        return response()->json($import->getResult());
    }

    public function forceImportEmployees(Request $request)
    {
        $request->validate([
            "decisions" => "required|array",
            "decisions.*.name" => "required|string",
            "decisions.*.department_tag" => "required|string",
            "decisions.*.existing_department_tag" => "required|string",
            "decisions.*.update" => "required|boolean",
            "decisions.*.addNew" => "required|boolean",
        ]);

        $imported = 0;
        $updated = 0;
        $failures = [];

        foreach ($request->decisions as $index => $decision) {
            try {
                \Illuminate\Support\Facades\DB::transaction(function () use (
                    $decision,
                    &$imported,
                    &$updated
                ) {
                    // Update existing record's department
                    if ($decision["update"]) {
                        Employee::where("name", $decision["name"])->update([
                            "department_tag" => $decision["department_tag"],
                        ]);
                        $updated++;
                    }

                    // Add as new record
                    if ($decision["addNew"]) {
                        Employee::create([
                            "name" => $decision["name"],
                            "department_tag" => $decision["department_tag"],
                        ]);
                        $imported++;
                    }
                });
            } catch (\Exception $e) {
                $failures[] = [
                    "row" => $index + 1,
                    "errors" => ["Unexpected error: " . $e->getMessage()],
                ];
            }
        }

        return response()->json([
            "imported" => $imported,
            "updated" => $updated,
            "failures" => $failures,
        ]);
    }
}
