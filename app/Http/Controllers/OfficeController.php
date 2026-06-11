<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index()
    {
        return response()->json(Office::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'tag'  => 'required|string|unique:offices,tag',
            'name' => 'required|string',
        ]);

        $office = Office::create([
            'tag'  => strtoupper($request->tag),
            'name' => $request->name,
        ]);

        return response()->json($office, 201);
    }

    public function show(Office $office)
    {
        return response()->json($office);
    }

    public function update(Request $request, Office $office)
    {
        $request->validate([
            'tag'  => 'sometimes|string|unique:offices,tag,' . $office->id,
            'name' => 'sometimes|string',
        ]);

        $office->update([
            'tag'  => strtoupper($request->tag ?? $office->tag),
            'name' => $request->name ?? $office->name,
        ]);

        return response()->json($office);
    }

    public function destroy(Office $office)
    {
        $office->delete();
        return response()->json(['message' => 'Office deleted']);
    }
}