<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentModel extends Model
{

    protected $fillable = ['brand_id', 'name'];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class, 'model_id');
    }
}