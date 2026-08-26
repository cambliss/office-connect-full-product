<?php

namespace App\Http\Controllers\Auth;

use App\Abstracts\Http\Controller;
use App\Models\Auth\User;
use App\Models\Common\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Sso extends Controller
{
    public function handle(Request $request)
    {
        $token = $request->get('token') ?? $request->post('token');
        if (! $token) {
            return response()->json(['error' => 'SSO Token is required'], 400);
        }

        $secret = env('SAAS_JWT_SECRET') ?: env('JWT_SECRET');
        if (! $secret) {
            return response()->json(['error' => 'SSO secret not configured'], 500);
        }

        try {
            // Verify JWT
            $payload = JWT::decode($token, new Key($secret, 'HS256'));
            $email = strtolower($payload->email ?? '');

            if (! $email) {
                return response()->json(['error' => 'Invalid SSO payload: email missing'], 400);
            }

            // Find or create user
            $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

            if (! $user) {
                $company = Company::enabled()->first();
                if (! $company) {
                    return response()->json(['error' => 'No active company found for SSO provision'], 500);
                }

                $user = User::create([
                    'name' => $payload->firstName ?? explode('@', $email)[0],
                    'email' => $email,
                    'password' => bcrypt(Str::random(16)),
                    'enabled' => 1,
                    'locale' => 'en-US',
                ]);

                $user->companies()->attach($company->id);
            }

            if (! $user->enabled) {
                return response()->json(['error' => 'Account is disabled'], 403);
            }

            Auth::login($user, true);

            $company = $user->companies()->enabled()->first();
            $redirectUrl = route($user->landing_page ?? 'dashboard', ['company_id' => $company->id ?? 1]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'redirect' => $redirectUrl,
                ]);
            }

            return redirect()->to($redirectUrl);

        } catch (\Exception $e) {
            Log::error('Akaunting SSO Login Error: ' . $e->getMessage());
            return response()->json(['error' => 'SSO Authentication failed: ' . $e->getMessage()], 401);
        }
    }
}
