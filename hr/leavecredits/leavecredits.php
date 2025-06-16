<?php
header("Content-Type: application/json");

$filename = "leavecredits.json";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = file_get_contents("php://input");

    if (!$data) {
        echo json_encode(["status" => "error", "message" => "No data received"]);
        exit;
    }

    $decodedData = json_decode($data, true);
    if ($decodedData === null) {
        echo json_encode(["status" => "error", "message" => "Invalid JSON data"]);
        exit;
    }

    foreach ($decodedData as &$record) {
        if (!isset($record["fname"])) $record["fname"] = "";
        if (!isset($record["lname"])) $record["lname"] = "";
        if (!isset($record["startDate"])) $record["startDate"] = "";
        if (!isset($record["department"])) $record["department"] = "";
        if (!isset($record["janFeb"])) $record["janFeb"] = "";
        if (!isset($record["marApr"])) $record["marApr"] = "";
        if (!isset($record["mayJun"])) $record["mayJun"] = "";
        if (!isset($record["julAug"])) $record["julAug"] = "";
        if (!isset($record["sepOct"])) $record["sepOct"] = "";
        if (!isset($record["remaining"])) $record["remaining"] = 5;
    }

    if (file_put_contents($filename, json_encode($decodedData, JSON_PRETTY_PRINT))) {
        echo json_encode(["status" => "success", "message" => "Leave credits updated"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to save data"]);
    }
} else {
    if (file_exists($filename)) {
        echo file_get_contents($filename);
    } else {
        echo json_encode([]);
    }
}
?>
