/**
 * Gestione del diagramma di Gantt
 * Utilizza la libreria Frappe Gantt
 */

const GanttManager = {
    ganttInstance: null,
    currentTasks: [],
    currentViewMode: 'Week',

    /**
     * Initialize or update Gantt chart
     * @param {Array} tasks - Array of task objects
     * @param {string} viewMode - View mode (Day, Week, Month, Quarter)
     */
    renderGantt: function(tasks, viewMode = 'Week') {
        if (!tasks || tasks.length === 0) {
            this.showEmptyState();
            return;
        }

        this.currentTasks = tasks;
        this.currentViewMode = viewMode;

        // Convert tasks to Frappe Gantt format
        const ganttTasks = this.convertToGanttFormat(tasks);

        // Clear container
        const container = document.getElementById('gantt-container');
        container.innerHTML = '<svg id="gantt-svg"></svg>';

        try {
            // Create Gantt instance
            this.ganttInstance = new Gantt('#gantt-svg', ganttTasks, {
                view_mode: viewMode,
                date_format: 'YYYY-MM-DD',
                language: 'it',
                popup_trigger: 'click',
                custom_popup_html: (task) => this.createCustomPopup(task),
                on_click: (task) => this.onTaskClick(task),
                on_date_change: (task, start, end) => this.onDateChange(task, start, end),
                on_progress_change: (task, progress) => this.onProgressChange(task, progress),
                bar_height: 30,
                bar_corner_radius: 3,
                arrow_curve: 5,
                padding: 18,
                view_modes: ['Day', 'Week', 'Month', 'Quarter'],
                step: 24
            });

            // Update table
            this.updateTaskTable(tasks);
        } catch (error) {
            console.error('Errore nella creazione del Gantt:', error);
            this.showError('Errore nella creazione del diagramma di Gantt: ' + error.message);
        }
    },

    /**
     * Convert tasks to Frappe Gantt format
     * @param {Array} tasks - Tasks array
     * @returns {Array} Gantt-formatted tasks
     */
    convertToGanttFormat: function(tasks) {
        // Create a map of task names to IDs for dependencies
        const nameToId = {};
        tasks.forEach(task => {
            nameToId[task.name.toLowerCase()] = task.id;
        });

        return tasks.map(task => {
            // Parse dependencies
            let dependencies = '';
            if (task.dependencies && task.dependencies.trim()) {
                const depNames = task.dependencies.split(',').map(d => d.trim().toLowerCase());
                const resolvedDeps = depNames
                    .map(name => nameToId[name])
                    .filter(id => id !== undefined);

                if (resolvedDeps.length > 0) {
                    dependencies = resolvedDeps.join(',');
                }
            }

            const ganttTask = {
                id: task.id,
                name: task.name,
                start: task.start,
                end: task.end,
                progress: task.progress || 0,
                custom_class: task.custom_class || ''
            };

            // Only add dependencies if they exist
            if (dependencies) {
                ganttTask.dependencies = dependencies;
            }

            return ganttTask;
        });
    },

    /**
     * Create custom popup HTML
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    createCustomPopup: function(task) {
        const progressClass = task.progress === 100 ? 'status-complete' :
                            task.progress > 0 ? 'status-in-progress' :
                            'status-not-started';

        return `
            <div class="gantt-tooltip">
                <div class="task-name">${task.name}</div>
                <div style="margin-top: 8px;">
                    <strong>Inizio:</strong> ${this.formatDateIT(task._start)}<br>
                    <strong>Fine:</strong> ${this.formatDateIT(task._end)}<br>
                    <strong>Durata:</strong> ${this.calculateDuration(task._start, task._end)} giorni<br>
                    <strong>Progresso:</strong> <span class="${progressClass}">${task.progress}%</span>
                </div>
            </div>
        `;
    },

    /**
     * Handle task click
     * @param {Object} task - Clicked task
     */
    onTaskClick: function(task) {
        console.log('Task clicked:', task);
        this.showTaskInfo(task);
    },

    /**
     * Handle date change
     * @param {Object} task - Task object
     * @param {Date} start - New start date
     * @param {Date} end - New end date
     */
    onDateChange: function(task, start, end) {
        console.log('Date changed:', task.name, start, end);

        // Update task in currentTasks
        const taskIndex = this.currentTasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            this.currentTasks[taskIndex].start = this.formatDate(start);
            this.currentTasks[taskIndex].end = this.formatDate(end);
            this.updateTaskTable(this.currentTasks);
        }

        this.showNotification(`Date aggiornate per "${task.name}"`, 'info');
    },

    /**
     * Handle progress change
     * @param {Object} task - Task object
     * @param {number} progress - New progress value
     */
    onProgressChange: function(task, progress) {
        console.log('Progress changed:', task.name, progress);

        // Update task in currentTasks
        const taskIndex = this.currentTasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            this.currentTasks[taskIndex].progress = progress;
            this.updateTaskTable(this.currentTasks);
        }

        this.showNotification(`Progresso aggiornato per "${task.name}": ${progress}%`, 'success');
    },

    /**
     * Update task table
     * @param {Array} tasks - Tasks array
     */
    updateTaskTable: function(tasks) {
        const tbody = document.querySelector('#taskTable tbody');

        if (!tasks || tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nessun dato disponibile</td></tr>';
            return;
        }

        tbody.innerHTML = tasks.map(task => {
            const duration = CronoParser.calculateDuration(task.start, task.end);
            const progressClass = task.progress === 100 ? 'status-complete' :
                                task.progress > 0 ? 'status-in-progress' :
                                'status-not-started';

            return `
                <tr data-task-id="${task.id}" onclick="GanttManager.highlightTask('${task.id}')">
                    <td><strong>${task.name}</strong></td>
                    <td>${this.formatDateIT(new Date(task.start))}</td>
                    <td>${this.formatDateIT(new Date(task.end))}</td>
                    <td>${duration} giorni</td>
                    <td>
                        <div class="progress-custom">
                            <div class="progress-bar-custom" style="width: ${task.progress}%">
                                ${task.progress}%
                            </div>
                        </div>
                    </td>
                    <td>${task.dependencies || '-'}</td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Show task info in sidebar
     * @param {Object} task - Task object
     */
    showTaskInfo: function(task) {
        const infoCard = document.getElementById('taskInfoCard');
        const infoContent = document.getElementById('taskInfo');

        const progressClass = task.progress === 100 ? 'status-complete' :
                            task.progress > 0 ? 'status-in-progress' :
                            'status-not-started';

        const duration = this.calculateDuration(task._start, task._end);

        infoContent.innerHTML = `
            <h6 class="mb-3">${task.name}</h6>
            <div class="mb-2">
                <small class="text-muted">Data Inizio:</small><br>
                <strong>${this.formatDateIT(task._start)}</strong>
            </div>
            <div class="mb-2">
                <small class="text-muted">Data Fine:</small><br>
                <strong>${this.formatDateIT(task._end)}</strong>
            </div>
            <div class="mb-2">
                <small class="text-muted">Durata:</small><br>
                <strong>${duration} giorni</strong>
            </div>
            <div class="mb-2">
                <small class="text-muted">Progresso:</small><br>
                <div class="progress-custom mt-1">
                    <div class="progress-bar-custom ${progressClass}" style="width: ${task.progress}%">
                        ${task.progress}%
                    </div>
                </div>
            </div>
            ${task.dependencies ? `
                <div class="mb-2">
                    <small class="text-muted">Dipendenze:</small><br>
                    <strong>${task.dependencies}</strong>
                </div>
            ` : ''}
        `;

        infoCard.style.display = 'block';
        infoCard.classList.add('fade-in');
    },

    /**
     * Highlight task in Gantt and table
     * @param {string} taskId - Task ID
     */
    highlightTask: function(taskId) {
        // Remove previous highlights
        document.querySelectorAll('#taskTable tbody tr').forEach(tr => {
            tr.classList.remove('table-primary');
        });

        // Add highlight
        const row = document.querySelector(`#taskTable tbody tr[data-task-id="${taskId}"]`);
        if (row) {
            row.classList.add('table-primary');
        }

        // Find and show task info
        const task = this.currentTasks.find(t => t.id === taskId);
        if (task) {
            // Create a task object compatible with showTaskInfo
            const ganttTask = {
                name: task.name,
                _start: new Date(task.start),
                _end: new Date(task.end),
                progress: task.progress,
                dependencies: task.dependencies
            };
            this.showTaskInfo(ganttTask);
        }
    },

    /**
     * Change view mode
     * @param {string} viewMode - View mode
     */
    changeViewMode: function(viewMode) {
        if (this.ganttInstance) {
            this.ganttInstance.change_view_mode(viewMode);
            this.currentViewMode = viewMode;
        }
    },

    /**
     * Format date to Italian format
     * @param {Date} date - Date object
     * @returns {string} Formatted date
     */
    formatDateIT: function(date) {
        if (!(date instanceof Date) || isNaN(date)) return '-';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Format date to YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} Formatted date
     */
    formatDate: function(date) {
        if (!(date instanceof Date)) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Calculate duration between two dates
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {number} Duration in days
     */
    calculateDuration: function(start, end) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    /**
     * Show empty state
     */
    showEmptyState: function() {
        const container = document.getElementById('gantt-container');
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-chart-line fa-3x mb-3"></i>
                <p>Carica un cronoprogramma per visualizzare il diagramma di Gantt</p>
            </div>
        `;

        const tbody = document.querySelector('#taskTable tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nessun dato disponibile</td></tr>';
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError: function(message) {
        const container = document.getElementById('gantt-container');
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Errore:</strong> ${message}
            </div>
        `;
    },

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, info, warning, danger)
     */
    showNotification: function(message, type = 'info') {
        // Simple notification - could be enhanced with a toast library
        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    /**
     * Clear Gantt chart
     */
    clear: function() {
        this.ganttInstance = null;
        this.currentTasks = [];
        this.showEmptyState();

        const infoCard = document.getElementById('taskInfoCard');
        infoCard.style.display = 'none';
    }
};

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GanttManager;
}
