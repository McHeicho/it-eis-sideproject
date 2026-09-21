<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Equipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Assignment::with([
            "equipment.brand",
            "equipment.model",
            "employee.department",
            "employee.branch",
            "branch",
        ]);

        // Both frontend consumers read active rows only; history stays
        // reachable without the flag for a future history view.
        if ($request->boolean("active")) {
            $query->whereNull("date_returned");
        }

        return response()->json($query->get());
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
            return $this->validationError(
                "equipment_id",
                "Equipment is not available for assignment",
            );
        }

        if ($equipment->currentAssignment()->exists()) {
            return $this->validationError(
                "equipment_id",
                "This equipment already has an active assignment.",
            );
        }

        // Row and status flag move together or not at all.
        $assignment = DB::transaction(function () use ($request, $equipment) {
            $assignment = Assignment::create(
                $request->only(
                    "equipment_id",
                    "employee_id",
                    "branch_id",
                    "date_assigned",
                    "notes",
                ),
            );

            $equipment->update(["status" => "Assigned"]);

            return $assignment;
        });

        return response()->json(
            $assignment->load(["equipment", "employee", "branch"]),
            201,
        );
    }

    public function return(Request $request, Assignment $assignment)
    {
        $request->validate([
            "date_returned" => "required|date|after_or_equal:" . $assignment->date_assigned,
            "notes" => "nullable|string",
        ]);

        // A second return on an old row used to reset a unit that had since
        // been reassigned to Available while the new assignment stayed open.
        if ($assignment->date_returned !== null) {
            return $this->validationError(
                "date_returned",
                "This assignment was already returned on " . $assignment->date_returned . ".",
            );
        }

        DB::transaction(function () use ($request, $assignment) {
            $assignment->update([
                "date_returned" => $request->date_returned,
                "notes" => $request->notes ?? $assignment->notes,
            ]);

            // Set equipment back to Available
            $assignment->equipment->update(["status" => "Available"]);
        });

        return response()->json($assignment->load(["equipment", "employee", "branch"]));
    }

    public function show(Assignment $assignment)
    {
        return response()->json($assignment->load(["equipment", "employee", "branch"]));
    }

    // 422 in Laravel's own validation shape so the modals show it under the
    // field instead of crashing on a missing `errors` key (blueprint A-05).
    private function validationError(string $field, string $message)
    {
        return response()->json(
            ["message" => $message, "errors" => [$field => [$message]]],
            422,
        );
    }
}
