<?php
/**
 * Tırnak Atölyesi (https://tirnakatolyesi.ir) — PHP 8.2+ REST API for cPanel
 * Handles MySQL persistence and server-side Google Gemini Image Editing API
 * (`gemini-3.1-flash-lite-image`) without exposing GEMINI_API_KEY to the browser.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://tirnakatolyesi.ir');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Load cPanel environment configuration
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'tirnakat_db';
$dbUser = getenv('DB_USER') ?: 'tirnakat_user';
$dbPass = getenv('DB_PASS') ?: '';
$geminiApiKey = getenv('GEMINI_API_KEY') ?: '';

function getPdoConnection(string $host, string $db, string $user, string $pass): PDO {
    $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'];
$rawBody = file_get_contents('php://input');
$body = $rawBody ? (json_decode($rawBody, true) ?? []) : [];

try {
    // Server-Side Gemini Virtual Nail Try-On Endpoint
    if ($uri === '/api/ai/nail-tryon' && $method === 'POST') {
        $handImageBase64 = $body['handImageBase64'] ?? '';
        $designTitle = $body['designTitle'] ?? 'Pearl French Nail Art';
        $designPrompt = $body['designPrompt'] ?? $designTitle;
        $nailShape = $body['nailShape'] ?? 'almond';
        $nailColorHex = $body['nailColorHex'] ?? '#D42663';

        if (!$handImageBase64) {
            http_response_code(400);
            echo json_encode(['error' => 'تصویر دست ارسال نشده است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!$geminiApiKey) {
            http_response_code(503);
            echo json_encode([
                'fallbackRequired' => true,
                'message' => 'GEMINI_API_KEY در تنظیمات سرور cPanel وارد نشده است.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $mimeType = 'image/jpeg';
        $cleanBase64 = $handImageBase64;
        if (preg_match('/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/', $handImageBase64, $matches)) {
            $mimeType = $matches[1];
            $cleanBase64 = $matches[2];
        }

        $prompt = "Apply a realistic luxury salon manicure onto the fingernails of this hand photo. "
            . "Nail shape: {$nailShape}. Primary color hex: {$nailColorHex}. "
            . "Nail art design: {$designPrompt}. "
            . "Strictly preserve hand skin tone, lighting, and natural finger position.";

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=" . urlencode($geminiApiKey);

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => $cleanBase64,
                            ],
                        ],
                        [
                            'text' => $prompt,
                        ],
                    ],
                ],
            ],
        ];

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 45,
        ]);

        $resp = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status !== 200 || !$resp) {
            http_response_code(503);
            echo json_encode(['fallbackRequired' => true], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $decoded = json_decode($resp, true);
        $parts = $decoded['candidates'][0]['content']['parts'] ?? [];
        foreach ($parts as $part) {
            if (!empty($part['inlineData']['data'])) {
                $outMime = $part['inlineData']['mimeType'] ?? 'image/png';
                echo json_encode([
                    'aiFinalImage' => "data:{$outMime};base64," . $part['inlineData']['data'],
                    'engine' => 'gemini-3.1-flash-lite-image',
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        http_response_code(503);
        echo json_encode(['fallbackRequired' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Database-backed routes for cPanel MySQL
    $pdo = getPdoConnection($dbHost, $dbName, $dbUser, $dbPass);

    if ($uri === '/api/auth/login' && $method === 'POST') {
        $identifier = trim((string)($body['identifier'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($identifier === 'admin' && $password === 'Admin@1234') {
            echo json_encode([
                'user' => [
                    'id' => 'admin-1',
                    'fullName' => 'مدیر آتلیه ناخن (Tırnak Atölyesi)',
                    'mobile' => '09120000000',
                    'username' => 'admin',
                    'role' => 'admin',
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE mobile = :id OR username = :id LIMIT 1');
        $stmt->execute(['id' => $identifier]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'نام کاربری یا رمز عبور اشتباه است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode([
            'user' => [
                'id' => (string)$user['id'],
                'fullName' => $user['full_name'],
                'mobile' => $user['mobile'],
                'role' => $user['role'],
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uri === '/api/reservations' && $method === 'POST') {
        $trackingCode = 'TA-' . random_int(1000, 9999);
        $stmt = $pdo->prepare('
            INSERT INTO reservations (
                tracking_code, customer_name, customer_mobile, service_type,
                reservation_date, time_slot, notes, selected_design_code,
                selected_design_title, nail_shape, nail_color_hex,
                hand_image, ai_final_image, customer_reference_image, status
            ) VALUES (
                :tracking_code, :customer_name, :customer_mobile, :service_type,
                :reservation_date, :time_slot, :notes, :selected_design_code,
                :selected_design_title, :nail_shape, :nail_color_hex,
                :hand_image, :ai_final_image, :customer_reference_image, "pending"
            )
        ');
        $stmt->execute([
            'tracking_code' => $trackingCode,
            'customer_name' => $body['customerName'] ?? '',
            'customer_mobile' => $body['customerMobile'] ?? '',
            'service_type' => $body['serviceType'] ?? 'vip_design',
            'reservation_date' => $body['date'] ?? '',
            'time_slot' => $body['timeSlot'] ?? '',
            'notes' => $body['notes'] ?? '',
            'selected_design_code' => $body['selectedDesignCode'] ?? null,
            'selected_design_title' => $body['selectedDesignTitle'] ?? null,
            'nail_shape' => $body['nailShape'] ?? 'almond',
            'nail_color_hex' => $body['nailColorHex'] ?? '#D42663',
            'hand_image' => $body['handImage'] ?? null,
            'ai_final_image' => $body['aiFinalImage'] ?? null,
            'customer_reference_image' => $body['customerReferenceImage'] ?? null,
        ]);

        echo json_encode([
            'reservation' => array_merge($body, [
                'id' => (string)$pdo->lastInsertId(),
                'trackingCode' => $trackingCode,
                'status' => 'pending',
                'publishedToCustomerGallery' => false,
            ])
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['status' => 'Tırnak Atölyesi PHP 8.2 API Ready'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
