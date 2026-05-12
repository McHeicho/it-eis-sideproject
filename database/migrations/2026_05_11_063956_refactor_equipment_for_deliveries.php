<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['supplier_id', 'purchase_date', 'voucher_no']);
            $table->foreignId('delivery_id')->nullable()->constrained('deliveries')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropForeign(['delivery_id']);
            $table->dropColumn('delivery_id');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('restrict');
            $table->date('purchase_date')->nullable();
            $table->string('voucher_no')->nullable();
        });
    }
};
