<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Roles: role_id 1 = Admin, 2 = User (handoff §4). Applied in routes/api.php
// to every write route. Runs after auth:sanctum, so $request->user() is set;
// the null-safe access only guards against misordered middleware.
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ((int) $request->user()?->role_id !== 1) {
            return response()->json(
                ["message" => "This action requires an administrator account."],
                403,
            );
        }

        return $next($request);
    }
}
