<?php
$inventoryFile = 'inventory.json';

if (file_exists($inventoryFile)) {
    $jsonData = file_get_contents($inventoryFile);
    $inventoryData = json_decode($jsonData, true);
} else {
    $inventoryData = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = json_decode(file_get_contents('php://input'), true);

    if (is_array($inputData)) {
        // Replace entire inventory with the posted array
        // This assumes frontend always sends the full inventory (which our JS does)
        file_put_contents($inventoryFile, json_encode($inputData, JSON_PRETTY_PRINT));

        echo json_encode(['status' => 'success', 'message' => 'Data saved successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid data format']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
