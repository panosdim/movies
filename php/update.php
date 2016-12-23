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

// Find the movies of the specific user id with undefined release date
$stmt = $db->prepare(
    'SELECT id, title FROM watchlist WHERE user_id = ? AND release_date = ?'
);

if ($stmt->execute([$_SESSION['userId'], '0000-00-00'])) {
    $query = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($query !== false) {
        foreach ($query as $item) {
            /** @var $rel_date DateTime */
            $rel_date = null;
            $release_date = "0000-00-00";

            // Create a stream
            $postdata = http_build_query([
                'searchStr' => $item['title']
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
            //$results = file_get_contents("http://www.dvdsreleasedates.com/search.php");

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

                // Update movie in the table
                $stmt = $db->prepare(
                    'UPDATE `watchlist` SET release_date=? WHERE id=?'
                );
                $stmt->execute([$release_date, $item['id']]);
            }
        }

        // Successful update of release dates
        echo json_encode([
            "status"  => "success",
            "message" => "Release date of movies updated successfully.",
        ]);
    } else {
        // Error fetch results.
        echo json_encode([
            "status"  => "error",
            "message" => "Fail to retrieve results from DB. Try again later.",
        ]);
    }
} else {
    // DB interaction was not successful. Inform user with message.
    echo json_encode([
        "status"  => "error",
        "message" => "Problem executing statement in DB. Try again later.",
    ]);
}