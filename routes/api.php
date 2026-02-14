<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'message' => 'Laravel Headless Starter API',
    'version' => '1.0.0',
    'status' => 'active',
]));

Route::get('/health', fn () => response()->json([
    'status' => 'healthy',
    'timestamp' => now()->toIso8601String(),
]));

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
});
