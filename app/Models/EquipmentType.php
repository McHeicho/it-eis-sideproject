<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentType extends Model
{
    protected $fillable = ['name', 'icon'];

    public function equipment()
    {
        return $this->hasMany(Equipment::class);
    }
}