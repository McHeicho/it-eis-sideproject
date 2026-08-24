<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index()
    {
        return response()->json(
            Employee::with([
                'department',
                'branch',
                'assignments' => function ($query) {
                    $query->whereNull('date_returned');
                },
                'assignments.equipment'
            ])
            ->orderBy('name')
            ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'           => 'required|string',
            'department_tag' => 'required|exists:departments,tag',
            'branch_id' => [
                'required',
                Rule::exists('branches', 'id')->whereIn('branch_code', ['HO', 'MLA']),
            ],
        ]);

        $employee = Employee::create($request->only('name', 'department_tag', 'branch_id'));
        return response()->json($employee->load('department', 'branch'), 201);
    }

    public function show(Employee $employee)
    {
        return response()->json($employee->load('department'));
    }

    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'name'           => 'sometimes|string',
            'department_tag' => 'sometimes|exists:departments,tag',
            'branch_id' => [
                'sometimes',
                Rule::exists('branches', 'id')->whereIn('branch_code', ['HO', 'MLA']),
            ],
        ]);

        $employee->update($request->only('name', 'department_tag', 'branch_id'));
        return response()->json($employee->load('department', 'branch'));
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->json(['message' => 'Employee deleted']);
    }
}