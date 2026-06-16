<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Employee is now optional — branch-held assignments have no employee
        DB::statement('ALTER TABLE assignments MODIFY employee_id BIGINT UNSIGNED NULL');

        // 2. Branch is the other possible holder
        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('branch_id')
                ->nullable()
                ->after('employee_id')
                ->constrained('branches')
                ->onDelete('restrict');
        });

        // 3. Exactly one of employee_id / branch_id must be set
        DB::statement('ALTER TABLE assignments ADD CONSTRAINT chk_assignment_holder CHECK ((employee_id IS NULL) <> (branch_id IS NULL))');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE assignments DROP CHECK chk_assignment_holder');

        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });

        DB::statement('ALTER TABLE assignments MODIFY employee_id BIGINT UNSIGNED NOT NULL');
    }
};