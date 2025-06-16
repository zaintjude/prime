<?php
$file = 'resignedemp.json';
$data = file_get_contents('php://input');

if ($data) {
    file_put_contents($file, $data);
    echo json_encode(["status" => "success", "message" => "Data saved successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "No data received"]);
}
?>
