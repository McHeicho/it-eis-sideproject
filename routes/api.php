<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EquipmentTypeController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\EquipmentModelController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\BulkImportController;

// Public Routes
Route::post("/login", [AuthController::class, "login"]);

// Protected Routes
Route::middleware("auth:sanctum")->group(function () {
    // Auth
    Route::post("/logout", [AuthController::class, "logout"]);
    Route::get("/me", [AuthController::class, "me"]);

    // Departments
    Route::apiResource("departments", DepartmentController::class);

    // Equipment Types
    Route::apiResource("equipment-types", EquipmentTypeController::class);

    // Brands
    Route::apiResource("brands", BrandController::class);

    // Suppliers
    Route::apiResource("suppliers", SupplierController::class);

    // Equipment Models
    Route::apiResource("equipment-models", EquipmentModelController::class);

    // Employees
    Route::apiResource("employees", EmployeeController::class);

    // Equipment
    Route::get("/equipment/options", [EquipmentController::class, "options"]);
    Route::get("/equipment/form-data", [
        EquipmentController::class,
        "formData",
    ]);
    Route::get('/equipment/export', [EquipmentController::class, 'export']);
    Route::apiResource("equipment", EquipmentController::class);

    // Delivery
    Route::get("/deliveries", [DeliveryController::class, "index"]);
    Route::post("/deliveries/match", [DeliveryController::class, "match"]);
    Route::post("/deliveries", [DeliveryController::class, "store"]);
    Route::get("/deliveries/{delivery}", [DeliveryController::class, "show"]);
    Route::patch("/deliveries/{delivery}", [
        DeliveryController::class,
        "update",
    ]);
    Route::post("/deliveries/{delivery}/attachments", [
        DeliveryController::class,
        "attachFile",
    ]);
    Route::delete("/deliveries/{delivery}/attachments/{attachment}", [
        DeliveryController::class,
        "removeAttachment",
    ]);
    Route::get("/deliveries/{delivery}/attachments/{attachment}/stream", [
        DeliveryController::class,
        "streamAttachment",
    ]);

    // Assignments
    Route::get("assignments", [AssignmentController::class, "index"]);
    Route::post("assignments", [AssignmentController::class, "store"]);
    Route::get("assignments/{assignment}", [
        AssignmentController::class,
        "show",
    ]);
    Route::patch("assignments/{assignment}/return", [
        AssignmentController::class,
        "return",
    ]);

    //Bulk Import
    Route::get("/bulk-import/equipment-template", [
        BulkImportController::class,
        "downloadEquipmentTemplate",
    ]);
    Route::post("/bulk-import/equipment", [
        BulkImportController::class,
        "importEquipment",
    ]);
    Route::get("/bulk-import/employee-template", [
        BulkImportController::class,
        "downloadEmployeeTemplate",
    ]);
    Route::post("/bulk-import/employees", [
        BulkImportController::class,
        "importEmployees",
    ]);
    Route::post("/bulk-import/employees/force", [
        BulkImportController::class,
        "forceImportEmployees",
    ]);
});
