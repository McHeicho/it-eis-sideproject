<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'tag'  => 'required|string|unique:departments,tag',
            'name' => 'required|string',
        ]);

        $department = Department::create([
            'tag'  => strtoupper($request->tag),
            'name' => $request->name,
        ]);

        return response()->json($department, 201);
    }

    public function show(Department $department)
    {
        return response()->json($department);
    }

    public function update(Request $request, Department $department)
    {
        $request->validate([
            'tag'  => 'sometimes|string|unique:departments,tag,' . $department->id,
            'name' => 'sometimes|string',
        ]);

        $department->update([
            'tag'  => strtoupper($request->tag ?? $department->tag),
            'name' => $request->name ?? $department->name,
        ]);

        return response()->json($department);
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return response()->json(['message' => 'Department deleted']);
    }
}