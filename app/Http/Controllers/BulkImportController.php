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
        'file' => 'required|file|mimes:xlsx|max:2048',
    ]);

    $import = new EmployeeImport();
    Excel::import($import, $request->file('file'));

    return response()->json($import->getResult());
}

public function forceImportEmployees(Request $request)
{
    $request->validate([
        'employees' => 'required|array',
        'employees.*.name' => 'required|string',
        'employees.*.department_tag' => 'required|string',
    ]);

    $imported = 0;
    $failures = [];

    foreach ($request->employees as $index => $employee) {
        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($employee) {
                Employee::create([
                    'name' => $employee['name'],
                    'department_tag' => $employee['department_tag'],
                ]);
            });
            $imported++;
        } catch (\Exception $e) {
            $failures[] = [
                'row' => $index + 1,
                'errors' => ['Unexpected error: ' . $e->getMessage()],
            ];
        }
    }

    return response()->json([
        'imported' => $imported,
        'failures' => $failures,
    ]);
}
}
