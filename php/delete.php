<?php

session_start();
// If not Logged In exit
if (!isset($_SESSION['userId'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'You are not logged in.'
    ]);
    exit();
}

require_once 'database.php';

// Define variables and set to empty values
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, "id", FILTER_SANITIZE_NUMBER_INT);
}
// filter elements for SQL injection
$id = $db->quote($id);

// Delete measurements from the table
$stmt = $db->prepare(
    "DELETE FROM `watchlist` WHERE id = $id"
);

if ($stmt->execute()) {
    echo json_encode([
        "status"  => "success",
        "message" => "Movie was deleted successfully.",
    ]);
} else {
    // DB interaction was not successful. Inform user with message.
    echo json_encode([
        "status"  => "error",
        "message" => "Problem executing statement in DB. Try again later."
    ]);
}