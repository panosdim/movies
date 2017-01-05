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
    $title = filter_input(INPUT_POST, "title", FILTER_SANITIZE_STRING);
    $overview = filter_input(INPUT_POST, "overview", FILTER_SANITIZE_STRING);
    $image = filter_input(INPUT_POST, "image", FILTER_SANITIZE_STRING);
    $year = filter_input(INPUT_POST, "year", FILTER_SANITIZE_STRING);
}

// Check if movie already exists
$stmt = $db->prepare(
    'SELECT title FROM watchlist WHERE title = ?'
);
if ($stmt->execute([$title])) {
    $query = $stmt->fetch();

    if ($query !== false) {
        echo json_encode([
            "status"  => "info",
            "message" => "Movie already exist in watchlist.",
        ]);
        exit();
    }
}

if ($image == 'null') {
    $image = null;
}

$term = urlencode($title);

// Get search results
$results = file_get_contents("http://videoeta.com/search/?s={$term}", False, $context);

$dom = new DOMDocument();
libxml_use_internal_errors(true);
$dom->loadHTML($results);
$xpath = new DOMXpath($dom);

// Find movie URL from search results
$elements = $xpath->query("//h4[contains(text(),'Exact Title Matches: ')]/following-sibling::a[. = {$year}]");
if ($elements->length != 0) {
    $movie_url = "http://videoeta.com" . $elements->item(0)->getAttribute('href');

    // Fetch movie data
    $results = file_get_contents($movie_url, False, $context);

    $dom->loadHTML($results);
    $xpath = new DOMXpath($dom);

    // Get release date
    $elements = $xpath->query("//tr[@class='blu-ray' or @class='dvd']/td[@class='value']/a[1]");
    if ($elements->length != 0) {
        foreach ($elements as $date) {
            if (is_null($rel_date)) {
                $rel_date = new DateTime($date->nodeValue);
            } else {
                $tmp_date = new DateTime($date->nodeValue);
                if ($rel_date->getTimestamp() > $tmp_date->getTimestamp()) {
                    $rel_date = $tmp_date;
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
    'INSERT INTO `watchlist` (`user_id`, `title`, `overview`, `release_date`, `image`, `url`) VALUES (?, ?, ?, ?, ?, ?)'
);

if ($stmt->execute([$_SESSION['userId'], $title, $overview, $release_date, $image, $movie_url])) {
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