<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $fillable = [
        'asset_tag', 'equipment_type_id', 'brand_id',
        'model_id', 'serial_number', 'supplier_id',
        'purchase_date', 'voucher_no', 'condition', 'status'
    ];

    public function type()
    {
        return $this->belongsTo(EquipmentType::class, 'equipment_type_id');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function model()
    {
        return $this->belongsTo(EquipmentModel::class, 'model_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function currentAssignment()
    {
        return $this->hasOne(Assignment::class)->whereNull('date_returned');
    }
}