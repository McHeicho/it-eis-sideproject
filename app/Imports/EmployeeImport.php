<?php

namespace App\Imports;

use App\Models\Employee;
use App\Models\Department;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;

class EmployeeImport implements ToCollection, WithHeadingRow
{
    protected $departments;
    protected $imported = 0;
    protected $failures = [];
    protected $duplicates = [];

    public function __construct()
    {
        $this->departments = Department::pluck("tag", "name");
    }

    public function collection(Collection $rows)
    {
        $rowNumber = 1;

        foreach ($rows as $row) {
            $rowNumber++;

            $name = trim($row["name"] ?? "");
            $departmentName = trim($row["department"] ?? "");

            // Skip completely empty rows
            if (empty($name) && empty($departmentName)) {
                continue;
            }

            $errors = [];

            // Validate name
            if (empty($name)) {
                $errors[] = "Name is required.";
            }

            // Validate department
            $departmentTag = null;
            if (empty($departmentName)) {
                $errors[] = "Department is required.";
            } elseif (!isset($this->departments[$departmentName])) {
                $errors[] = "Department '{$departmentName}' not found in system.";
            } else {
                $departmentTag = $this->departments[$departmentName];
            }

            // If hard errors, skip row
            if (!empty($errors)) {
                $this->failures[] = ["row" => $rowNumber, "errors" => $errors];
                continue;
            }

            // Check for duplicate name
            $existingEmployee = Employee::where("name", $name)->first();
            if ($existingEmployee) {
                $flipped = $this->departments->flip();

                $this->duplicates[] = [
                    "row" => $rowNumber,
                    "name" => $name,
                    "department_tag" => $departmentTag,
                    "department_name" =>
                        $flipped[$departmentTag] ?? $departmentTag,
                    "existing_department_tag" =>
                        $existingEmployee->department_tag,
                    "existing_department_name" =>
                        $flipped[$existingEmployee->department_tag] ??
                        $existingEmployee->department_tag,
                ];
                continue;
            }

            // Insert
            try {
                \Illuminate\Support\Facades\DB::transaction(function () use (
                    $name,
                    $departmentTag
                ) {
                    Employee::create([
                        "name" => $name,
                        "department_tag" => $departmentTag,
                    ]);
                });
                $this->imported++;
            } catch (\Exception $e) {
                $this->failures[] = [
                    "row" => $rowNumber,
                    "errors" => ["Unexpected error: " . $e->getMessage()],
                ];
            }
        }
    }

    public function getResult(): array
    {
        return [
            "imported" => $this->imported,
            "updated" => 0,
            "failures" => $this->failures,
            "duplicates" => $this->duplicates,
        ];
    }

    public function forceImportEmployees(Request $request)
    {
        $request->validate([
            "employees" => "required|array",
            "employees.*.name" => "required|string",
            "employees.*.department_tag" => "required|string",
        ]);

        $imported = 0;
        $updated = 0;
        $failures = [];

        foreach ($request->employees as $index => $employee) {
            try {
                \Illuminate\Support\Facades\DB::transaction(function () use (
                    $employee
                ) {
                    Employee::create([
                        "name" => $employee["name"],
                        "department_tag" => $employee["department_tag"],
                    ]);
                });
                $imported++;
            } catch (\Exception $e) {
                $failures[] = [
                    "row" => $index + 1,
                    "errors" => ["Unexpected error: " . $e->getMessage()],
                ];
            }
        }

        return response()->json([
            "imported" => $imported,
            "failures" => $failures,
        ]);
    }
}
