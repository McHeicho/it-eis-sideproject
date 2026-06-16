<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Equipment;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index()
    {
        return response()->json(
            Assignment::with([
                "equipment.brand",
                "equipment.model",
                "employee.department",
                "employee.homeOffice",
                "branch",
            ])->get(),
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            "equipment_id"  => "required|exists:equipment,id",
            "employee_id"   => "nullable|required_without:branch_id|prohibits:branch_id|exists:employees,id",
            "branch_id"     => "nullable|required_without:employee_id|prohibits:employee_id|exists:branches,id",
            "date_assigned" => "required|date",
            "notes"         => "nullable|string",
        ]);

        // Make sure equipment is Available before assigning
        $equipment = Equipment::findOrFail($request->equipment_id);

        $assignable = ["Available", "Spare Unit", "Lost/Missing"];

        if (!in_array($equipment->status, $assignable, true)) {
            return response()->json(
                ["message" => "Equipment is not available for assignment"],
                422,
            );
        }

        $assignment = Assignment::create(
            $request->only(
                "equipment_id",
                "employee_id",
                "branch_id",
                "date_assigned",
                "notes",
            ),
        );

        // Update equipment status to Assigned
        $equipment->update(["status" => "Assigned"]);

        return response()->json(
            $assignment->load(["equipment", "employee", "branch"]),
            201,
        );
    }

    public function return(Request $request, Assignment $assignment)
    {
        $request->validate([
            "date_returned" => "required|date",
            "notes" => "nullable|string",
        ]);

        $assignment->update([
            "date_returned" => $request->date_returned,
            "notes" => $request->notes ?? $assignment->notes,
        ]);

        // Set equipment back to Available
        $assignment->equipment->update(["status" => "Available"]);

        return response()->json($assignment->load(["equipment", "employee", "branch"]));
    }

    public function show(Assignment $assignment)
    {
        return response()->json($assignment->load(["equipment", "employee", "branch"]));
    }
}