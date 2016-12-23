<?php

session_start();
// If not Login exit
if (!isset($_SESSION['userId'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'You are not logged in.'
    ]);
    exit();
}

require_once 'database.php';

// Find the movies of the specific user id
$stmt = $db->prepare(
    'SELECT id, title, overview, release_date, image FROM watchlist WHERE user_id = ? ORDER BY `release_date` DESC'
);

if ($stmt->execute([$_SESSION['userId']])) {
    $query = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($query !== false) {
        echo json_encode([
            "status" => "success",
            "data"   => $query,
        ]);
    } else {
        // No measures found for user.
        echo json_encode([
            "status"  => "error",
            "message" => "Fail to retrieve results from DB. Try again later.",
        ]);
    }
} else {
    // DB interaction was not successful. Inform user with message.
    echo json_encode([
        "status"  => "error",
        "message" => "Problem executing statement in DB. Try again later.",
    ]);
}
