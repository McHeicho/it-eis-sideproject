<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('home_office_tag')->default('HO')->after('department_tag');
            $table->foreign('home_office_tag')->references('tag')->on('offices')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['home_office_tag']);
            $table->dropColumn('home_office_tag');
        });
    }
};