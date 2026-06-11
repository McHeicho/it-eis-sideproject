<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['name', 'department_tag', 'home_office_tag'];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_tag', 'tag');
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }
    
    public function homeOffice()
    {
        return $this->belongsTo(Office::class, 'home_office_tag', 'tag');
    }

}