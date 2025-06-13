<?php
header('Content-Type: application/json');

$filename = 'logistics.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Receive raw POST data
    $input = file_get_contents('php://input');
    
    // Validate and optionally decode to test for valid JSON
    if (json_decode($input) === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    // Save to file
    file_put_contents($filename, $input);
    echo json_encode(['status' => 'success']);
} else {
    // Return current contents of logistics.json
    if (file_exists($filename)) {
        echo file_get_contents($filename);
    } else {
        echo json_encode([]);
    }
}
?>
