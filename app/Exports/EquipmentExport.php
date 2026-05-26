<?php

namespace App\Exports;

use App\Models\Equipment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class EquipmentExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Equipment::with([
            'type',
            'brand',
            'model',
            'delivery.supplier',
            'currentAssignment.employee',
        ])->get()->map(function ($e) {
            return [
                $e->type?->name,
                $e->brand?->name,
                $e->model?->name,
                $e->serial_number,
                $e->status,
                $e->condition,
                $e->delivery?->voucher_no,
                $e->delivery?->invoice_no,
                $e->delivery?->supplier?->name,
                $e->delivery?->purchase_date
                ? \Carbon\Carbon::parse($e->delivery->purchase_date)->format('m-d-Y')
                : null,
                $e->delivery?->order_no,
                $e->delivery?->notes,
                $e->currentAssignment?->employee?->name,
                $e->currentAssignment?->date_assigned,
                $e->created_at?->toDateString(),
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Type',
            'Brand',
            'Model',
            'Serial Number',
            'Status',
            'Condition',
            'Voucher No',
            'Invoice No',
            'Supplier',
            'Purchase Date',
            'Order No',
            'Delivery Notes',
            'Assigned To',
            'Date Assigned',
            'Created At',
        ];
    }
}