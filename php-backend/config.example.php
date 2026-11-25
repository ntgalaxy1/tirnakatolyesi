<?php
/**
 * Tırnak Atölyesi (https://tirnakatolyesi.ir) — cPanel Configuration Template
 * Rename or copy this file to `config.php` on your cPanel server (`public_html/php-backend/config.php`).
 */

declare(strict_types=1);

return [
    // MySQL Database Credentials (cPanel -> MySQL Databases)
    'db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'name' => getenv('DB_NAME') ?: 'tirnakat_db',
        'user' => getenv('DB_USER') ?: 'tirnakat_user',
        'pass' => getenv('DB_PASS') ?: 'YOUR_CPANEL_MYSQL_PASSWORD',
        'charset' => 'utf8mb4',
    ],

    // Free-Tier Google Gemini API Key (Used server-side for hand analysis & nail recommendations)
    'gemini_api_key' => getenv('GEMINI_API_KEY') ?: 'YOUR_GEMINI_API_KEY',
    'gemini_model' => 'gemini-2.5-flash',

    // Uploads Directory for Dual Image Uploads (hand_image, ai_final_image, customer_reference_image)
    'uploads_dir' => __DIR__ . '/uploads',
    'uploads_url_prefix' => '/php-backend/uploads',

    // Seeded Default Admin Account
    'default_admin' => [
        'username' => 'admin',
        'password' => 'Admin@1234',
        'full_name' => 'مدیر آتلیه ناخن (Tırnak Atölyesi)',
        'mobile' => '09120000000',
    ],
];
