<?php
require_once 'tmdb.php';

// Get new releases
$releases = json_decode(file_get_contents("https://api.themoviedb.org/3/movie/popular?api_key={$key}&language=en-US&page=1", False, $context), true);

echo(json_encode($releases));