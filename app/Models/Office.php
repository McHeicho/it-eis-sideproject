<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    protected $fillable = ['tag', 'name'];

    public function employees()
    {
        return $this->hasMany(Employee::class, 'home_office_tag', 'tag');
    }
}