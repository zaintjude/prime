<?php
// Allow CORS (optional if frontend is same origin)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

// Get raw JSON data
$data = file_get_contents("php://input");

if ($data) {
    $json = json_decode($data, true);

    if (json_last_error() === JSON_ERROR_NONE) {
        // Save to log.json
        file_put_contents("log.json", json_encode($json, JSON_PRETTY_PRINT));
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid JSON"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No data received"]);
}
?>
