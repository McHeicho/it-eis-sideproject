<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['tag' => 'MIS',       'name' => 'MIS'],
            ['tag' => 'UW',        'name' => 'Underwriting'],
            ['tag' => 'BONDS',     'name' => 'Bonds'],
            ['tag' => 'CLMS',      'name' => 'Claims'],
            ['tag' => 'MKTG-A',    'name' => 'Marketing - Agencies'],
            ['tag' => 'MKTG-BROPS','name' => 'Marketing - Branch Operations'],
            ['tag' => 'MKTG-BD',   'name' => 'Marketing - Business Development & Brokers'],
            ['tag' => 'OP',        'name' => 'Office of the President'],
            ['tag' => 'TRS',       'name' => 'Treasury'],
            ['tag' => 'ACTG',      'name' => 'Accounting'],
            ['tag' => 'LEGAL',     'name' => 'Legal & Compliance'],
            ['tag' => 'COLL',      'name' => 'Collection'],
            ['tag' => 'ADMIN',     'name' => 'Admin'],
            ['tag' => 'HR',        'name' => 'Human Resources'],
            ['tag' => 'IA',        'name' => 'Internal Audit'],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(
                ['tag' => $dept['tag']],
                ['name' => $dept['name']]
            );
        }
    }
}