<?php
// ============================================================
//  api/contact.php
//  POST → save enquiry to the database
// ============================================================

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) $data = $_POST;

    // Validate
    if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Name, email, and message are required.'
        ]);
        exit();
    }

    $name    = mysqli_real_escape_string($conn, trim($data['name']));
    $email   = mysqli_real_escape_string($conn, trim($data['email']));
    $subject = mysqli_real_escape_string($conn, trim($data['subject'] ?? ''));
    $message = mysqli_real_escape_string($conn, trim($data['message']));

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Please enter a valid email address.'
        ]);
        exit();
    }

    $stmt = mysqli_prepare($conn,
        "INSERT INTO enquiries (name, email, subject, message)
         VALUES (?, ?, ?, ?)");
    mysqli_stmt_bind_param($stmt, 'ssss', $name, $email, $subject, $message);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode([
            'success' => true,
            'message' => 'Your enquiry has been submitted! We will get back to you within 24 hours.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to submit enquiry. Please try again.'
        ]);
    }

    mysqli_stmt_close($stmt);

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}

mysqli_close($conn);
?>
