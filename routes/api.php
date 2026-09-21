<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EquipmentTypeController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\EquipmentModelController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\BulkImportController;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\EnsureUserIsAdmin;

// Public Routes
// throttle:10,1 = ten attempts per minute per IP (framework alias; no limiter
// definition or config change needed). Login is the only public endpoint.
Route::post("/login", [AuthController::class, "login"])->middleware("throttle:10,1");

// Protected Routes
// Two tiers. Any authenticated user (role_id 1 or 2) may read. Only
// administrators (role_id 1) may write, export, or bulk import — enforced
// here by EnsureUserIsAdmin, not by the sidebar. The dashboard trims its own
// payload per role inside DashboardController.
Route::middleware("auth:sanctum")->group(function () {
    // Auth
    Route::post("/logout", [AuthController::class, "logout"]);
    Route::get("/me", [AuthController::class, "me"]);

    // Dashboard
    Route::get("/dashboard", [DashboardController::class, "index"]);

    // Reference data — read
    Route::apiResource("departments", DepartmentController::class)->only(["index", "show"]);
    Route::apiResource("branches", BranchController::class)->only(["index", "show"]);
    Route::apiResource("equipment-types", EquipmentTypeController::class)->only(["index", "show"]);
    Route::apiResource("brands", BrandController::class)->only(["index", "show"]);
    Route::apiResource("suppliers", SupplierController::class)->only(["index", "show"]);
    Route::apiResource("equipment-models", EquipmentModelController::class)->only(["index", "show"]);
    Route::apiResource("employees", EmployeeController::class)->only(["index", "show"]);

    // Equipment — read. Static paths stay above the {equipment} resource so
    // "options", "form-data" and "export" are never captured as an id.
    Route::get("/equipment/options", [EquipmentController::class, "options"]);
    Route::get("/equipment/form-data", [EquipmentController::class, "formData"]);
    Route::get("/equipment/export", [EquipmentController::class, "export"])->middleware(EnsureUserIsAdmin::class);
    Route::apiResource("equipment", EquipmentController::class)->only(["index", "show"]);

    // Delivery — read (match is a lookup, not a write)
    Route::get("/deliveries", [DeliveryController::class, "index"]);
    Route::post("/deliveries/match", [DeliveryController::class, "match"]);
    Route::get("/deliveries/{delivery}", [DeliveryController::class, "show"]);
    Route::get("/deliveries/{delivery}/attachments/{attachment}/stream", [DeliveryController::class, "streamAttachment"]);

    // Assignments — read
    Route::get("assignments", [AssignmentController::class, "index"]);
    Route::get("assignments/{assignment}", [AssignmentController::class, "show"]);

    // Administrators only — every write, plus bulk import.
    Route::middleware(EnsureUserIsAdmin::class)->group(function () {
        // Reference data — write. No destroy: records retire through status
        // flags, never hard deletes (locked decision).
        Route::apiResource("departments", DepartmentController::class)->only(["store", "update"]);
        Route::apiResource("branches", BranchController::class)->only(["store", "update"]);
        Route::apiResource("equipment-types", EquipmentTypeController::class)->only(["store", "update"]);
        Route::apiResource("brands", BrandController::class)->only(["store", "update"]);
        Route::apiResource("suppliers", SupplierController::class)->only(["store", "update"]);
        Route::apiResource("equipment-models", EquipmentModelController::class)->only(["store", "update"]);
        Route::apiResource("employees", EmployeeController::class)->only(["store", "update"]);

        // Equipment — write. destroy stays registered: it answers 403 with an
        // explanatory message by decision (cleanup #23).
        Route::apiResource("equipment", EquipmentController::class)->only(["store", "update", "destroy"]);

        // Delivery — write
        Route::post("/deliveries", [DeliveryController::class, "store"]);
        Route::patch("/deliveries/{delivery}", [DeliveryController::class, "update"]);
        Route::post("/deliveries/{delivery}/attachments", [DeliveryController::class, "attachFile"]);
        Route::delete("/deliveries/{delivery}/attachments/{attachment}", [DeliveryController::class, "removeAttachment"]);

        // Assignments — write
        Route::post("assignments", [AssignmentController::class, "store"]);
        Route::patch("assignments/{assignment}/return", [AssignmentController::class, "return"]);

        // Bulk Import
        Route::get("/bulk-import/equipment-template", [BulkImportController::class, "downloadEquipmentTemplate"]);
        Route::post("/bulk-import/equipment", [BulkImportController::class, "importEquipment"]);
        Route::get("/bulk-import/employee-template", [BulkImportController::class, "downloadEmployeeTemplate"]);
        Route::post("/bulk-import/employees", [BulkImportController::class, "importEmployees"]);
        Route::post("/bulk-import/employees/force", [BulkImportController::class, "forceImportEmployees"]);
    });
});
