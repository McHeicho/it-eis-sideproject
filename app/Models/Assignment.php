<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    protected $fillable = [
        'equipment_id', 'employee_id',
        'date_assigned', 'date_returned', 'notes'
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}