<?php
$filename = "payroll.json";

// Get existing data
if (file_exists($filename)) {
    $jsonData = file_get_contents($filename);
    $payrollData = json_decode($jsonData, true);
    if (!is_array($payrollData)) {
        $payrollData = [];
    }
} else {
    $payrollData = [];
}

// Get new data from the request
$inputData = json_decode(file_get_contents("php://input"), true);

// If $inputData is an array of payroll records, overwrite the file
if (isset($inputData[0]["fullName"])) {
    file_put_contents($filename, json_encode($inputData, JSON_PRETTY_PRINT));
    echo json_encode(["message" => "Payroll data updated successfully!"]);
    exit;
}

// If adding a single new record, append it to the array
$payrollData[] = $inputData;

// Save updated data back to file
file_put_contents($filename, json_encode($payrollData, JSON_PRETTY_PRINT));

echo json_encode(["message" => "Payroll entry added successfully!"]);
?>
