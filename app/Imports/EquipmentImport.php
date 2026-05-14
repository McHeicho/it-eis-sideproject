<?php

namespace App\Imports;

use App\Models\Brand;
use App\Models\Delivery;
use App\Models\Equipment;
use App\Models\EquipmentModel;
use App\Models\EquipmentType;
use App\Models\Supplier;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EquipmentImport implements ToCollection, WithHeadingRow
{
    public array $imported = [];
    public array $failures = [];
    public array $warnings = [];

    public function collection(Collection $rows)
    {
        // Equipment lookups
        $equipmentTypes = EquipmentType::pluck("id", "name")->toArray();
        $brands = Brand::pluck("id", "name")->toArray();
        $suppliers = Supplier::pluck("id", "name")->toArray();
        $models = EquipmentModel::with("brand")
            ->get()
            ->mapWithKeys(fn($m) => [$m->brand->name . "|" . $m->name => $m->id])
            ->toArray();
        $existingSerials = Equipment::pluck("serial_number")->toArray();

        // Delivery lookups — keyed by voucher_no and invoice_no separately
        $deliveriesByVoucher = Delivery::with("supplier")
            ->whereNotNull("voucher_no")
            ->get()
            ->keyBy("voucher_no");

        $deliveriesByInvoice = Delivery::with("supplier")
            ->whereNotNull("invoice_no")
            ->get()
            ->keyBy("invoice_no");

        // In-memory cache for deliveries created during this import run
        // Prevents duplicate Delivery creation when multiple rows share the same handle
        $deliveryCache = [];

foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $errors = [];
            $rowWarnings = [];

            // Extract values
            $typeName     = trim($row["equipment_type"] ?? "");
            $brandName    = trim($row["brand"] ?? "");
            $modelName    = trim($row["model"] ?? "");
            $serialNumber = trim($row["serial_number"] ?? "");
            $supplierName = trim($row["supplier"] ?? "");
            $voucherNo    = trim($row["voucher_no"] ?? "");
            $invoiceNo    = trim($row["invoice_no"] ?? "");
            $condition    = trim($row["condition"] ?? "");
            $status       = trim($row["status"] ?? "");

            // Skip entirely empty rows
            if (!$typeName && !$brandName && !$serialNumber) {
                continue;
            }

            // --- Purchase Date ---
            $rawDate = $row["purchase_date"] ?? "";
            if (is_numeric($rawDate)) {
                $purchaseDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($rawDate)->format("Y-m-d");
            } else {
                $purchaseDate = $rawDate ? date("Y-m-d", strtotime($rawDate)) : "";
            }

            // --- Validate Equipment fields ---
            if (!$typeName || !isset($equipmentTypes[$typeName])) {
                $errors[] = "Equipment Type '{$typeName}' not found in system.";
            }
            if (!$brandName || !isset($brands[$brandName])) {
                $errors[] = "Brand '{$brandName}' not found in system.";
            }
            $modelKey = $brandName . "|" . $modelName;
            if (!$modelName || !isset($models[$modelKey])) {
                $errors[] = "Model '{$modelName}' not found under Brand '{$brandName}'.";
            }
            if (!$serialNumber) {
                $errors[] = "Serial Number is required.";
            } elseif (in_array($serialNumber, $existingSerials)) {
                $errors[] = "Serial Number '{$serialNumber}' already exists in system.";
            }
            if (!in_array($condition, Equipment::CONDITIONS)) {
                $errors[] = "Condition '{$condition}' is invalid.";
            }
            if (!in_array($status, Equipment::STATUSES)) {
                $errors[] = "Status '{$status}' is invalid.";
            }

            // --- Delivery resolution ---
            $deliveryId = null;

            $handle     = $voucherNo ?: $invoiceNo;
            $handleMode = $voucherNo ? "voucher" : ($invoiceNo ? "invoice" : null);

            if (!$handleMode) {
                // Both voucher_no and invoice_no are empty — fail the row
                $errors[] = "Either Voucher No or Invoice No is required.";
            } else {
                $cacheKey = $handleMode . ":" . $handle;

                if (isset($deliveryCache[$cacheKey])) {
                    // Already created this Delivery earlier in this import run
                    $deliveryId = $deliveryCache[$cacheKey];
                } else {
                    // Check existing DB records
                    $existingDelivery = $handleMode === "voucher"
                        ? ($deliveriesByVoucher[$handle] ?? null)
                        : ($deliveriesByInvoice[$handle] ?? null);

                    if ($existingDelivery) {
                        $deliveryId = $existingDelivery->id;

                        // Mismatch check — warn but don't fail
                        if ($supplierName && $existingDelivery->supplier?->name !== $supplierName) {
                            $rowWarnings[] = "Row {$rowNumber}: Voucher/Invoice matched existing Delivery but Supplier '{$supplierName}' differs from recorded '{$existingDelivery->supplier?->name}' — existing value kept.";
                        }
                        if ($purchaseDate && $existingDelivery->purchase_date?->format("Y-m-d") !== $purchaseDate) {
                            $rowWarnings[] = "Row {$rowNumber}: Voucher/Invoice matched existing Delivery but Purchase Date '{$purchaseDate}' differs from recorded '{$existingDelivery->purchase_date?->format('Y-m-d')}' — existing value kept.";
                        }
                    } else {
                        // Validate supplier and purchase date — required for new Delivery creation
                        if (!$supplierName || !isset($suppliers[$supplierName])) {
                            $errors[] = "Supplier '{$supplierName}' not found in system.";
                        }
                        if (!$purchaseDate) {
                            $errors[] = "Purchase Date is required when creating a new Delivery.";
                        }
                    }
                }
            }

            // If any errors, record and skip
            if (!empty($errors)) {
                $this->failures[] = [
                    "row"    => $rowNumber,
                    "errors" => $errors,
                ];
                continue;
            }

            // --- Insert ---
            try {
                DB::transaction(function () use (
                    $equipmentTypes, $brands, $models, $suppliers,
                    $typeName, $brandName, $modelKey, $serialNumber,
                    $supplierName, $purchaseDate, $voucherNo, $invoiceNo,
                    $condition, $status,
                    &$deliveryId, &$deliveryCache, $handleMode, $handle
                ) {
                    // Create Delivery if not resolved yet
                    if (!$deliveryId) {
                        $delivery = Delivery::create([
                            "voucher_no"    => $voucherNo ?: null,
                            "invoice_no"    => $invoiceNo ?: null,
                            "supplier_id"   => $suppliers[$supplierName],
                            "purchase_date" => $purchaseDate,
                        ]);
                        $deliveryId = $delivery->id;
                        $deliveryCache[$handleMode . ":" . $handle] = $deliveryId;
                    }

                    Equipment::create([
                        "equipment_type_id" => $equipmentTypes[$typeName],
                        "brand_id"          => $brands[$brandName],
                        "model_id"          => $models[$modelKey],
                        "serial_number"     => $serialNumber,
                        "delivery_id"       => $deliveryId,
                        "condition"         => $condition,
                        "status"            => $status,
                    ]);
                });

                $this->imported[]  = $serialNumber;
                $existingSerials[] = $serialNumber;
                $this->warnings    = array_merge($this->warnings, $rowWarnings);
            } catch (\Exception $e) {
                $this->failures[] = [
                    "row"    => $rowNumber,
                    "errors" => ["Unexpected error during insert: " . $e->getMessage()],
                ];
            }
        }
    }
}
