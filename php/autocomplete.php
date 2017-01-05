<?php
require_once 'tmdb.php';

// Define variables and set to empty values
$query = json_decode(file_get_contents('php://input'));
$term = urlencode($query);

// Get results
$results = json_decode(file_get_contents("https://api.themoviedb.org/3/search/movie?api_key={$key}&language=en-US&query={$term}&page=1&include_adult=false", False, $context), true);

$movies = [];
foreach ($results["results"] as $movie) {
    if ($movie['poster_path'] != null) {
        $movies[] = [$movie["original_title"], $movie["release_date"], $baseUrl . 'w45_and_h67_bestv2' . $movie['poster_path']];
    } else {
        $movies[] = [$movie["original_title"], $movie["release_date"], $movie['poster_path']];
    }
}

echo json_encode($movies);