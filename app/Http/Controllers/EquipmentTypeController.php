<?php

namespace App\Http\Controllers;

use App\Models\EquipmentType;
use Illuminate\Http\Request;

class EquipmentTypeController extends Controller
{
    public function index()
    {
        return response()->json(EquipmentType::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'icon' => 'nullable|string',
        ]);

        $type = EquipmentType::create($request->only('name', 'icon'));
        return response()->json($type, 201);
    }

    public function show(EquipmentType $equipmentType)
    {
        return response()->json($equipmentType);
    }

    public function update(Request $request, EquipmentType $equipmentType)
    {
        $request->validate([
            'name' => 'sometimes|string',
            'icon' => 'nullable|string',
        ]);

        $equipmentType->update($request->only('name', 'icon'));
        return response()->json($equipmentType);
    }

    public function destroy(EquipmentType $equipmentType)
    {
        $equipmentType->delete();
        return response()->json(['message' => 'Equipment type deleted']);
    }
}