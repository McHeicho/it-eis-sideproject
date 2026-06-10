<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Equipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // Number of example rows returned with each alert; the count carries the full total.
    private const ALERT_PREVIEW_LIMIT = 5;

    public function index(Request $request)
    {
        // Every role gets the overview; only admins get the status breakdown and alerts.
        $payload = [
            'totals'                  => $this->totals(),
            'assigned_per_department' => $this->assignedPerDepartment(),
        ];

        if ((int) $request->user()->role_id === 1) {
            $payload['status_breakdown'] = $this->statusBreakdown();
            $payload['alerts']           = $this->alerts();
        }

        return response()->json($payload);
    }

    private function totals(): array
    {
        $byType = Equipment::query()
            ->selectRaw('equipment_types.name as type, COUNT(*) as count')
            ->leftJoin('equipment_types', 'equipment.equipment_type_id', '=', 'equipment_types.id')
            ->groupBy('equipment_types.name')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'type'  => $row->type ?? 'Uncategorized',
                'count' => (int) $row->count,
            ]);

        return [
            'equipment_total' => Equipment::count(),
            'by_type'         => $byType,
        ];
    }

    private function assignedPerDepartment()
    {
        // Count currently-assigned equipment (not yet returned) grouped by the
        // assignee's department, using the same "date_returned IS NULL" convention
        // as EmployeeController::index.
        return Employee::query()
            ->selectRaw('COALESCE(departments.name, ?) as department, COUNT(assignments.id) as count', ['Unassigned (no dept)'])
            ->join('assignments', function ($join) {
                $join->on('assignments.employee_id', '=', 'employees.id')
                    ->whereNull('assignments.date_returned');
            })
            ->leftJoin('departments', 'employees.department_tag', '=', 'departments.tag')
            ->groupBy('department')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'department' => $row->department,
                'count'      => (int) $row->count,
            ]);
    }

    private function statusBreakdown(): array
    {
        $counts = Equipment::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Map onto the canonical status set so every status appears, including zeros.
        return collect(Equipment::STATUSES)
            ->map(fn ($status) => [
                'status' => $status,
                'count'  => (int) ($counts[$status] ?? 0),
            ])
            ->all();
    }

    private function alerts(): array
    {
        return [
            'employees_no_laptop' => $this->employeesNoLaptop(),
            'lost_missing'        => $this->equipmentByStatus(['Lost/Missing']),
            'under_repair'        => $this->equipmentByStatus(['Under Repair']),
            'idle_stock'          => $this->idleStock(),
        ];
    }

    private function employeesNoLaptop(): array
    {
        $query = Employee::query()
            ->whereDoesntHave('assignments', fn ($q) => $q->whereNull('date_returned'))
            ->with('department')
            ->orderBy('name');

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::ALERT_PREVIEW_LIMIT)->get()->map(fn ($e) => [
                'id'         => $e->id,
                'name'       => $e->name,
                'department' => $e->department?->name,
            ]),
        ];
    }

    private function equipmentByStatus(array $statuses): array
    {
        $query = Equipment::query()
            ->whereIn('status', $statuses)
            ->with(['brand', 'model']);

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::ALERT_PREVIEW_LIMIT)->get()->map(fn ($eq) => $this->equipmentItem($eq)),
        ];
    }

    private function idleStock(): array
    {
        // Available / Spare units that are not currently assigned to anyone.
        $query = Equipment::query()
            ->whereIn('status', ['Available', 'Spare Unit'])
            ->whereDoesntHave('assignments', fn ($q) => $q->whereNull('date_returned'))
            ->with(['brand', 'model']);

        return [
            'count' => $query->count(),
            'items' => $query->limit(self::ALERT_PREVIEW_LIMIT)->get()->map(fn ($eq) => $this->equipmentItem($eq)),
        ];
    }

    private function equipmentItem(Equipment $eq): array
    {
        return [
            'id'        => $eq->id,
            'asset_tag' => $eq->asset_tag,
            'serial'    => $eq->serial_number,
            'brand'     => $eq->brand?->name,
            'model'     => $eq->model?->name,
            'status'    => $eq->status,
        ];
    }
}
