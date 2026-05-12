<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    protected $fillable = [
        'voucher_no',
        'invoice_no',
        'supplier_id',
        'purchase_date',
        'order_no',
        'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class);
    }

    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}