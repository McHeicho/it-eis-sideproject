<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    public function index()
    {
        return response()->json(
            Equipment::with(['type', 'brand', 'model', 'supplier', 'currentAssignment.employee'])
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'equipment_type_id' => 'required|exists:equipment_types,id',
            'brand_id'          => 'required|exists:brands,id',
            'model_id'          => 'required|exists:equipment_models,id',
            'serial_number'     => 'required|string|unique:equipment,serial_number',
            'supplier_id'       => 'required|exists:suppliers,id',
            'purchase_date'     => 'required|date',
            'voucher_no'        => 'nullable|string',
            'condition'         => 'required|in:Good,Defective',
            'status'            => 'required|in:Available,Assigned,Under Repair,Lost/Missing,Retired/Disposed,Spare Unit',
        ]);

        $equipment = Equipment::create($request->all());
        return response()->json($equipment->load(['type', 'brand', 'model', 'supplier']), 201);
    }

    public function show(Equipment $equipment)
    {
        return response()->json(
            $equipment->load(['type', 'brand', 'model', 'supplier', 'assignments.employee'])
        );
    }

    public function update(Request $request, Equipment $equipment)
    {
        $request->validate([
            'equipment_type_id' => 'sometimes|exists:equipment_types,id',
            'brand_id'          => 'sometimes|exists:brands,id',
            'model_id'          => 'sometimes|exists:equipment_models,id',
            'serial_number'     => 'sometimes|string|unique:equipment,serial_number,' . $equipment->id,
            'supplier_id'       => 'sometimes|exists:suppliers,id',
            'purchase_date'     => 'sometimes|date',
            'voucher_no'        => 'nullable|string',
            'condition'         => 'sometimes|in:Good,Defective',
            'status'            => 'sometimes|in:Available,Assigned,Under Repair,Lost/Missing,Retired/Disposed,Spare Unit',
        ]);

        $equipment->update($request->all());
        return response()->json($equipment->load(['type', 'brand', 'model', 'supplier']));
    }

    public function destroy(Equipment $equipment)
    {
        $equipment->delete();
        return response()->json(['message' => 'Equipment deleted']);
    }
}