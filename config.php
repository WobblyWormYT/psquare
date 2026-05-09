<?php
// ============================================================
//  config.php — Database Connection
//  Included by all API files
// ============================================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // default XAMPP username
define('DB_PASS', '');           // default XAMPP password (empty)
define('DB_NAME', 'psquare_db');

$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . mysqli_connect_error()
    ]);
    exit();
}

// Set charset to UTF-8 for special characters
mysqli_set_charset($conn, 'utf8');

// Allow AJAX requests from the same origin
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
?>
