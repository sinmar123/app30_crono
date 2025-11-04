/**
 * Parser per cronoprogrammi verticali
 * Gestisce l'importazione da diversi formati e la conversione in formato Gantt
 */

const CronoParser = {
    /**
     * Parse CSV data
     * @param {string} csvText - CSV text content
     * @returns {Array} Array of task objects
     */
    parseCSV: function(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('Il file CSV deve contenere almeno una riga di intestazione e una di dati');
        }

        // Parse header
        const headers = this.parseCSVLine(lines[0]);
        const tasks = [];

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines

            const values = this.parseCSVLine(lines[i]);
            const task = {};

            headers.forEach((header, index) => {
                task[header.toLowerCase().trim()] = values[index] ? values[index].trim() : '';
            });

            tasks.push(task);
        }

        return this.normalizeTasksData(tasks);
    },

    /**
     * Parse a single CSV line handling quoted values
     * @param {string} line - CSV line
     * @returns {Array} Array of values
     */
    parseCSVLine: function(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    },

    /**
     * Parse Excel file
     * @param {ArrayBuffer} data - Excel file data
     * @returns {Array} Array of task objects
     */
    parseExcel: function(data) {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length < 2) {
            throw new Error('Il file Excel deve contenere almeno una riga di intestazione e una di dati');
        }

        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        const tasks = [];

        for (let i = 1; i < jsonData.length; i++) {
            if (!jsonData[i] || jsonData[i].length === 0) continue;

            const task = {};
            headers.forEach((header, index) => {
                task[header] = jsonData[i][index] !== undefined ? String(jsonData[i][index]).trim() : '';
            });

            tasks.push(task);
        }

        return this.normalizeTasksData(tasks);
    },

    /**
     * Normalize tasks data to standard format
     * @param {Array} tasks - Raw tasks data
     * @returns {Array} Normalized tasks
     */
    normalizeTasksData: function(tasks) {
        return tasks.map((task, index) => {
            // Trova i campi chiave (supporta vari nomi)
            const name = this.findField(task, ['nome', 'name', 'attivita', 'attività', 'task', 'descrizione']);
            const startDate = this.findField(task, ['inizio', 'start', 'data_inizio', 'datainizio', 'data inizio']);
            const endDate = this.findField(task, ['fine', 'end', 'data_fine', 'datafine', 'data fine']);
            const progress = this.findField(task, ['progresso', 'progress', 'avanzamento', '%', 'completamento']);
            const dependencies = this.findField(task, ['dipendenze', 'dependencies', 'predecessori', 'predecessors']);
            const duration = this.findField(task, ['durata', 'duration', 'giorni', 'days']);

            if (!name) {
                console.warn(`Task ${index + 1}: nome mancante, skip`);
                return null;
            }

            // Parse date
            let start = this.parseDate(startDate);
            let end = this.parseDate(endDate);

            // Se manca la data fine ma c'è la durata, calcola la fine
            if (!end && start && duration) {
                const durationDays = parseInt(duration);
                if (!isNaN(durationDays)) {
                    end = new Date(start);
                    end.setDate(end.getDate() + durationDays);
                }
            }

            // Se manca la data di inizio, usa oggi
            if (!start) {
                start = new Date();
            }

            // Se manca la data di fine, usa inizio + 7 giorni
            if (!end) {
                end = new Date(start);
                end.setDate(end.getDate() + 7);
            }

            // Parse progress
            let progressValue = 0;
            if (progress) {
                const progressNum = parseFloat(progress.toString().replace('%', '').replace(',', '.'));
                if (!isNaN(progressNum)) {
                    progressValue = Math.min(Math.max(progressNum, 0), 100);
                }
            }

            // Parse dependencies
            let deps = [];
            if (dependencies) {
                deps = dependencies.toString().split(',').map(d => d.trim()).filter(d => d);
            }

            return {
                id: `task-${index + 1}`,
                name: name,
                start: this.formatDate(start),
                end: this.formatDate(end),
                progress: progressValue,
                dependencies: deps.length > 0 ? deps.join(', ') : '',
                custom_class: this.getTaskClass(progressValue)
            };
        }).filter(task => task !== null);
    },

    /**
     * Find a field in task object with various possible names
     * @param {Object} task - Task object
     * @param {Array} possibleNames - Possible field names
     * @returns {*} Field value
     */
    findField: function(task, possibleNames) {
        for (let name of possibleNames) {
            if (task[name] !== undefined && task[name] !== '') {
                return task[name];
            }
        }
        return null;
    },

    /**
     * Parse date from various formats
     * @param {*} dateValue - Date value
     * @returns {Date|null} Parsed date
     */
    parseDate: function(dateValue) {
        if (!dateValue) return null;

        // Se è già una data
        if (dateValue instanceof Date) {
            return dateValue;
        }

        const dateStr = dateValue.toString().trim();
        if (!dateStr) return null;

        // Prova vari formati
        // ISO format: YYYY-MM-DD
        let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return new Date(match[1], match[2] - 1, match[3]);
        }

        // Italian format: DD/MM/YYYY or DD-MM-YYYY
        match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match) {
            return new Date(match[3], match[2] - 1, match[1]);
        }

        // Excel serial date number
        if (!isNaN(dateValue) && dateValue > 25569) {
            return new Date((dateValue - 25569) * 86400 * 1000);
        }

        // Try native Date parse
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        return null;
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
     * Get CSS class based on progress
     * @param {number} progress - Progress percentage
     * @returns {string} CSS class
     */
    getTaskClass: function(progress) {
        if (progress === 0) return 'bar-not-started';
        if (progress === 100) return 'bar-complete';
        return 'bar-in-progress';
    },

    /**
     * Calculate task duration in days
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {number} Duration in days
     */
    calculateDuration: function(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    /**
     * Validate tasks data
     * @param {Array} tasks - Tasks array
     * @returns {Object} Validation result
     */
    validateTasks: function(tasks) {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(tasks) || tasks.length === 0) {
            errors.push('Nessuna attività trovata nel file');
            return { valid: false, errors, warnings };
        }

        tasks.forEach((task, index) => {
            const taskNum = index + 1;

            if (!task.name) {
                errors.push(`Attività ${taskNum}: nome mancante`);
            }

            if (!task.start) {
                warnings.push(`Attività ${taskNum}: data inizio mancante`);
            }

            if (!task.end) {
                warnings.push(`Attività ${taskNum}: data fine mancante`);
            }

            if (task.start && task.end) {
                const start = new Date(task.start);
                const end = new Date(task.end);
                if (end < start) {
                    errors.push(`Attività ${taskNum} (${task.name}): data fine precedente alla data inizio`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
};

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CronoParser;
}
