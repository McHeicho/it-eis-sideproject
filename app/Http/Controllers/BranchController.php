<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        return response()->json(Branch::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'branch_code'    => 'required|string|unique:branches,branch_code',
            'branch_name'    => 'required|string|unique:branches,branch_name',
            'branch_manager' => 'nullable|string',
        ]);

        $branch = Branch::create([
            'branch_code'    => strtoupper($request->branch_code),
            'branch_name'    => $request->branch_name,
            'branch_manager' => $request->branch_manager,
        ]);

        return response()->json($branch, 201);
    }

    public function show(Branch $branch)
    {
        return response()->json($branch);
    }

    public function update(Request $request, Branch $branch)
    {
        $request->validate([
            'branch_code'    => 'sometimes|string|unique:branches,branch_code,' . $branch->id,
            'branch_name'    => 'sometimes|string|unique:branches,branch_name,' . $branch->id,
            'branch_manager' => 'nullable|string',
        ]);

        $branch->update([
            'branch_code'    => strtoupper($request->branch_code ?? $branch->branch_code),
            'branch_name'    => $request->branch_name ?? $branch->branch_name,
            'branch_manager' => $request->has('branch_manager') ? $request->branch_manager : $branch->branch_manager,
        ]);

        return response()->json($branch);
    }

    public function destroy(Branch $branch)
    {
        $branch->delete();
        return response()->json(['message' => 'Branch deleted']);
    }
}