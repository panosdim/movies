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

// Define variables and set to empty values
/** @var $rel_date DateTime */
$title = $overview = $image = $rel_date = null;
$release_date = "0000-00-00";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $title = filter_input(INPUT_POST, "title", FILTER_SANITIZE_STRING);
    $overview = filter_input(INPUT_POST, "overview", FILTER_SANITIZE_STRING);
    $image = filter_input(INPUT_POST, "image", FILTER_SANITIZE_STRING);
}

// Create a stream
$postdata = http_build_query([
    'searchStr' => $title
]);
// TODO: Remove PROXY in production server
$opts = [
    'http' => [
        'method'          => 'POST',
        'header'          => 'Content-type: application/x-www-form-urlencoded',
        'content'         => $postdata,
        'proxy'           => 'tcp://10.124.32.12:80',
        'request_fulluri' => true
    ]
];
$context = stream_context_create($opts);

// Get search results
$results = file_get_contents("http://www.dvdsreleasedates.com/search.php", False, $context);

$dom = new DOMDocument();
libxml_use_internal_errors(true);
$dom->loadHTML($results);
$xpath = new DOMXpath($dom);

// Get release date
$elements = $xpath->query("//h2/span");
if ($elements->length != 0) {
    foreach ($elements as $date) {
        if (!preg_match("/(estimated|announced)/", $date->nodeValue)) {
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
} else {
    // Get URL to movie
    $elements = $xpath->query("//td[@class='dvdcell']/a[1]");
    if ($elements->length != 0) {
        $movie_url = "http://www.dvdsreleasedates.com" . $elements->item(0)->getAttribute('href');

        // Fetch movie data
        $results = file_get_contents($movie_url, False, $context);
        //$results = file_get_contents($movie_url);

        $dom->loadHTML($results);
        $xpath = new DOMXpath($dom);
    }

    // Get release date
    $elements = $xpath->query("//h2/span");
    if ($elements->length != 0) {
        foreach ($elements as $date) {
            if (!preg_match("/(estimated|announced)/", $date->nodeValue)) {
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
}

if (!is_null($rel_date)) {
    $release_date = $rel_date->format('Y-m-d');
}

// Insert movie in the table
$stmt = $db->prepare(
    'INSERT INTO `watchlist` (`user_id`, `title`, `overview`, `release_date`, `image`) VALUES (?, ?, ?, ?, ?)'
);

if ($stmt->execute([$_SESSION['userId'], $title, $overview, $release_date, $image])) {
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