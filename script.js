let tasks = [];
let currentFilter = 'all';
let currentSort = 'default'; // New: default sort option
let editingTaskId = null;
let selectedPriority = 'medium'; 
let selectedCategory = 'other'; 
let searchQuery = '';

// Motivational quotes
const motivationalQuotes = [
    "You've got this! 💪",
    "Every task completed is a step towards greatness! 🌟",
    "Progress, not perfection! 🚀",
    "You're unstoppable today! ⚡",
    "Small steps lead to big achievements! 🎯",
    "Believe in your amazing abilities! ✨",
    "You're doing incredible work! 🔥",
    "Keep pushing forward, champion! 🏆"
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateStats();
    renderTasks();
    
    // Set default date to today
    document.getElementById('taskDate').valueAsDate = new Date();

    // Event listener for adding task with Enter key
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Event listeners for priority buttons
    document.querySelectorAll('.priority-btn').forEach(button => {
        button.addEventListener('click', function() {
            selectPriority(this.dataset.priority);
        });
    });

    // Event listener for category select
    document.getElementById('taskCategory').addEventListener('change', function() {
        selectedCategory = this.value;
    });

    // Event listeners for filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            filterTasks(this.dataset.filter);
        });
    });

    // Auto-save functionality
    setInterval(saveTasks, 60000); // Save every 60 seconds
});

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('light-mode'); // Toggles light-mode class
    const toggleIcon = document.querySelector('.theme-toggle-btn .icon');
    if (document.body.classList.contains('light-mode')) {
        toggleIcon.textContent = '🌙'; // Moon icon for light mode
    } else {
        toggleIcon.textContent = '☀️'; // Sun icon for dark mode
    }
}

// Select task priority
function selectPriority(priority) {
    selectedPriority = priority;
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`.priority-btn[data-priority="${priority}"]`).classList.add('selected');
}

// Add a new task or update an existing one
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const taskTime = document.getElementById('taskTime');
    const taskNotes = document.getElementById('taskNotes');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        shakeElement(taskInput);
        return;
    }

    const task = {
        id: editingTaskId || Date.now(), // Use existing ID if editing, otherwise new
        text: taskText,
        completed: false,
        priority: selectedPriority,
        category: selectedCategory,
        date: taskDate.value || '', // Allow empty date for no specific due date
        time: taskTime.value || '',
        notes: taskNotes.value.trim(),
        createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : new Date().toLocaleString()
    };

    if (editingTaskId) {
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            // Keep original completed status, only update other fields
            tasks[taskIndex] = { ...tasks[taskIndex], ...task, completed: tasks[taskIndex].completed };
        }
        editingTaskId = null;
        addTaskBtn.textContent = 'Add Task';
    } else {
        tasks.unshift(task); // Add to the beginning for new tasks
        showCelebration('✨');
    }

    // Reset inputs
    taskInput.value = '';
    taskNotes.value = '';
    taskDate.valueAsDate = new Date(); // Reset date to today
    taskTime.value = '';
    selectPriority('medium'); // Reset priority selection
    document.getElementById('taskCategory').value = 'other'; // Reset category
    
    saveTasks();
    updateStats();
    renderTasks();
    taskInput.focus();
}

// Delete a task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        updateStats();
        renderTasks();
        showCelebration('🗑️');
    }
}

// Duplicate a task
function duplicateTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        const duplicatedTask = {
            ...task,
            id: Date.now(),
            text: task.text + ' (Copy)',
            completed: false, // Duplicates should start as pending
            createdAt: new Date().toLocaleString()
        };
        tasks.unshift(duplicatedTask); // Add duplicated task to the beginning
        saveTasks();
        updateStats();
        renderTasks();
        showCelebration('📋');
    }
}

// Toggle task completion status
function toggleComplete(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        updateStats();
        renderTasks(); // Re-render to apply completed styling
        if (task.completed) {
            showCelebration('🎉');
        } else {
            showCelebration('↩️');
        }
    }
}

// Edit an existing task
function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        document.getElementById('taskInput').value = task.text;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskTime').value = task.time;
        document.getElementById('taskNotes').value = task.notes || '';

        // Update priority and category selections
        selectPriority(task.priority);
        document.getElementById('taskCategory').value = task.category;
        selectedCategory = task.category; // Ensure JS variable is updated

        editingTaskId = id;
        document.getElementById('addTaskBtn').textContent = 'Update Task';
        document.getElementById('taskInput').focus();
    }
}

// Search tasks
function searchTasks() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase();
    renderTasks();
}

// Filter tasks based on selected filter
function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');
    renderTasks();
}

// New: Sort tasks
function sortTasks(sortOption) {
    currentSort = sortOption;
    renderTasks();
}

// Render tasks to the display
function renderTasks() {
    const todoList = document.getElementById('todoList');
    let filteredAndSortedTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchQuery) || 
                              task.notes.toLowerCase().includes(searchQuery) ||
                              task.category.toLowerCase().includes(searchQuery);
        if (!matchesSearch) return false;

        const today = new Date().toISOString().split('T')[0];
        const taskDueDate = task.date; // e.g., "2025-12-31"

        switch (currentFilter) {
            case 'completed': return task.completed;
            case 'pending': return !task.completed;
            case 'today': return !task.completed && taskDueDate === today; // Only pending for today
            case 'upcoming': return !task.completed && taskDueDate && taskDueDate > today;
            case 'overdue': return !task.completed && taskDueDate && taskDueDate < today;
            default: return true; // 'all' filter
        }
    });

    // Apply sorting
    filteredAndSortedTasks.sort((a, b) => {
        if (currentSort === 'priority') {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (currentSort === 'dueDate') {
            const dateA = a.date ? new Date(a.date).getTime() : Infinity;
            const dateB = b.date ? new Date(b.date).getTime() : Infinity;
            if (dateA === Infinity && dateB === Infinity) return 0;
            if (dateA === Infinity) return 1; // Undated tasks go last
            if (dateB === Infinity) return -1;
            return dateA - dateB; // Ascending by date
        } else if (currentSort === 'createdDate') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Ascending by creation date
        }
        return b.id - a.id; // Default: latest first (by ID)
    });

    if (filteredAndSortedTasks.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <div class="emoji">${getEmptyStateEmoji()}</div>
                <h3>${getEmptyStateTitle()}</h3>
                <p>${getEmptyStateMessage()}</p>
            </div>
        `;
        return;
    }

    todoList.innerHTML = filteredAndSortedTasks.map(task => `
        <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.text)}</div>
                <div class="task-priority-badge ${task.priority}">
                    ${getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}
                </div>
            </div>
            <div class="task-meta">
                <span><i class="fas fa-tag"></i> ${getCategoryIcon(task.category)} ${task.category}</span>
                <span><i class="fas fa-calendar-alt"></i> ${formatDate(task.date)}</span>
                ${task.time ? `<span><i class="fas fa-clock"></i> ${task.time}</span>` : ''}
                <span><i class="fas fa-history"></i> Created: ${task.createdAt.split(',')[0]}</span>
            </div>
            ${task.notes ? `
                <div class="task-notes" onclick="toggleNotesExpansion(this)">
                    ${escapeHtml(task.notes)}
                    <button class="toggle-notes-btn">Read More <i class="fas fa-chevron-down"></i></button>
                </div>
            ` : ''}
            <div class="task-actions">
                <button class="task-action-btn complete" onclick="toggleComplete(${task.id})">
                    ${task.completed ? '↩️ Undo' : '✅ Done'}
                </button>
                <button class="task-action-btn edit" onclick="editTask(${task.id})">
                    ✏️ Edit
                </button>
                <button class="task-action-btn duplicate" onclick="duplicateTask(${task.id})">
                    📋 Duplicate
                </button>
                <button class="task-action-btn delete" onclick="deleteTask(${task.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

// New: Toggle notes expansion
function toggleNotesExpansion(element) {
    element.classList.toggle('expanded');
    const button = element.querySelector('.toggle-notes-btn');
    if (button) {
        if (element.classList.contains('expanded')) {
            button.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
        } else {
            button.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
        }
    }
}


// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const today = new Date().toISOString().split('T')[0];
    const pendingToday = tasks.filter(task => task.date === today && !task.completed).length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('todayTasks').textContent = pendingToday; // Show pending tasks for today
    
    // Productivity score calculation: higher weight for completed tasks
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('productivityScore').textContent = productivity + '%';
}


// Save tasks to local storage
function saveTasks() {
    localStorage.setItem('taskFlowProTasks', JSON.stringify(tasks));
}

// Load tasks from local storage
function loadTasks() {
    const storedTasks = localStorage.getItem('taskFlowProTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Export tasks
function exportTasks(format) {
    let filename = `TaskFlow_Pro_Tasks.${format}`;
    let data = '';

    if (format === 'txt') {
        data = tasks.map(task => 
            `Task: ${task.text}\nStatus: ${task.completed ? 'Completed' : 'Pending'}\nPriority: ${task.priority}\nCategory: ${task.category}\nDate: ${task.date}\nTime: ${task.time}\nNotes: ${task.notes}\nCreated: ${task.createdAt}\n--------------------`
        ).join('\n\n');
    } else if (format === 'json') {
        data = JSON.stringify(tasks, null, 2);
    }

    const blob = new Blob([data], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showCelebration('💾');
}

// Clear all tasks
function clearAllTasks() {
    if (confirm('Are you sure you want to clear ALL tasks? This cannot be undone!')) {
        tasks = [];
        saveTasks();
        updateStats();
        renderTasks();
        showCelebration('🧹');
    }
}

// New: Clear only completed tasks
function clearCompletedTasks() {
    if (confirm('Are you sure you want to clear all COMPLETED tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        updateStats();
        renderTasks();
        showCelebration('✅🧹');
    }
}

// Generate motivational quote
function generateMotivation() {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    showCelebration(motivationalQuotes[randomIndex]);
}

// Helper function to escape HTML for display
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'No Due Date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Helper function for priority icons
function getPriorityIcon(priority) {
    switch(priority) {
        case 'high': return '🔥';
        case 'medium': return '⚡';
        case 'low': return '🌱';
        default: return '';
    }
}

// Helper function for category icons
function getCategoryIcon(category) {
    switch(category) {
        case 'personal': return '<i class="fas fa-user"></i>';
        case 'work': return '<i class="fas fa-briefcase"></i>';
        case 'health': return '<i class="fas fa-heartbeat"></i>';
        case 'learning': return '<i class="fas fa-book"></i>';
        case 'fun': return '<i class="fas fa-smile-beam"></i>';
        case 'other': return '<i class="fas fa-folder"></i>';
        default: return '<i class="fas fa-file-alt"></i>';
    }
}

// Empty state messages
function getEmptyStateEmoji() {
    const emojis = {
        all: '😴',
        pending: '🥳', 
        completed: '💡', 
        today: '⏳',
        upcoming: '🗓️',
        overdue: '🚨'
    };
    return emojis[currentFilter] || '😴';
}

function getEmptyStateTitle() {
    const titles = {
        all: 'Nothing to do!',
        pending: 'All tasks are completed! Great job! 🎉',
        completed: 'No completed tasks yet!',
        today: 'No tasks scheduled for today!',
        upcoming: 'No upcoming tasks!',
        overdue: 'No overdue tasks! (Phew!)'
    };
    return titles[currentFilter] || 'Nothing to do!';
}

function getEmptyStateMessage() {
    const messages = {
        all: 'Start by adding your first task to conquer the day.',
        pending: 'You\'ve finished everything! Time to relax or add new challenges!',
        completed: 'Once you complete tasks, they\'ll appear here as a record of your achievements.',
        today: 'Plan your day by adding tasks with today\'s date.',
        upcoming: 'Add tasks with future due dates to see them here.',
        overdue: 'Keep up the great work! Your overdue list is clear.'
    };
    return messages[currentFilter] || 'Start by adding your first task to conquer the day.';
}

// Celebration animation
function showCelebration(content) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerHTML = content; // Use innerHTML for emojis/quotes
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        if (document.body.contains(celebration)) {
            document.body.removeChild(celebration);
        }
    }, 1200); 
}

// Shake element animation for input validation
function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500); 
}