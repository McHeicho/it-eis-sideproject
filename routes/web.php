<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Catch-all: hand any non-API path to the SPA so React Router can take over
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!api/).*$');