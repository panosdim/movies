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

// TMDb API Key
$key = "d5f917fce7ee744bf0f384a26ef2d64f";

// Get configuration
$conf = json_decode(file_get_contents("https://api.themoviedb.org/3/configuration?api_key={$key}", False, $context), true);
//$conf = json_decode(file_get_contents("https://api.themoviedb.org/3/configuration?api_key=d5f917fce7ee744bf0f384a26ef2d64f"), true);

// Get new releases
$releases = json_decode(file_get_contents("https://api.themoviedb.org/3/movie/popular?api_key={$key}&language=en-US&page=1", False, $context), true);
//$releases = json_decode(file_get_contents("https://api.themoviedb.org/3/movie/popular?api_key={$key}&language=en-US&page=1"), true);

echo(json_encode([
    "conf"     => $conf,
    "releases" => $releases
]));