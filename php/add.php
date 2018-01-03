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
require_once 'tmdb.php';

// Define variables and set to empty values
/** @var $rel_date DateTime */
$title = $overview = $image = $rel_date = $movie_url = $year = null;
$release_date = "0000-00-00";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, "id", FILTER_SANITIZE_NUMBER_INT);
    $title = filter_input(INPUT_POST, "title", FILTER_SANITIZE_STRING);
    $overview = filter_input(INPUT_POST, "overview", FILTER_SANITIZE_STRING);
    $image = filter_input(INPUT_POST, "image", FILTER_SANITIZE_STRING);
}

if ($image == 'null') {
    $image = null;
}

// Get Release Dates
$data = json_decode(file_get_contents("https://api.themoviedb.org/3/movie/${id}/release_dates?api_key={$key}", False, $context), true);
foreach ($data['results'] as $item) {
    if ($item['iso_3166_1'] == 'US') {
        foreach ($item['release_dates'] as $rd) {
            if ($rd['type'] > 3) {
                $date = new DateTime($rd['release_date']);
                if (is_null($rel_date)) {
                    $rel_date = clone $date;
                } else {
                    if ($rel_date > $date) {
                        $rel_date = clone $date;
                    }
                }
            }
        }
    }
}

if (!is_null($rel_date)) {
    $release_date = $rel_date->format('Y-m-d');
}

// Insert movie in the table
$stmt = $db->prepare(
    'INSERT INTO `watchlist` (`user_id`, `title`, `overview`, `release_date`, `image`, `movie_id`) VALUES (?, ?, ?, ?, ?, ?)'
);

if ($stmt->execute([$_SESSION['userId'], $title, $overview, $release_date, $image, $id])) {
    echo json_encode([
        "status"  => "success",
        "message" => "Movie was added successfully.",
    ]);
} else {
    // DB interaction was not successful. Inform user with message.
    echo json_encode([
        "status"  => "error",
        "message" => "Problem executing statement in DB. Try again later."
    ]);
}