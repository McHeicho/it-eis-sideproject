<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\Equipment;
use App\Models\Brand;
use App\Models\EquipmentModel;
use App\Models\EquipmentType;
use App\Models\Assignment;
use App\Models\Supplier;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Branch;
use App\Exports\EquipmentExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentController extends Controller
{
    public function formData()
    {
        return response()->json([
            "types" => EquipmentType::all(),
            "brands" => Brand::all(),
            "suppliers" => Supplier::all(),
            "models" => EquipmentModel::with("brand")->get(),
            "conditions" => Equipment::CONDITIONS,
            "statuses" => Equipment::STATUSES,
            // department_tag and branch_id are what AssignmentList and
            // AssignmentAssignModal narrow their employee dropdowns by —
            // dropping either here silently empties those dropdowns.
            "employees"  => Employee::orderBy('name')
                ->get(['id', 'name', 'department_tag', 'branch_id']),
            "departments" => Department::all(),
            "branches" => Branch::all(),
        ]);
    }

    public function options()
    {
        return response()->json([
            "conditions" => Equipment::CONDITIONS,
            "statuses" => Equipment::STATUSES,
        ]);
    }

    public function index(Request $request)
    {
        $query = Equipment::with([
            "type",
            "brand",
            "model",
            "delivery.supplier",
            "currentAssignment.employee.branch",
            "currentAssignment.branch",
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        if ($request->filled('equipment_type_id')) {
            $query->where('equipment_type_id', $request->equipment_type_id);
        }

        if ($request->filled('supplier_id')) {
            $query->whereHas('delivery', function ($q) use ($request) {
                $q->where('supplier_id', $request->supplier_id);
            });
        }

        if ($request->filled('serial_number')) {
            $query->where('serial_number', 'like', $request->serial_number . '%');
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            "equipment_type_id" => "required|exists:equipment_types,id",
            "brand_id"          => "required|exists:brands,id",
            "model_id"          => "required|exists:equipment_models,id",
            "serial_number"     => "required|string|unique:equipment,serial_number",
            "condition"         => "required|in:" . implode(",", Equipment::CONDITIONS),
            "status"            => "required|in:" . implode(",", Equipment::STATUSES),
            // Assignment side
            "employee_id"       => "nullable|required_if:status,Assigned|exists:employees,id",
            // Delivery side
            "delivery_id"       => "nullable|exists:deliveries,id",
            "voucher_no"        => "nullable|string",
            "invoice_no"        => "nullable|string",
            "supplier_id"       => "required_without:delivery_id|exists:suppliers,id",
            "purchase_date"     => "required_without:delivery_id|date",
            "order_no"          => "nullable|string",
            "notes"             => "nullable|string",
        ]);

        if ($mismatch = $this->modelBrandMismatch($request->model_id, $request->brand_id)) {
            return $mismatch;
        }

        $equipment = DB::transaction(function () use ($request) {
            $deliveryId = $request->delivery_id ?? $this->resolveDelivery($request)->id;

            $equipment = Equipment::create([
                "equipment_type_id" => $request->equipment_type_id,
                "brand_id"          => $request->brand_id,
                "model_id"          => $request->model_id,
                "serial_number"     => $request->serial_number,
                "delivery_id"       => $deliveryId,
                "condition"         => $request->condition,
                "status"            => $request->status,
            ]);

            if ($request->filled('employee_id') && $request->status === 'Assigned') {
                Assignment::create([
                    'equipment_id'  => $equipment->id,
                    'employee_id'   => $request->employee_id,
                    'date_assigned' => now()->toDateString(),
                    'notes'         => 'Assigned upon record creation',
                ]);
            }

            return $equipment;
        });

        return response()->json(
            $equipment->fresh()->load(["type", "brand", "model", "delivery.supplier"]),
            201,
        );
    }

    public function show(Equipment $equipment)
    {
        return response()->json(
            $equipment->load([
                "type",
                "brand",
                "model",
                "delivery.supplier",
                "assignments.employee",
                "currentAssignment.employee.branch",
                "currentAssignment.branch",
            ]),
        );
    }

    public function update(Request $request, Equipment $equipment)
    {
        if ($request->filled("last_seen_updated_at")) {
            $clientTimestamp = $request->last_seen_updated_at;
            $serverTimestamp = $equipment->updated_at->toJSON();

            if ($clientTimestamp !== $serverTimestamp) {
                return response()->json(
                    [
                        "message" =>
                            "This record was edited by another user since you opened it.",
                    ],
                    409,
                );
            }
        }

        $request->validate([
            "equipment_type_id" => "sometimes|exists:equipment_types,id",
            "brand_id"          => "sometimes|exists:brands,id",
            "model_id"          => "sometimes|exists:equipment_models,id",
            "serial_number"     =>
                "sometimes|string|unique:equipment,serial_number," . $equipment->id,
            "condition"         => "required|in:" . implode(",", Equipment::CONDITIONS),
            "status"            => "required|in:" . implode(",", Equipment::STATUSES),
            // Delivery side. delivery_id wins when filled; otherwise a voucher
            // or invoice number plus supplier and date describe a delivery to
            // reuse or create, exactly as in store().
            "delivery_id"       => "sometimes|nullable|exists:deliveries,id",
            "voucher_no"        => "nullable|string",
            "invoice_no"        => "nullable|string",
            "supplier_id"       => "nullable|required_with:voucher_no,invoice_no|exists:suppliers,id",
            "purchase_date"     => "nullable|required_with:voucher_no,invoice_no|date",
            "order_no"          => "nullable|string",
            "notes"             => "nullable|string",
        ]);

        $brandId = $request->input("brand_id", $equipment->brand_id);
        $modelId = $request->input("model_id", $equipment->model_id);

        if ($mismatch = $this->modelBrandMismatch($modelId, $brandId)) {
            return $mismatch;
        }

        // Status is action-driven (cleanup #2): a unit becomes Assigned only
        // through AssignmentController::store, which creates the Assignment
        // row, and leaves Assigned only through return(). The edit form
        // mirrors this by locking the select; this is the server-side half.
        $hasActiveAssignment = $equipment->currentAssignment()->exists();

        if ($request->status === "Assigned" && !$hasActiveAssignment) {
            return $this->validationError(
                "status",
                "Equipment can only become Assigned through the Assignments page.",
            );
        }

        if ($hasActiveAssignment && $request->status !== "Assigned") {
            return $this->validationError(
                "status",
                "This equipment is currently assigned. Return it before changing its status.",
            );
        }

        $data = $request->only([
            "equipment_type_id",
            "brand_id",
            "model_id",
            "serial_number",
            "condition",
            "status",
        ]);

        DB::transaction(function () use ($request, $equipment, $data) {
            if ($request->has("delivery_id")) {
                if ($request->filled("delivery_id")) {
                    $data["delivery_id"] = $request->delivery_id;
                } elseif ($request->filled("voucher_no") || $request->filled("invoice_no")) {
                    $data["delivery_id"] = $this->resolveDelivery($request)->id;
                } else {
                    $data["delivery_id"] = null;
                }
            }

            $equipment->update($data);
        });

        return response()->json(
            $equipment
                ->fresh()
                ->load(["type", "brand", "model", "delivery.supplier"]),
        );
    }

    //prohibit deletion of equipment
    public function destroy(Equipment $equipment)
    {
        return response()->json(
            ["message" => "Equipment records cannot be deleted."],
            403,
        );
    }

    public function export()
    {
        return Excel::download(
            new EquipmentExport(),
            'equipment-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    // Reuse a delivery whose voucher or invoice number is already on file,
    // otherwise create one. The blur-time match in EquipmentAddEdit does the
    // same lookup; this covers a submit that skipped it (Enter before blur),
    // which used to hit the unique index and return a 500.
    private function resolveDelivery(Request $request): Delivery
    {
        if ($request->filled("voucher_no")) {
            $existing = Delivery::where("voucher_no", $request->voucher_no)->first();
            if ($existing) {
                return $existing;
            }
        }

        if ($request->filled("invoice_no")) {
            $existing = Delivery::where("invoice_no", $request->invoice_no)->first();
            if ($existing) {
                return $existing;
            }
        }

        return Delivery::create(
            $request->only([
                "voucher_no",
                "invoice_no",
                "supplier_id",
                "purchase_date",
                "order_no",
                "notes",
            ]),
        );
    }

    // 422 in Laravel's own validation shape so the frontend's existing
    // `error.response.data.errors[field][0]` handling shows it under the field.
    private function validationError(string $field, string $message)
    {
        return response()->json(
            ["message" => $message, "errors" => [$field => [$message]]],
            422,
        );
    }

    private function modelBrandMismatch($modelId, $brandId)
    {
        $belongs = EquipmentModel::where("id", $modelId)
            ->where("brand_id", $brandId)
            ->exists();

        return $belongs
            ? null
            : $this->validationError(
                "model_id",
                "The selected model does not belong to the selected brand.",
            );
    }
}
