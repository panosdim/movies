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
session_write_close();

require_once 'database.php';
require_once 'tmdb.php';

// Find the movies of the specific user id with undefined release date
$stmt = $db->prepare(
    'SELECT id, url, title FROM watchlist WHERE user_id = ? AND release_date = ?'
);

$dom = new DOMDocument();
libxml_use_internal_errors(true);

if ($stmt->execute([$_SESSION['userId'], '0000-00-00'])) {
    $query = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($query !== false) {
        $nrMovies = count($query);
        $i = $progress = 0;

        foreach ($query as $item) {
            /** @var $rel_date DateTime */
            $rel_date = null;
            $release_date = "0000-00-00";

            // Calculate progress
            $i++;
            $progress = round(($i * 100) / $nrMovies);
            session_start();
            $_SESSION["progress"] = $progress;
            session_write_close();

            // Fetch movie data
            if (!is_null($item['url'])) {
                $results = file_get_contents($item['url']);

                $dom->loadHTML($results);
                $xpath = new DOMXpath($dom);

                // Get release date
                $elements = $xpath->query("//td[.=\"Now Available\"]/preceding-sibling::td/a");
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
                } else {
                    $elements = $xpath->query("//td[.=\"Alert Me\"]/preceding-sibling::td/a");
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