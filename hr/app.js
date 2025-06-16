// Request notification permission after user interaction and unlock audio
document.getElementById('add-button').addEventListener('click', () => {
    // Unlock alarm sound on first user interaction
    const alarmSound = document.getElementById('alarm-sound');
    if (alarmSound) {
        alarmSound.play().then(() => {
            alarmSound.pause();
            alarmSound.currentTime = 0;
        }).catch(err => console.warn("Audio autoplay unlock failed:", err));
    }

    // Request Notification permission
    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
            }
        });
    }

    addTask();
});

window.onload = loadTasks;

function addTask() {
    const taskText = document.getElementById('new-task').value.trim();
    const taskTimeInput = document.getElementById('task-time').value;

    if (taskText === '' || taskTimeInput === '') {
        alert('Please enter a task and time.');
        return;
    }

    const taskTime = new Date(taskTimeInput);
    if (isNaN(taskTime)) {
        alert('Invalid date/time format.');
        return;
    }

    const task = {
        text: taskText,
        time: taskTime.toISOString(),
        completed: false
    };

    addTaskToDOM(task);
    saveTask(task);

    document.getElementById('new-task').value = '';
    document.getElementById('task-time').value = '';
}

function addTaskToDOM(task) {
    const li = document.createElement('li');
    const readableTime = new Date(task.time).toLocaleString();
    li.textContent = `${task.text} (Due: ${readableTime})`;

    const completeButton = document.createElement('input');
    completeButton.type = 'radio';
    completeButton.addEventListener('click', () => {
        task.completed = true;
        updateTask(task);
        moveTaskToCompleted(li, task);
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        li.remove();
        deleteTask(task);
    });

    li.appendChild(completeButton);
    li.appendChild(deleteButton);

    if (task.completed) {
        li.style.textDecoration = 'line-through';
        document.getElementById('completed-tasks').appendChild(li);
    } else {
        document.getElementById('incomplete-tasks').appendChild(li);
    }

    const scheduledTime = new Date(task.time);
    if (!isNaN(scheduledTime)) {
        scheduleNotification(task.text, scheduledTime);
    }
}

function moveTaskToCompleted(li, task) {
    li.style.textDecoration = 'line-through';
    document.getElementById('completed-tasks').appendChild(li);
}

function scheduleNotification(taskText, taskTime) {
    const now = Date.now();
    const alarmTime = taskTime.getTime();
    const timeToAlarm = alarmTime - now;

    if (timeToAlarm > 0) {
        setTimeout(() => {
            showSystemNotification(taskText);
        }, timeToAlarm);
    }
}

function showSystemNotification(taskText) {
    if (Notification.permission === "granted") {
        const notification = new Notification("Task Reminder", {
            body: `Time to complete: ${taskText}`,
            icon: "https://dashproduction.x10.mx/masterfile/prime/FABRICATION/prime.png"
        });

        notification.onclick = () => window.focus();
        playAlarmUntilStopped(taskText);
    } else {
        playAlarmUntilStopped(taskText);
    }
}

function playAlarmUntilStopped(taskText) {
    const alarmSound = document.getElementById('alarm-sound');
    if (alarmSound) {
        alarmSound.loop = true;
        alarmSound.play().catch(error => {
            console.error('Error playing alarm sound:', error);
        });

        alert(`⏰ Time to complete your task: ${taskText}`);

        // Stop alarm after alert
        alarmSound.pause();
        alarmSound.currentTime = 0;
        alarmSound.loop = false;
    } else {
        console.error("Alarm sound element not found.");
    }
}

// ---- SERVER OPERATIONS ----

function saveTask(task) {
    fetch('todo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', task })
    })
    .then(res => res.json())
    .then(data => console.log('Task saved:', data))
    .catch(err => console.error('Error saving task:', err));
}

function loadTasks() {
    fetch('todo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load' })
    })
    .then(res => res.json())
    .then(tasks => {
        tasks.forEach(task => addTaskToDOM(task));
    })
    .catch(err => console.error('Error loading tasks:', err));
}

function updateTask(task) {
    fetch('todo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', task })
    })
    .then(res => res.json())
    .then(data => console.log('Task updated:', data))
    .catch(err => console.error('Error updating task:', err));
}

function deleteTask(task) {
    fetch('todo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', task })
    })
    .then(res => res.json())
    .then(data => console.log('Task deleted:', data))
    .catch(err => console.error('Error deleting task:', err));
}
