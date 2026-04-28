<?php

namespace App\Http\Controllers;

use App\Models\EquipmentModel;
use Illuminate\Http\Request;

class EquipmentModelController extends Controller
{
    public function index(Request $request)
    {
        $query = EquipmentModel::with('brand');

        // Filter by brand if brand_id is passed
        if ($request->has('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'brand_id' => 'required|exists:brands,id',
            'name'     => 'required|string',
        ]);

        $model = EquipmentModel::create($request->only('brand_id', 'name'));
        return response()->json($model->load('brand'), 201);
    }

    public function show(EquipmentModel $equipmentModel)
    {
        return response()->json($equipmentModel->load('brand'));
    }

    public function update(Request $request, EquipmentModel $equipmentModel)
    {
        $request->validate([
            'brand_id' => 'sometimes|exists:brands,id',
            'name'     => 'sometimes|string',
        ]);

        $equipmentModel->update($request->only('brand_id', 'name'));
        return response()->json($equipmentModel->load('brand'));
    }

    public function destroy(EquipmentModel $equipmentModel)
    {
        $equipmentModel->delete();
        return response()->json(['message' => 'Model deleted']);
    }
}