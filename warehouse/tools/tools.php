<?php
header("Content-Type: application/json");

// Get raw input
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

// Check if JSON decoding was successful
if ($data === null) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid JSON input"
    ]);
    exit;
}

// Define file path
$file = 'tools.json';

// Attempt to save data
if (is_writable($file)) {
    if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT))) {
        echo json_encode([
            "status" => "success",
            "message" => "Data saved successfully"
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to write to file"
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "File is not writable"
    ]);
}
?>
