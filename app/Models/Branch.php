<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['branch_code', 'branch_name', 'branch_manager'];

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }
}