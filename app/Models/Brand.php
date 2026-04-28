<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $fillable = ['name'];

    public function models()
    {
        return $this->hasMany(EquipmentModel::class, 'brand_id');
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class);
    }
}