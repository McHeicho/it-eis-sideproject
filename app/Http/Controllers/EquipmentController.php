<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\Equipment;
use App\Models\Brand;
use App\Models\EquipmentModel;
use App\Models\EquipmentType;
use App\Models\Supplier;
use Illuminate\Http\Request;

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
        ]);
    }

    public function options()
    {
        return response()->json([
            "conditions" => Equipment::CONDITIONS,
            "statuses" => Equipment::STATUSES,
        ]);
    }

    public function index()
    {
        return response()->json(
            Equipment::with([
                "type",
                "brand",
                "model",
                "delivery.supplier",
                "currentAssignment.employee",
            ])->get(),
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            "equipment_type_id" => "required|exists:equipment_types,id",
            "brand_id" => "required|exists:brands,id",
            "model_id" => "required|exists:equipment_models,id",
            "serial_number" => "required|string|unique:equipment,serial_number",
            "condition" => "required|in:" . implode(",", Equipment::CONDITIONS),
            "status" => "required|in:" . implode(",", Equipment::STATUSES),
            // Delivery side
            "delivery_id" => "nullable|exists:deliveries,id",
            "voucher_no" => "nullable|string",
            "invoice_no" => "nullable|string",
            "supplier_id" => "required_without:delivery_id|exists:suppliers,id",
            "purchase_date" => "required_without:delivery_id|date",
            "order_no" => "nullable|string",
            "notes" => "nullable|string",
        ]);

        $deliveryId =
            $request->delivery_id ?? $this->resolveDelivery($request)->id;

        $equipment = Equipment::create([
            "equipment_type_id" => $request->equipment_type_id,
            "brand_id" => $request->brand_id,
            "model_id" => $request->model_id,
            "serial_number" => $request->serial_number,
            "delivery_id" => $deliveryId,
            "condition" => $request->condition,
            "status" => $request->status,
        ]);

        return response()->json(
            $equipment
                ->fresh()
                ->load(["type", "brand", "model", "delivery.supplier"]),
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
            "brand_id" => "sometimes|exists:brands,id",
            "model_id" => "sometimes|exists:equipment_models,id",
            "serial_number" =>
                "sometimes|string|unique:equipment,serial_number," .
                $equipment->id,
            "delivery_id" => "sometimes|nullable|exists:deliveries,id",
            "condition" => "required|in:" . implode(",", Equipment::CONDITIONS),
            "status" => "required|in:" . implode(",", Equipment::STATUSES),
        ]);

        $equipment->update(
            $request->only([
                "equipment_type_id",
                "brand_id",
                "model_id",
                "serial_number",
                "delivery_id",
                "condition",
                "status",
            ]),
        );

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

    private function resolveDelivery(Request $request): Delivery
    {
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
}
