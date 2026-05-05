<?php

namespace App\Exports;

// Add these use statements at the top
use App\Models\Brand;
use App\Models\EquipmentType;
use App\Models\EquipmentModel;
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

    public function __construct()
    {
        $this->equipmentTypes = EquipmentType::pluck('name')->toArray();
        $this->brands = Brand::pluck('name')->toArray();
        $this->modelsByBrand = EquipmentModel::with('brand')
            ->get()
            ->groupBy(fn($m) => $m->brand->name)
            ->map(fn($models) => $models->pluck('name')->toArray())
            ->toArray();
        $this->suppliers = Supplier::pluck('name')->toArray();
    }

    public function title(): string
    {
        return 'Equipment';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // --- Headers ---
                $headers = [
                    'A1' => 'Equipment Type',
                    'B1' => 'Brand',
                    'C1' => 'Model',
                    'D1' => 'Serial Number',
                    'E1' => 'Supplier',
                    'F1' => 'Purchase Date',
                    'G1' => 'Voucher No',
                    'H1' => 'Condition',
                    'I1' => 'Status',
                    ];

                    foreach ($headers as $cell => $label) {
                        $sheet->setCellValue($cell, $label);
                    }
            },
        ];
    }
}