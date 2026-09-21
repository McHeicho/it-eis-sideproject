<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

// Idempotent: fixed ids because users.role_id and EnsureUserIsAdmin key on
// them (1 = Admin, 2 = User). Same find-or-new pattern as EquipmentTypeSeeder,
// so the id survives even though Role::$fillable does not list it. Safe to run
// against the live database: an existing, unchanged row issues no UPDATE.
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([1 => 'Admin', 2 => 'User'] as $id => $name) {
            $role = Role::find($id) ?? new Role();
            $role->id = $id;
            $role->name = $name;
            $role->save();
        }
    }
}
