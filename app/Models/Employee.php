<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['name', 'department_tag', 'branch_id'];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_tag', 'tag');
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}