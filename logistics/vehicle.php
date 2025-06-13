<?php
$data = json_decode(file_get_contents('php://input'), true);
if ($data) {
    file_put_contents('vehicle.json', json_encode($data, JSON_PRETTY_PRINT));
    echo "Data saved successfully.";
} else {
    echo "No data received.";
}
?>
