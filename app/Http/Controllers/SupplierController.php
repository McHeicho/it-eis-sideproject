<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        return response()->json(Supplier::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:suppliers,name',
        ]);

        $supplier = Supplier::create($request->only('name'));
        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier)
    {
        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'name' => 'sometimes|string|unique:suppliers,name,' . $supplier->id,
        ]);

        $supplier->update($request->only('name'));
        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted']);
    }
}