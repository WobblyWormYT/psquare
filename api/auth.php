<?php
// ============================================================
//  api/auth.php
//  POST ?action=register  → create new user account
//  POST ?action=login     → verify credentials
//  POST ?action=logout    → destroy session
// ============================================================

session_start();
require_once '../config.php';

$action = $_GET['action'] ?? '';
$data   = json_decode(file_get_contents('php://input'), true);
if (!$data) $data = $_POST;

// ────────────────────────────────────────────────────────────
// REGISTER
// ────────────────────────────────────────────────────────────
if ($action === 'register') {

    $full_name = trim($data['full_name'] ?? '');
    $email     = trim($data['email']     ?? '');
    $password  = $data['password']       ?? '';
    $confirm   = $data['confirm']        ?? '';

    // Validation
    if (!$full_name || !$email || !$password) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit();
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
        exit();
    }
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
        exit();
    }
    if ($password !== $confirm) {
        echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
        exit();
    }

    // Check if email already exists
    $check = mysqli_prepare($conn, "SELECT id FROM users WHERE email = ?");
    mysqli_stmt_bind_param($check, 's', $email);
    mysqli_stmt_execute($check);
    mysqli_stmt_store_result($check);

    if (mysqli_stmt_num_rows($check) > 0) {
        echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
        exit();
    }
    mysqli_stmt_close($check);

    // Hash password securely
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = mysqli_prepare($conn,
        "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)");
    mysqli_stmt_bind_param($stmt, 'sss', $full_name, $email, $hash);

    if (mysqli_stmt_execute($stmt)) {
        $user_id = mysqli_insert_id($conn);
        $_SESSION['user_id']   = $user_id;
        $_SESSION['user_name'] = $full_name;
        $_SESSION['user_email']= $email;

        echo json_encode([
            'success'   => true,
            'message'   => 'Account created successfully! Welcome, ' . $full_name . '.',
            'user_name' => $full_name
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
    }
    mysqli_stmt_close($stmt);

// ────────────────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────────────────
} elseif ($action === 'login') {

    $email    = trim($data['email']    ?? '');
    $password = $data['password']      ?? '';

    if (!$email || !$password) {
        echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
        exit();
    }

    $stmt = mysqli_prepare($conn,
        "SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?");
    mysqli_stmt_bind_param($stmt, 's', $email);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user   = mysqli_fetch_assoc($result);

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_name'] = $user['full_name'];
        $_SESSION['user_email']= $user['email'];
        $_SESSION['user_role'] = $user['role'];

        echo json_encode([
            'success'   => true,
            'message'   => 'Welcome back, ' . $user['full_name'] . '!',
            'user_name' => $user['full_name'],
            'role'      => $user['role']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Incorrect email or password.']);
    }
    mysqli_stmt_close($stmt);

// ────────────────────────────────────────────────────────────
// LOGOUT
// ────────────────────────────────────────────────────────────
} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'You have been logged out.']);

// ────────────────────────────────────────────────────────────
// CHECK SESSION (used on page load)
// ────────────────────────────────────────────────────────────
} elseif ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'success'   => true,
            'logged_in' => true,
            'user_name' => $_SESSION['user_name'],
            'role'      => $_SESSION['user_role'] ?? 'visitor'
        ]);
    } else {
        echo json_encode(['success' => true, 'logged_in' => false]);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Unknown action.']);
}

mysqli_close($conn);
?>
