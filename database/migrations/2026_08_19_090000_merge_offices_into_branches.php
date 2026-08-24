<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['home_office_tag']);
            $table->dropColumn('home_office_tag');
            $table->unsignedBigInteger('branch_id')->default(1)->after('department_tag');
        });

        // Every employee was home_office_tag = 'HO', and Head Office is
        // branches.id = 1, so this is a flat SET with no join.
        DB::table('employees')->update(['branch_id' => 1]);

        Schema::table('employees', function (Blueprint $table) {
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
        });

        Schema::dropIfExists('offices');
    }

    public function down(): void
    {
        Schema::create('offices', function (Blueprint $table) {
            $table->id();
            $table->string('tag')->unique();
            $table->string('name');
            $table->timestamps();
        });

        DB::table('offices')->insert([
            ['tag' => 'HO', 'name' => 'Head Office', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
            $table->string('home_office_tag')->default('HO')->after('department_tag');
            $table->foreign('home_office_tag')->references('tag')->on('offices')->onDelete('restrict');
        });
    }
};
