<?php

$frontendUrl = env('FRONTEND_URL');

$allowedOrigins = array_values(array_unique(array_filter([
    $frontendUrl ? rtrim($frontendUrl, '/') : null,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
])));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
