<?php
header("Content-Type: application/json");

$file = "empdir.json"; // JSON file path

// Read JSON file safely
function readJsonFile($file) {
    if (!file_exists($file)) {
        return [];
    }
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

// Write JSON file safely
function writeJsonFile($file, $data) {
    $jsonData = json_encode($data, JSON_PRETTY_PRINT);
    return file_put_contents($file, $jsonData, LOCK_EX) !== false;
}

// Handle POST request (Add new employee)
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = file_get_contents("php://input");
    $newEmployee = json_decode($data, true);

    if (!$newEmployee || !isset($newEmployee["firstName"], $newEmployee["lastName"], $newEmployee["position"])) {
        echo json_encode(["success" => false, "message" => "Invalid data received."]);
        exit;
    }

    $employees = readJsonFile($file);

    // Assign a unique ID if not provided
    $newEmployee["id"] = uniqid("emp_", true);

    $employees[] = $newEmployee; // Add new employee

    if (writeJsonFile($file, $employees)) {
        echo json_encode(["success" => true, "message" => "Employee added!", "id" => $newEmployee["id"]]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to save data."]);
    }
    exit;
}

// Handle GET request (Fetch employees)
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    echo json_encode(readJsonFile($file));
    exit;
}

// Handle PUT request (Update employee record)
if ($_SERVER["REQUEST_METHOD"] === "PUT") {
    $data = file_get_contents("php://input");
    $update = json_decode($data, true);

    if (!isset($update["id"], $update["key"], $update["newValue"])) {
        echo json_encode(["success" => false, "message" => "Invalid update data."]);
        exit;
    }

    $employees = readJsonFile($file);
    $id = $update["id"];
    $key = $update["key"];
    $newValue = $update["newValue"];
    $found = false;

    foreach ($employees as &$employee) {
        if ($employee["id"] === $id) {
            if (array_key_exists($key, $employee)) {
                $employee[$key] = $newValue;
                $found = true;
                break;
            } else {
                echo json_encode(["success" => false, "message" => "Invalid key."]);
                exit;
            }
        }
    }

    if (!$found) {
        echo json_encode(["success" => false, "message" => "Employee not found."]);
        exit;
    }

    if (writeJsonFile($file, $employees)) {
        echo json_encode(["success" => true, "message" => "Employee updated!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update employee."]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request method."]);
?>
