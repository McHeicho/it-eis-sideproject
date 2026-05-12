<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attachment extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'attachable_type',
        'attachable_id',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'uploaded_by',
        'uploaded_by_name',
    ];

    public function attachable()
    {
        return $this->morphTo();
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}