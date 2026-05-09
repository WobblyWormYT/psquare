<?php
// ============================================================
//  api/tickets.php
//  POST → save a ticket booking to the database
//  GET  → fetch all bookings (admin use)
// ============================================================

session_start();
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Read POST data (sent as JSON from AJAX)
    $data = json_decode(file_get_contents('php://input'), true);

    // Fallback to $_POST if not JSON
    if (!$data) $data = $_POST;

    // Validate required fields
    $required = ['ticket_id', 'visitor_name', 'email', 'visit_date', 'total_amount'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode([
                'success' => false,
                'message' => "Missing required field: $field"
            ]);
            exit();
        }
    }

    // Sanitize inputs
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Cannot book, login or register first'
        ]);
        exit();
    }
    $ticket_id    = mysqli_real_escape_string($conn, $data['ticket_id']);
    $visitor_name = mysqli_real_escape_string($conn, $data['visitor_name']);
    $email        = mysqli_real_escape_string($conn, $data['email']);
    $visit_date   = mysqli_real_escape_string($conn, $data['visit_date']);
    $adult_qty    = (int)($data['adult_qty']   ?? 0);
    $student_qty  = (int)($data['student_qty'] ?? 0);
    $child_qty    = (int)($data['child_qty']   ?? 0);
    $senior_qty   = (int)($data['senior_qty']  ?? 0);
    $total_amount = (int)$data['total_amount'];
    $user_id      = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

    // Insert into DB using prepared statement
    $stmt = mysqli_prepare($conn,
        "INSERT INTO ticket_bookings
            (user_id, ticket_id, visitor_name, email, visit_date,
             adult_qty, student_qty, child_qty, senior_qty, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . mysqli_error($conn)
        ]);
        exit();
    }

    mysqli_stmt_bind_param($stmt, 'issssiiiii',
        $user_id, $ticket_id, $visitor_name, $email, $visit_date,
        $adult_qty, $student_qty, $child_qty, $senior_qty, $total_amount);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode([
            'success'   => true,
            'message'   => 'Booking saved successfully!',
            'ticket_id' => $ticket_id,
            'booking_db_id' => mysqli_insert_id($conn)
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save booking: ' . mysqli_error($conn)
        ]);
    }

    mysqli_stmt_close($stmt);

} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'history') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Not logged in.']);
            exit();
        }
        $user_id = $_SESSION['user_id'];
        $stmt = mysqli_prepare($conn, "SELECT * FROM ticket_bookings WHERE user_id = ? ORDER BY booked_at DESC");
        mysqli_stmt_bind_param($stmt, 'i', $user_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $bookings = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $bookings[] = $row;
        }
        mysqli_stmt_close($stmt);
        echo json_encode([
            'success'  => true,
            'count'    => count($bookings),
            'bookings' => $bookings
        ]);
    } else {
        // ── Fetch all bookings (for admin) ─────────────────────
        $result   = mysqli_query($conn,
            "SELECT * FROM ticket_bookings ORDER BY booked_at DESC");
        $bookings = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $bookings[] = $row;
        }
        echo json_encode([
            'success'  => true,
            'count'    => count($bookings),
            'bookings' => $bookings
        ]);
    }
}

mysqli_close($conn);
?>
