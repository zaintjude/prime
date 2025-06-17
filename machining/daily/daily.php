<?php
$data = file_get_contents("php://input");
$decodedData = json_decode($data, true);

// Check if JSON decoding failed
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["status" => "failure", "message" => json_last_error_msg()]);
    exit;
}

// Read existing daily.json data
$existingData = file_get_contents("daily.json");
$existingDataArray = json_decode($existingData, true);

// Loop through each incoming week data
foreach ($decodedData as $incomingWeek) {
    $found = false;

    foreach ($existingDataArray as &$existingWeek) {
        if (
            $existingWeek['weekRange'] === $incomingWeek['weekRange'] &&
            (string)$existingWeek['year'] === (string)$incomingWeek['year']
        ) {
            // Update projectName and rows
            $existingWeek['projectName'] = $incomingWeek['projectName'];
            $existingWeek['rows'] = $incomingWeek['rows'];
            $found = true;
            break;
        }
    }

    if (!$found) {
        $existingDataArray[] = $incomingWeek;
    }
}

// Save the updated data
if (file_put_contents("daily.json", json_encode($existingDataArray, JSON_PRETTY_PRINT)) === false) {
    echo json_encode(["status" => "failure", "message" => "Failed to write to file"]);
} else {
    echo json_encode(["status" => "success"]);
}
?>
