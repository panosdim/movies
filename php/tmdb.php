<?php
// Stream options
// TODO: Remove in production server the proxy settings
$opts = [
    'http' => [
        'proxy'           => 'tcp://10.124.32.12:80',
        'request_fulluri' => true
    ]
];

// Create a stream
$context = stream_context_create($opts);

// TMDb API Key
$key = "d5f917fce7ee744bf0f384a26ef2d64f";

// TMDb images base URL
$baseUrl = 'https://image.tmdb.org/t/p/';