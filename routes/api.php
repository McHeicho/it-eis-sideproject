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
use App\Http\Controllers\AssignmentController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Departments
    Route::apiResource('departments', DepartmentController::class);

    // Equipment Types
    Route::apiResource('equipment-types', EquipmentTypeController::class);

    // Brands
    Route::apiResource('brands', BrandController::class);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);

    // Equipment Models
    Route::apiResource('equipment-models', EquipmentModelController::class);

    // Employees
    Route::apiResource('employees', EmployeeController::class);

    // Equipment
    Route::apiResource('equipment', EquipmentController::class);

    // Assignments
    Route::get('assignments', [AssignmentController::class, 'index']);
    Route::post('assignments', [AssignmentController::class, 'store']);
    Route::get('assignments/{assignment}', [AssignmentController::class, 'show']);
    Route::patch('assignments/{assignment}/return', [AssignmentController::class, 'return']);
});