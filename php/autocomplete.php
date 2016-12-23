<?php
// Create a stream
// TODO: Remove in production server
$opts = [
    'http' => [
        'proxy'           => 'tcp://10.124.32.12:80',
        'request_fulluri' => true
    ]
];
$context = stream_context_create($opts);

// Define variables and set to empty values
$query = json_decode(file_get_contents('php://input'));
$term = urlencode($query);

// Get live search results
$results = file_get_contents("http://www.dvdsreleasedates.com/livesearch.php?q={$term}", False, $context);
//$results = file_get_contents("http://www.dvdsreleasedates.com/livesearch.php?q={$term}");

$dom = new DOMDocument();
libxml_use_internal_errors(true);
$dom->loadHTML($results);
$movies = [];
$suggestions = $dom->getElementsByTagName('a');
foreach ($suggestions as $movie) {
    $movies[] = $movie->nodeValue;
}

echo json_encode($movies);