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
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->string('asset_tag')->nullable()->unique();
            $table->foreignId('equipment_type_id')->constrained('equipment_types')->onDelete('restrict');
            $table->foreignId('brand_id')->constrained('brands')->onDelete('restrict');
            $table->foreignId('model_id')->constrained('equipment_models')->onDelete('restrict');
            $table->string('serial_number')->unique();
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict');
            $table->date('purchase_date');
            $table->string('voucher_no')->nullable();
            $table->enum('condition', ['Good', 'Defective']);
            $table->enum('status', ['Available', 'Assigned', 'Under Repair', 'Lost/Missing', 'Retired/Disposed', 'Spare Unit']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
