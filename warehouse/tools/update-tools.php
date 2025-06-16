<?php
header('Content-Type: application/json');

// Path to your JSON file
$file = 'tools.json';

// Read the raw POST data (JSON from fetch)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null || !isset($data['tools'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON or missing tools data']);
    exit;
}

// Read the existing full JSON content (tools + history + damaged)
if (file_exists($file)) {
    $fullData = json_decode(file_get_contents($file), true);
    if ($fullData === null) {
        // If JSON is invalid, start fresh structure
        $fullData = [
            'tools' => [],
            'history' => [],
            'damaged' => []
        ];
    }
} else {
    // If file doesn't exist, start fresh structure
    $fullData = [
        'tools' => [],
        'history' => [],
        'damaged' => []
    ];
}

// Replace only the 'tools' key with new tools data
$fullData['tools'] = $data['tools'];

// Save back the full JSON content
if (file_put_contents($file, json_encode($fullData, JSON_PRETTY_PRINT))) {
    echo json_encode(['status' => 'success', 'message' => 'Tools updated successfully']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to write JSON file']);
}
