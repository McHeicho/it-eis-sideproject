<?php

namespace App\Imports;

use App\Models\Brand;
use App\Models\Equipment;
use App\Models\EquipmentModel;
use App\Models\EquipmentType;
use App\Models\Supplier;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;

class EquipmentImport implements ToCollection, WithHeadingRow
{
    public array $imported = [];
    public array $failures = [];

    public function collection(Collection $rows)
    {
        // Pre-load lookups
        $equipmentTypes = EquipmentType::pluck("id", "name")->toArray();
        $brands = Brand::pluck("id", "name")->toArray();
        $suppliers = Supplier::pluck("id", "name")->toArray();
        $models = EquipmentModel::with("brand")
            ->get()
            ->mapWithKeys(
                fn($m) => [
                    $m->brand->name . "|" . $m->name => $m->id,
                ],
            )
            ->toArray();
        $existingSerials = Equipment::pluck("serial_number")->toArray();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +2 because row 1 is headers
            $errors = [];

            // Extract values
            $typeName = trim($row["equipment_type"] ?? "");
            $brandName = trim($row["brand"] ?? "");
            $modelName = trim($row["model"] ?? "");
            $serialNumber = trim($row["serial_number"] ?? "");
            $supplierName = trim($row["supplier"] ?? "");
            $purchaseDate = trim($row["purchase_date"] ?? "");
            $voucherNo = trim($row["voucher_no"] ?? "");
            $condition = trim($row["condition"] ?? "");
            $status = trim($row["status"] ?? "");

            // Skip entirely empty rows
            if (!$typeName && !$brandName && !$serialNumber) {
                continue;
            }

            // Validate Equipment Type
            if (!$typeName || !isset($equipmentTypes[$typeName])) {
                $errors[] = "Equipment Type '{$typeName}' not found in system.";
            }

            // Validate Brand
            if (!$brandName || !isset($brands[$brandName])) {
                $errors[] = "Brand '{$brandName}' not found in system.";
            }

            // Validate Model (only if brand is valid)
            $modelKey = $brandName . "|" . $modelName;
            if (!$modelName || !isset($models[$modelKey])) {
                $errors[] = "Model '{$modelName}' not found under Brand '{$brandName}'.";
            }

            // Validate Serial Number
            if (!$serialNumber) {
                $errors[] = "Serial Number is required.";
            } elseif (in_array($serialNumber, $existingSerials)) {
                $errors[] = "Serial Number '{$serialNumber}' already exists in system.";
            }

            // Validate Supplier
            if (!$supplierName || !isset($suppliers[$supplierName])) {
                $errors[] = "Supplier '{$supplierName}' not found in system.";
            }

            // Validate Purchase Date
            if (!$purchaseDate) {
                $errors[] = "Purchase Date is required.";
            }

            // Validate Condition
            if (!in_array($condition, Equipment::CONDITIONS)) {
                $errors[] = "Condition '{$condition}' is invalid.";
            }

            // Validate Status
            if (!in_array($status, Equipment::STATUSES)) {
                $errors[] = "Status '{$status}' is invalid.";
            }

            // If any errors, record failure and skip
            if (!empty($errors)) {
                $this->failures[] = [
                    "row" => $rowNumber,
                    "errors" => $errors,
                ];
                continue;
            }

            // All good — insert
            $equipment = Equipment::create([
                "equipment_type_id" => $equipmentTypes[$typeName],
                "brand_id" => $brands[$brandName],
                "model_id" => $models[$modelKey],
                "serial_number" => $serialNumber,
                "supplier_id" => $suppliers[$supplierName],
                "purchase_date" => $purchaseDate,
                "voucher_no" => $voucherNo ?: null,
                "condition" => $condition,
                "status" => $status,
            ]);

            $this->imported[] = $equipment->id;

            // Add to existingSerials to catch duplicates within the same file
            $existingSerials[] = $serialNumber;
        }
    }
}
