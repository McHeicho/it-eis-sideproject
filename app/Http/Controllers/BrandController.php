<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index()
    {
        return response()->json(Brand::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:brands,name',
        ]);

        $brand = Brand::create([
            'name' => ucwords($request->name),
        ]);

        return response()->json($brand, 201);
    }

    public function show(Brand $brand)
    {
        return response()->json($brand);
    }

    public function update(Request $request, Brand $brand)
    {
        $request->validate([
            'name' => 'sometimes|string|unique:brands,name,' . $brand->id,
        ]);

        $brand->update([
            'name' => ucwords($request->name ?? $brand->name),
        ]);

        return response()->json($brand);
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();
        return response()->json(['message' => 'Brand deleted']);
    }
}