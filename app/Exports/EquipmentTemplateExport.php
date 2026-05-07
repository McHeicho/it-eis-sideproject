<?php

namespace App\Exports;

// Add these use statements at the top
use App\Models\Brand;
use App\Models\EquipmentType;
use App\Models\EquipmentModel;
use App\Models\Equipment;
use App\Models\Supplier;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;

class EquipmentTemplateExport implements WithEvents, WithTitle
{
    // Constructor goes here, inside the class, before title()
    protected array $equipmentTypes;
    protected array $brands;
    protected array $modelsByBrand;
    protected array $suppliers;
    protected array $conditions;
    protected array $statuses;

    public function __construct()
    {
        $this->equipmentTypes = EquipmentType::pluck("name")->toArray();
        $this->brands = Brand::pluck("name")->toArray();
        $this->modelsByBrand = EquipmentModel::with("brand")
            ->get()
            ->groupBy(fn($m) => $m->brand->name)
            ->map(fn($models) => $models->pluck("name")->toArray())
            ->toArray();
        $this->suppliers = Supplier::pluck("name")->toArray();
        $this->conditions = Equipment::CONDITIONS;
        $this->statuses = Equipment::STATUSES;
    }

    public function title(): string
    {
        return "Equipment";
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // --- Headers ---
                $headers = [
                    "A1" => "Equipment Type",
                    "B1" => "Brand",
                    "C1" => "Model",
                    "D1" => "Serial Number",
                    "E1" => "Supplier",
                    "F1" => "Purchase Date",
                    "G1" => "Voucher No",
                    "H1" => "Condition",
                    "I1" => "Status",
                ];

                foreach ($headers as $cell => $label) {
                    $sheet->setCellValue($cell, $label);
                }

                // --- Header Styling ---
                $headerStyle = [
                    "font" => [
                        "bold" => true,
                        "color" => ["argb" => "FFFFFFFF"],
                    ],
                    "fill" => [
                        "fillType" =>
                            \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        "startColor" => ["argb" => "FF2563EB"], // Tailwind blue-600
                    ],
                    "alignment" => [
                        "horizontal" =>
                            \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    ],
                ];

                $sheet->getStyle("A1:I1")->applyFromArray($headerStyle);

                // Freeze the header row
                $sheet->freezePane("A2");

                // --- Column Widths ---
                $widths = [
                    "A" => 20, // Equipment Type
                    "B" => 18, // Brand
                    "C" => 22, // Model
                    "D" => 22, // Serial Number
                    "E" => 20, // Supplier
                    "F" => 16, // Purchase Date
                    "G" => 16, // Voucher No
                    "H" => 14, // Condition
                    "I" => 14, // Status
                ];

                foreach ($widths as $col => $width) {
                    $sheet->getColumnDimension($col)->setWidth($width);
                }

                // --- Create _lists hidden sheet ---
                $spreadsheet = $sheet->getParent();
                $listSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet(
                    $spreadsheet,
                    "_lists",
                );
                $spreadsheet->addSheet($listSheet);

                // Column A: Equipment Types
                $listSheet->setCellValue("A1", "EquipmentTypes");
                foreach ($this->equipmentTypes as $i => $type) {
                    $listSheet->setCellValue("A" . ($i + 2), $type);
                }

                // Column B: Brands
                $listSheet->setCellValue("B1", "Brands");
                foreach ($this->brands as $i => $brand) {
                    $listSheet->setCellValue("B" . ($i + 2), $brand);
                }

                // Column C: Suppliers
                $listSheet->setCellValue("C1", "Suppliers");
                foreach ($this->suppliers as $i => $supplier) {
                    $listSheet->setCellValue("C" . ($i + 2), $supplier);
                }

                // Column D: Conditions
                $listSheet->setCellValue("D1", "Conditions");
                foreach ($this->conditions as $i => $condition) {
                    $listSheet->setCellValue("D" . ($i + 2), $condition);
                }

                // Column E: Statuses
                $listSheet->setCellValue("E1", "Statuses");
                foreach ($this->statuses as $i => $status) {
                    $listSheet->setCellValue("E" . ($i + 2), $status);
                }

                // --- Date Format for Purchase Date (Column F) ---
                $sheet
                    ->getStyle("F2:F101")
                    ->getNumberFormat()
                    ->setBuiltInFormatCode(14);

                // Hide the sheet
                $listSheet->setSheetState(
                    \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet::SHEETSTATE_HIDDEN,
                );

                // --- Data Validations ---
                $dataRow = 2;
                $lastRow = 101;

                // Helper to count rows in a _lists column
                $typeCount = count($this->equipmentTypes);
                $supplierCount = count($this->suppliers);
                $conditionCount = count($this->conditions);
                $statusCount = count($this->statuses);

                // Equipment Type (Column A) → _lists!A
                $validation = $sheet->getDataValidation(
                    "A" . $dataRow . ":A" . $lastRow,
                );
                $validation->setType(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST,
                );
                $validation->setErrorStyle(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP,
                );
                $validation->setAllowBlank(true);
                $validation->setShowDropDown(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowInputMessage(true);
                $validation->setFormula1('_lists!$A$2:$A$' . ($typeCount + 1));

                // Supplier (Column E) → _lists!C
                $validation = $sheet->getDataValidation(
                    "E" . $dataRow . ":E" . $lastRow,
                );
                $validation->setType(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST,
                );
                $validation->setErrorStyle(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP,
                );
                $validation->setAllowBlank(true);
                $validation->setShowDropDown(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowInputMessage(true);
                $validation->setFormula1(
                    '_lists!$C$2:$C$' . ($supplierCount + 1),
                );

                // Condition (Column H) → _lists!D
                $validation = $sheet->getDataValidation(
                    "H" . $dataRow . ":H" . $lastRow,
                );
                $validation->setType(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST,
                );
                $validation->setErrorStyle(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP,
                );
                $validation->setAllowBlank(true);
                $validation->setShowDropDown(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowInputMessage(true);
                $validation->setFormula1(
                    '_lists!$D$2:$D$' . ($conditionCount + 1),
                );

                // Status (Column I) → _lists!E
                $validation = $sheet->getDataValidation(
                    "I" . $dataRow . ":I" . $lastRow,
                );
                $validation->setType(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST,
                );
                $validation->setErrorStyle(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP,
                );
                $validation->setAllowBlank(true);
                $validation->setShowDropDown(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowInputMessage(true);
                $validation->setFormula1(
                    '_lists!$E$2:$E$' . ($statusCount + 1),
                );

                // Column F onwards: Brand→Model groups
                $brandCol = "F";
                foreach ($this->modelsByBrand as $brandName => $models) {
                    $listSheet->setCellValue($brandCol . "1", $brandName);
                    foreach ($models as $j => $modelName) {
                        $listSheet->setCellValue(
                            $brandCol . ($j + 2),
                            $modelName,
                        );
                    }
                    $brandCol++;
                }

                // --- Named Ranges for Brand→Model ---
                $brandCol = "F";
                foreach ($this->modelsByBrand as $brandName => $models) {
                    $modelCount = count($models);
                    $safeName = str_replace(" ", "_", $brandName);

                    $namedRange = new \PhpOffice\PhpSpreadsheet\NamedRange(
                        $safeName,
                        $listSheet,
                        '$' .
                            $brandCol .
                            '$2:$' .
                            $brandCol .
                            '$' .
                            ($modelCount + 1),
                    );
                    $spreadsheet->addNamedRange($namedRange);

                    $brandCol++;
                }

                // Brand (Column B) → _lists!B
                $brandCount = count($this->brands);
                $validation = $sheet->getDataValidation("B2:B" . $lastRow);
                $validation->setType(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST,
                );
                $validation->setErrorStyle(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP,
                );
                $validation->setAllowBlank(true);
                $validation->setShowDropDown(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowInputMessage(true);
                $validation->setFormula1('_lists!$B$2:$B$' . ($brandCount + 1));

                // Model (Column C) → INDIRECT based on Brand selection
                for ($row = 2; $row <= $lastRow; $row++) {
                    $validation = $sheet->getDataValidation("C" . $row);
                    $validation->setType(
                        \PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST,
                    );
                    $validation->setErrorStyle(
                        \PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP,
                    );
                    $validation->setAllowBlank(true);
                    $validation->setShowDropDown(true);
                    $validation->setShowErrorMessage(true);
                    $validation->setShowInputMessage(true);
                    $validation->setFormula1(
                        "INDIRECT(SUBSTITUTE(B" . $row . '," ","_"))',
                    );
                }
            },
        ];
    }
}
