<?php
$data = file_get_contents("php://input");
$decodedData = json_decode($data, true);

if ($decodedData) {
    foreach ($decodedData['pending'] as &$entry) {
        if (!isset($entry['numDays'])) {
            $entry['numDays'] = "0"; // Ensure numDays is always set
        }
        if (!isset($entry['managerCode'])) {
            $entry['managerCode'] = "N/A"; // Ensure managerCode is not missing
        }
        if (!isset($entry['actionTaken'])) {
            $entry['actionTaken'] = "Choose"; // Ensure actionTaken is not missing
        }
    }

    foreach ($decodedData['approved'] as &$entry) {
        if (!isset($entry['numDays'])) {
            $entry['numDays'] = "0";
        }
        if (!isset($entry['managerCode'])) {
            $entry['managerCode'] = "N/A";
        }
        if (!isset($entry['actionTaken'])) {
            $entry['actionTaken'] = "Choose";
        }
    }

    file_put_contents("absences.json", json_encode($decodedData, JSON_PRETTY_PRINT));
    echo json_encode(["message" => "Data saved successfully!"]);
} else {
    echo json_encode(["error" => "Invalid JSON"]);
}
?>
