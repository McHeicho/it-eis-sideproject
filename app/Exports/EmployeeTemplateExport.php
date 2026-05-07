<?php

namespace App\Exports;

use App\Models\Department;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeeTemplateExport implements WithEvents
{
    protected $departments;

    public function __construct()
    {
        $this->departments = Department::orderBy("name")->pluck("tag", "name");
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Headers
                $sheet->setCellValue("A1", "Department");
                $sheet->setCellValue("B1", "Name");

                // Header styling
                $headerStyle = [
                    "font" => [
                        "bold" => true,
                        "color" => ["argb" => "FFFFFFFF"],
                    ],
                    "fill" => [
                        "fillType" => "solid",
                        "startColor" => ["argb" => "FF2563EB"],
                    ],
                    "alignment" => ["horizontal" => "center"],
                ];

                $sheet->getStyle("A1:B1")->applyFromArray($headerStyle);

                // Column widths
                $sheet->getColumnDimension("A")->setWidth(30);
                $sheet->getColumnDimension("B")->setWidth(30);

                // Freeze row 1
                $sheet->freezePane("A2");

                // Create hidden _lists sheet
                $spreadsheet = $sheet->getParent();
                $listSheet = $spreadsheet->createSheet();
                $listSheet->setTitle("_lists");
                $listSheet->setSheetState(
                    \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet::SHEETSTATE_HIDDEN,
                );

                // Populate department names in column A
                $row = 1;
                foreach ($this->departments as $name => $tag) {
                    $listSheet->setCellValue("A{$row}", $name);
                    $row++;
                }

                $departmentCount = $this->departments->count();

                // Data validation for Department column (A2 downward)
                $validation = $sheet->getDataValidation("A2:A1000");
                $validation->setType(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST,
                );
                $validation->setErrorStyle(
                    \PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP,
                );
                $validation->setAllowBlank(true);
                $validation->setShowDropDown(true); // remember: true = show, false = hide (inverted bug)
                $validation->setFormula1(
                    "_lists!\$A\$1:\$A\${$departmentCount}",
                );
            },
        ];
    }
}
