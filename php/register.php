<?php

session_start();
require_once 'database.php';

// Define Helper functions
define('ALGO', '$2a');
define('COST', '$10');

function unique_salt()
{
    return substr(sha1(mt_rand()), 0, 22);
}

function create_hash($password)
{
    return crypt($password, ALGO . COST . '$' . unique_salt());
}

// Create a stream
// TODO: Remove in production server
$opts = [
    'http' => [
        'proxy'           => 'tcp://10.124.32.12:80',
        'request_fulluri' => true
    ]
];
$context = stream_context_create($opts);

$secret = '6LeGWg8UAAAAAEUP8XA6UGefxDgzttQ_ic8meQFX';
if (isset($_POST['g-recaptcha-response']))
    $captcha = $_POST['g-recaptcha-response'];

if (!$captcha) {
    echo json_encode([
        "status"  => "error",
        "message" => "Please check the captcha form"
    ]);
    exit;
}
$response = json_decode(file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret={$secret}&response={$captcha}", False, $context), true);
//$response = json_decode(file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret={$secret}&response={$captcha}"), true);

if ($response['success'] == false) {
    echo json_encode([
        "status"  => "error",
        "message" => "Captcha verification failed"
    ]);
} else {
    // Define variables and set to empty values
    $email = $password = $firstName = $lastName = "";

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $email = filter_input(INPUT_POST, "regEmail", FILTER_SANITIZE_EMAIL);
        $password = filter_input(INPUT_POST, "regPassword", FILTER_SANITIZE_STRING);
        $firstName = filter_input(INPUT_POST, "regFirstName", FILTER_SANITIZE_STRING);
        $lastName = filter_input(INPUT_POST, "regLastName", FILTER_SANITIZE_STRING);
    }

    // Check if user already exists
    $stmt = $db->prepare(
        'SELECT email FROM users WHERE email = ?'
    );
    if ($stmt->execute([$email])) {
        $query = $stmt->fetch();

        if ($query == false) {
            // Insert user in the table
            $stmt = $db->prepare(
                'INSERT INTO `users` (`email`, `password`, `first_name`, `last_name`) VALUES (?, ?, ?, ?)'
            );

            if ($stmt->execute([$email, create_hash($password), $firstName, $lastName])) {
                echo json_encode([
                    "status"  => "success",
                    "message" => "Registration was successful. You can now proceed with login."
                ]);
            } else {
                // DB interaction was not successful. Inform user with message.
                echo json_encode([
                    "status"  => "error",
                    "message" => "Problem executing statement in DB. Try again later."
                ]);
            }
        } else {
            // Registration was not successful. Inform user with message.
            echo json_encode([
                "status"  => "error",
                "message" => "Registration was not successful. User with same email already exists."
            ]);
        }
    } else {
        // DB interaction was not successful. Inform user with message.
        echo json_encode([
            "status"  => "error",
            "message" => "Problem executing statement in DB. Try again later."
        ]);
    }
}