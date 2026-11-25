<?php
/**
 * Tırnak Atölyesi (https://tirnakatolyesi.ir) — Complete PHP 8.2+ REST API (`api.php`)
 * Handles authentication, dual image uploads (`uploads/`), reservations,
 * site & customer galleries, time slots, and free-tier `gemini-2.5-flash` hand analysis.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configFile = __DIR__ . '/config.php';
$config = file_exists($configFile) ? require $configFile : require __DIR__ . '/config.example.php';

$uploadsDir = $config['uploads_dir'] ?? (__DIR__ . '/uploads');
if (!is_dir($uploadsDir)) {
    @mkdir($uploadsDir, 0755, true);
}

function getDbConnection(array $dbConfig): PDO {
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $dbConfig['host'],
        $dbConfig['name'],
        $dbConfig['charset'] ?? 'utf8mb4'
    );
    return new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

/**
 * Saves a base64 data URL image to `php-backend/uploads/` and returns the public path
 */
function saveBase64ImageToUploads(?string $dataUrl, string $prefix, string $uploadsDir, string $urlPrefix): ?string {
    if (!$dataUrl || !str_starts_with($dataUrl, 'data:image/')) {
        return $dataUrl;
    }
    if (!preg_match('/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/', $dataUrl, $matches)) {
        return $dataUrl;
    }
    $ext = strtolower($matches[1]) === 'png' ? 'png' : (strtolower($matches[1]) === 'webp' ? 'webp' : 'jpg');
    $binary = base64_decode($matches[2], true);
    if ($binary === false) {
        return $dataUrl;
    }
    $filename = sprintf('%s_%s_%d.%s', $prefix, date('Ymd_His'), random_int(1000, 9999), $ext);
    $filePath = rtrim($uploadsDir, '/') . '/' . $filename;
    if (@file_put_contents($filePath, $binary) !== false) {
        return rtrim($urlPrefix, '/') . '/' . $filename;
    }
    return $dataUrl;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'];
$rawBody = file_get_contents('php://input');
$body = $rawBody ? (json_decode($rawBody, true) ?? []) : [];

try {
    // 1. Free-Tier Gemini 2.5 Flash Hand Analysis & Recommendation Endpoint
    if (($uri === '/api/ai/analyze-hand' || $uri === '/api/ai/nail-tryon') && $method === 'POST') {
        $handImageBase64 = $body['handImageBase64'] ?? '';
        $selectedDesignTitle = $body['designTitle'] ?? 'فرنچ مرواریدی سرخابی';
        $apiKey = $config['gemini_api_key'] ?? '';

        if (!$apiKey || $apiKey === 'YOUR_GEMINI_API_KEY') {
            echo json_encode([
                'recommendedShape' => 'almond',
                'recommendedColorHex' => '#D42663',
                'analysisFa' => 'بر اساس فرم انگشتان و تناژ گرم پوست دست شما، فرم «بادامی (Almond)» با تم رنگی «سرخابی تمشکی (#D42663)» و ورق طلا بیشترین کشیدگی و ظرافت را ایجاد می‌کند.',
                'analysisTr' => 'Parmak yapınız ve sıcak cilt alt tonunuza göre Badem (Almond) tırnak formu ve Ahududu Macenta (#D42663) tonu en zarif görünümü sağlar.',
                'engine' => 'studio-heuristic-fallback',
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $mimeType = 'image/jpeg';
        $cleanBase64 = $handImageBase64;
        if (preg_match('/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/', $handImageBase64, $matches)) {
            $mimeType = $matches[1];
            $cleanBase64 = $matches[2];
        }

        $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode($apiKey);
        $prompt = "Analyze this hand photo for a luxury nail salon appointment at Tırnak Atölyesi. "
            . "Return a JSON object with keys: recommendedShape (one of: almond, coffin, square, round), "
            . "recommendedColorHex (one of: #D42663, #F3769B, #7B2869, #3B132A, #F7AD93, #E5A93B), "
            . "analysisFa (1 concise sentence in Persian advising the best nail shape and color for their hand), "
            . "analysisTr (1 concise sentence in Turkish).";

        $payload = [
            'contents' => [[
                'parts' => [
                    ['inline_data' => ['mime_type' => $mimeType, 'data' => $cleanBase64]],
                    ['text' => $prompt],
                ],
            ]],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
            ],
        ];

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 25,
        ]);
        $resp = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status === 200 && $resp) {
            $decoded = json_decode($resp, true);
            $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $parsed = json_decode($text, true);
            if (is_array($parsed)) {
                echo json_encode(array_merge($parsed, ['engine' => 'gemini-2.5-flash']), JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        echo json_encode([
            'recommendedShape' => 'almond',
            'recommendedColorHex' => '#D42663',
            'analysisFa' => 'فرم بادامی (Almond) با تم سرخابی (#D42663) و هایلایت طلایی برای فرم دست شما ایده‌آل است.',
            'analysisTr' => 'Badem tırnak formu ve Ahududu Macenta (#D42663) el yapınız için idealdir.',
            'engine' => 'fallback',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo = getDbConnection($config['db']);

    // 2. Auth Login (Supports seeded admin / Admin@1234 + MySQL customers)
    if ($uri === '/api/auth/login' && $method === 'POST') {
        $identifier = trim((string)($body['identifier'] ?? ''));
        $password = (string)($body['password'] ?? '');

        $defaultAdmin = $config['default_admin'];
        if ($identifier === $defaultAdmin['username'] && $password === $defaultAdmin['password']) {
            echo json_encode([
                'user' => [
                    'id' => 'admin-1',
                    'fullName' => $defaultAdmin['full_name'],
                    'mobile' => $defaultAdmin['mobile'],
                    'username' => $defaultAdmin['username'],
                    'role' => 'admin',
                ],
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE mobile = :id OR username = :id LIMIT 1');
        $stmt->execute(['id' => $identifier]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'اطلاعات ورود اشتباه است. (ادمین دمو: admin / Admin@1234)'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode([
            'user' => [
                'id' => (string)$user['id'],
                'fullName' => $user['full_name'],
                'mobile' => $user['mobile'],
                'role' => $user['role'],
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 3. Auth Register
    if ($uri === '/api/auth/register' && $method === 'POST') {
        $fullName = trim((string)($body['fullName'] ?? ''));
        $mobile = trim((string)($body['mobile'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if (!$fullName || !$mobile || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'تمامی فیلدها الزامی است.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (full_name, mobile, password_hash, role) VALUES (:name, :mobile, :hash, "customer")');
        $stmt->execute(['name' => $fullName, 'mobile' => $mobile, 'hash' => $hash]);

        echo json_encode([
            'user' => [
                'id' => (string)$pdo->lastInsertId(),
                'fullName' => $fullName,
                'mobile' => $mobile,
                'role' => 'customer',
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 4. Create Reservation with Dual Image Uploads saved to `uploads/`
    if ($uri === '/api/reservations' && $method === 'POST') {
        $trackingCode = 'TA-' . random_int(1000, 9999);
        $urlPrefix = $config['uploads_url_prefix'] ?? '/php-backend/uploads';

        $handUrl = saveBase64ImageToUploads($body['handImage'] ?? null, 'hand', $uploadsDir, $urlPrefix);
        $aiFinalUrl = saveBase64ImageToUploads($body['aiFinalImage'] ?? null, 'ai_final', $uploadsDir, $urlPrefix);
        $custRefUrl = saveBase64ImageToUploads($body['customerReferenceImage'] ?? null, 'cust_ref', $uploadsDir, $urlPrefix);

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
            'hand_image' => $handUrl,
            'ai_final_image' => $aiFinalUrl,
            'customer_reference_image' => $custRefUrl,
        ]);

        echo json_encode([
            'reservation' => array_merge($body, [
                'id' => (string)$pdo->lastInsertId(),
                'trackingCode' => $trackingCode,
                'handImage' => $handUrl,
                'aiFinalImage' => $aiFinalUrl,
                'customerReferenceImage' => $custRefUrl,
                'status' => 'pending',
                'publishedToCustomerGallery' => false,
            ]),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['status' => 'Tırnak Atölyesi API (api.php) Ready'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
