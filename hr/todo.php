<?php
// Path to the JSON file
$filename = 'todo.json';

// Get the raw POST data
$postData = file_get_contents('php://input');
$request = json_decode($postData, true);

// Check action type (add, load, update, delete)
if (isset($request['action'])) {
    switch ($request['action']) {
        case 'add':
            addTask($request['task'], $filename);
            break;
        case 'load':
            loadTasks($filename);
            break;
        case 'update':
            updateTask($request['task'], $filename);
            break;
        case 'delete':
            deleteTask($request['task'], $filename);
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

// Function to add a task
function addTask($task, $filename) {
    $tasks = loadJson($filename);
    array_push($tasks, $task);
    saveJson($filename, $tasks);
    echo json_encode($tasks);
}

// Function to load all tasks
function loadTasks($filename) {
    $tasks = loadJson($filename);
    echo json_encode($tasks);
}

// Function to update a task
function updateTask($updatedTask, $filename) {
    $tasks = loadJson($filename);
    foreach ($tasks as &$task) {
        if ($task['text'] === $updatedTask['text'] && $task['time'] === $updatedTask['time']) {
            $task['completed'] = $updatedTask['completed'];
        }
    }
    saveJson($filename, $tasks);
    echo json_encode($tasks);
}

// Function to delete a task
function deleteTask($taskToDelete, $filename) {
    $tasks = loadJson($filename);
    $tasks = array_filter($tasks, function ($task) use ($taskToDelete) {
        return !($task['text'] === $taskToDelete['text'] && $task['time'] === $taskToDelete['time']);
    });
    saveJson($filename, array_values($tasks));
    echo json_encode($tasks);
}

// Utility function to load JSON data from file
function loadJson($filename) {
    if (!file_exists($filename)) {
        return [];
    }
    $json = file_get_contents($filename);
    return json_decode($json, true);
}

// Utility function to save JSON data to file
function saveJson($filename, $data) {
    file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
}
?>
