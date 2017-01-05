<?php
require_once 'tmdb.php';

// Get search term
$query = json_decode(file_get_contents('php://input'));
$term = urlencode($query);

// Get results
$results = json_decode(file_get_contents("https://api.themoviedb.org/3/search/movie?api_key={$key}&language=en-US&query={$term}&page=1&include_adult=false", False, $context), true);

echo json_encode($results);