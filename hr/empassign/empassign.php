<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT");
header("Access-Control-Allow-Headers: Content-Type");

$filename = "empassign.json";
$historyFile = "empassign2.json";  // File for assignment history

// Handle GET request - Read current assignments
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($filename)) {
        echo file_get_contents($filename);
    } else {
        echo json_encode([]);
    }
    exit;
}

// Handle PUT request - Update current assignments and save history
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = file_get_contents("php://input");
    if (!empty($data)) {
        // Save current assignments
        file_put_contents($filename, $data);

        // Save history
        $history = file_exists($historyFile) ? json_decode(file_get_contents($historyFile), true) : [];
        $newData = json_decode($data, true);

        foreach ($newData as $entry) {
            $entry["timestamp"] = date("Y-m-d H:i:s");  // Add timestamp
            $history[] = $entry;
        }

        file_put_contents($historyFile, json_encode($history, JSON_PRETTY_PRINT));

        echo json_encode(["message" => "Data updated successfully and history recorded"]);
    } else {
        echo json_encode(["error" => "No data received"]);
    }
    exit;
}

echo json_encode(["error" => "Invalid request method"]);
exit;
?>
