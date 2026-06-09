<?php

namespace Database\Seeders;

use App\Models\EquipmentType;
use Illuminate\Database\Seeder;

class EquipmentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $laptop = EquipmentType::find(1) ?? new EquipmentType();
        $laptop->id   = 1;
        $laptop->name = 'Laptop';
        $laptop->icon = 'laptop';
        $laptop->save();
    }
}