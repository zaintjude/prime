<?php
// Get the data from the POST request
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $filePath = 'machining.json';
    
    // Check if file exists and is writable
    if (file_exists($filePath) && is_writable($filePath)) {
        // Overwrite the file with the updated data
        if (file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to write to file.']);
        }
    } else {
        // If file does not exist or is not writable
        echo json_encode(['success' => false, 'error' => 'File not found or not writable.']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid data.']);
}
?>
