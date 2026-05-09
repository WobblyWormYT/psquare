<?php
// ============================================================
//  api/artworks.php
//  GET  ?search=keyword   → search artworks
//  GET  ?id=1             → single artwork by ID
//  GET  (no params)       → all artworks
// ============================================================

require_once '../config.php';

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$id     = isset($_GET['id'])     ? (int)$_GET['id']      : 0;

if ($id > 0) {
    // ── Single artwork by ID ──────────────────────────────
    $stmt = mysqli_prepare($conn,
        "SELECT * FROM artworks WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row    = mysqli_fetch_assoc($result);

    if ($row) {
        echo json_encode(['success' => true, 'artwork' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Artwork not found']);
    }

} elseif ($search !== '') {
    // ── Search artworks ───────────────────────────────────
    $like = '%' . $search . '%';
    $stmt = mysqli_prepare($conn,
        "SELECT * FROM artworks
         WHERE title    LIKE ?
            OR artist   LIKE ?
            OR year     LIKE ?
            OR medium   LIKE ?
            OR origin   LIKE ?
            OR category LIKE ?
         ORDER BY id ASC");
    mysqli_stmt_bind_param($stmt, 'ssssss', $like, $like, $like, $like, $like, $like);
    mysqli_stmt_execute($stmt);
    $result   = mysqli_stmt_get_result($stmt);
    $artworks = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $artworks[] = $row;
    }
    echo json_encode([
        'success'  => true,
        'count'    => count($artworks),
        'artworks' => $artworks
    ]);

} else {
    // ── All artworks ──────────────────────────────────────
    $result   = mysqli_query($conn, "SELECT * FROM artworks ORDER BY id ASC");
    $artworks = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $artworks[] = $row;
    }
    echo json_encode([
        'success'  => true,
        'count'    => count($artworks),
        'artworks' => $artworks
    ]);
}

mysqli_close($conn);
?>
