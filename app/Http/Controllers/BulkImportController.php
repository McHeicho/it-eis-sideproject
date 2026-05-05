<?php

namespace App\Http\Controllers;

use App\Exports\EquipmentTemplateExport;
use Maatwebsite\Excel\Facades\Excel;

class BulkImportController extends Controller
{
    public function downloadEquipmentTemplate()
    {
        return Excel::download(
            new EquipmentTemplateExport(),
            'equipment_template.xlsx'
        );
    }
}
