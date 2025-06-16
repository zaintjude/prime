<?php
$data = file_get_contents("php://input");
if (!empty($data)) {
    file_put_contents("warehouse.json", $data);
    echo "Data saved successfully.";
} else {
    echo "No data received.";
}
?>
