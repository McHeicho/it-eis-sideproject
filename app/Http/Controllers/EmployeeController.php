<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index()
    {
        return response()->json(
            Employee::with([
                'department',
                'homeOffice',
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
            'home_office_tag' => 'required|exists:offices,tag',
        ]);

        $employee = Employee::create($request->only('name', 'department_tag'));
        return response()->json($employee->load('department'), 201);
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
            'home_office_tag' => 'sometimes|exists:offices,tag',
        ]);

        $employee->update($request->only('name', 'department_tag'));
        return response()->json($employee->load('department'));
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->json(['message' => 'Employee deleted']);
    }
}