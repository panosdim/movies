<?php

session_start();
// If not Login exit
if (!isset($_SESSION['userId'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'You are not logged in.'
    ]);
    exit();
}
session_write_close();

require_once 'database.php';
require_once 'tmdb.php';

// Find the movies of the specific user id with undefined release date
$stmt = $db->prepare(
    'SELECT id, movie_id FROM watchlist WHERE user_id = ? AND release_date = ?'
);

if ($stmt->execute([$_SESSION['userId'], '0000-00-00'])) {
    $query = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($query !== false) {
        $nrMovies = count($query);
        $i = $progress = 0;

        foreach ($query as $movie) {
            /** @var $rel_date DateTime */
            $rel_date = null;
            $release_date = "0000-00-00";

            // Calculate progress
            $i++;
            $progress = round(($i * 100) / $nrMovies);
            session_start();
            $_SESSION["progress"] = $progress;
            session_write_close();

            // Get Release Dates
            $data = json_decode(file_get_contents("https://api.themoviedb.org/3/movie/${movie['movie_id']}/release_dates?api_key={$key}", False, $context), true);
            foreach ($data['results'] as $item) {
                if ($item['iso_3166_1'] == 'US') {
                    foreach ($item['release_dates'] as $rd) {
                        if ($rd['type'] > 3) {
                            $date = new DateTime($rd['release_date']);
                            if (is_null($rel_date)) {
                                $rel_date = clone $date;
                            } else {
                                if ($rel_date > $date) {
                                    $rel_date = clone $date;
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
                $stmt->execute([$release_date, $movie['id']]);
            }
        }

        // Successful update of release dates
        echo json_encode([
            "status" => "success",
            "message" => "Release date of movies updated successfully.",
        ]);
    } else {
        // Error fetch results.
        echo json_encode([
            "status" => "error",
            "message" => "Fail to retrieve results from DB. Try again later.",
        ]);
    }
} else {
    // DB interaction was not successful. Inform user with message.
    echo json_encode([
        "status" => "error",
        "message" => "Problem executing statement in DB. Try again later.",
    ]);
}