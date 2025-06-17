<?php
// Get the raw POST data
$data = json_decode(file_get_contents("php://input"), true);

$date = trim($data["date"] ?? "");
$name = trim($data["name"] ?? "");

if ($date === "" || $name === "") {
    echo "Invalid input";
    exit;
}

$file = 'doneemployees.json';

if (file_exists($file)) {
    $doneList = json_decode(file_get_contents($file), true);
} else {
    $doneList = [];
}

if (!isset($doneList[$date])) {
    $doneList[$date] = [];
}

if (!in_array($name, $doneList[$date])) {
    $doneList[$date][] = $name;
}

// Save the updated list
file_put_contents($file, json_encode($doneList, JSON_PRETTY_PRINT));

echo "Saved successfully";
?>
