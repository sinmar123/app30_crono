/**
 * Main application logic
 * Handles UI interactions and coordinates between modules
 */

const App = {
    currentTasks: [],

    /**
     * Initialize application
     */
    init: function() {
        console.log('Inizializzazione applicazione...');
        this.setupEventListeners();
        this.loadExamples();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Manual input button
        const btnParseManual = document.getElementById('btnParseManual');
        btnParseManual.addEventListener('click', () => this.handleManualInput());

        // Example buttons
        const btnLoadExample1 = document.getElementById('btnLoadExample1');
        btnLoadExample1.addEventListener('click', () => this.loadExample('simple'));

        const btnLoadExample2 = document.getElementById('btnLoadExample2');
        btnLoadExample2.addEventListener('click', () => this.loadExample('complex'));

        // View mode selector
        const viewMode = document.getElementById('viewMode');
        viewMode.addEventListener('change', (e) => this.changeViewMode(e.target.value));

        // Export buttons
        const btnExportExcel = document.getElementById('btnExportExcel');
        btnExportExcel.addEventListener('click', () => this.exportExcel());

        const btnExportPNG = document.getElementById('btnExportPNG');
        btnExportPNG.addEventListener('click', () => this.exportPNG());

        // Clear button
        const btnClear = document.getElementById('btnClear');
        btnClear.addEventListener('click', () => this.clear());
    },

    /**
     * Handle file upload
     * @param {Event} event - File input change event
     */
    handleFileUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let tasks;

                if (fileName.endsWith('.csv')) {
                    // Parse CSV
                    const csvText = e.target.result;
                    tasks = CronoParser.parseCSV(csvText);
                } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    // Parse Excel
                    const data = new Uint8Array(e.target.result);
                    tasks = CronoParser.parseExcel(data);
                } else {
                    throw new Error('Formato file non supportato. Usa .csv, .xlsx o .xls');
                }

                // Validate tasks
                const validation = CronoParser.validateTasks(tasks);

                if (!validation.valid) {
                    alert('Errori nel file:\n' + validation.errors.join('\n'));
                    return;
                }

                if (validation.warnings.length > 0) {
                    console.warn('Avvisi:', validation.warnings);
                }

                // Render Gantt
                this.currentTasks = tasks;
                const viewMode = document.getElementById('viewMode').value;
                GanttManager.renderGantt(tasks, viewMode);

                this.showSuccess(`File caricato con successo: ${tasks.length} attività trovate`);
            } catch (error) {
                console.error('Errore nel parsing del file:', error);
                alert('Errore nel caricamento del file: ' + error.message);
            }
        };

        // Read file based on extension
        if (fileName.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    },

    /**
     * Handle manual input
     */
    handleManualInput: function() {
        const input = document.getElementById('manualInput').value.trim();

        if (!input) {
            alert('Inserisci i dati nel formato CSV');
            return;
        }

        try {
            const tasks = CronoParser.parseCSV(input);

            const validation = CronoParser.validateTasks(tasks);

            if (!validation.valid) {
                alert('Errori nei dati:\n' + validation.errors.join('\n'));
                return;
            }

            if (validation.warnings.length > 0) {
                console.warn('Avvisi:', validation.warnings);
            }

            this.currentTasks = tasks;
            const viewMode = document.getElementById('viewMode').value;
            GanttManager.renderGantt(tasks, viewMode);

            this.showSuccess(`Dati caricati con successo: ${tasks.length} attività`);
        } catch (error) {
            console.error('Errore nel parsing dei dati:', error);
            alert('Errore nel parsing dei dati: ' + error.message);
        }
    },

    /**
     * Load predefined examples
     */
    loadExamples: function() {
        // Generate dates starting from today
        const today = new Date();
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const addDays = (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        };

        this.examples = {
            simple: [
                {
                    id: 'task-1',
                    name: 'Progettazione',
                    start: formatDate(today),
                    end: formatDate(addDays(today, 30)),
                    progress: 100
                },
                {
                    id: 'task-2',
                    name: 'Approvazioni',
                    start: formatDate(addDays(today, 31)),
                    end: formatDate(addDays(today, 60)),
                    progress: 80
                },
                {
                    id: 'task-3',
                    name: 'Esecuzione lavori',
                    start: formatDate(addDays(today, 61)),
                    end: formatDate(addDays(today, 150)),
                    progress: 50
                },
                {
                    id: 'task-4',
                    name: 'Collaudi',
                    start: formatDate(addDays(today, 151)),
                    end: formatDate(addDays(today, 180)),
                    progress: 0
                }
            ],
            complex: [
                {
                    id: 'task-1',
                    name: 'Progettazione preliminare',
                    start: formatDate(today),
                    end: formatDate(addDays(today, 20)),
                    progress: 100
                },
                {
                    id: 'task-2',
                    name: 'Progettazione definitiva',
                    start: formatDate(addDays(today, 21)),
                    end: formatDate(addDays(today, 50)),
                    progress: 100
                },
                {
                    id: 'task-3',
                    name: 'Autorizzazioni',
                    start: formatDate(addDays(today, 51)),
                    end: formatDate(addDays(today, 90)),
                    progress: 75
                },
                {
                    id: 'task-4',
                    name: 'Preparazione cantiere',
                    start: formatDate(addDays(today, 91)),
                    end: formatDate(addDays(today, 110)),
                    progress: 50
                },
                {
                    id: 'task-5',
                    name: 'Scavi e fondazioni',
                    start: formatDate(addDays(today, 111)),
                    end: formatDate(addDays(today, 160)),
                    progress: 30
                },
                {
                    id: 'task-6',
                    name: 'Strutture',
                    start: formatDate(addDays(today, 161)),
                    end: formatDate(addDays(today, 250)),
                    progress: 10
                },
                {
                    id: 'task-7',
                    name: 'Impianti',
                    start: formatDate(addDays(today, 251)),
                    end: formatDate(addDays(today, 320)),
                    progress: 0
                },
                {
                    id: 'task-8',
                    name: 'Finiture',
                    start: formatDate(addDays(today, 321)),
                    end: formatDate(addDays(today, 400)),
                    progress: 0
                },
                {
                    id: 'task-9',
                    name: 'Collaudi',
                    start: formatDate(addDays(today, 401)),
                    end: formatDate(addDays(today, 430)),
                    progress: 0
                }
            ]
        };
    },

    /**
     * Load example data
     * @param {string} type - Example type (simple, complex)
     */
    loadExample: function(type) {
        const tasks = this.examples[type];

        if (!tasks) {
            alert('Esempio non trovato');
            return;
        }

        this.currentTasks = tasks;
        const viewMode = document.getElementById('viewMode').value;
        GanttManager.renderGantt(tasks, viewMode);

        this.showSuccess(`Esempio caricato: ${tasks.length} attività`);

        // Switch to Gantt tab if on mobile
        if (window.innerWidth < 992) {
            document.querySelector('.col-lg-8').scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * Change Gantt view mode
     * @param {string} viewMode - View mode
     */
    changeViewMode: function(viewMode) {
        if (this.currentTasks.length === 0) {
            return;
        }

        GanttManager.changeViewMode(viewMode);
    },

    /**
     * Export to Excel
     */
    exportExcel: function() {
        if (this.currentTasks.length === 0) {
            alert('Carica prima un cronoprogramma');
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `cronoprogramma_${timestamp}.xlsx`;

        Exporter.exportToExcel(this.currentTasks, filename);
        this.showSuccess('File Excel esportato con successo');
    },

    /**
     * Export to PNG
     */
    exportPNG: function() {
        if (this.currentTasks.length === 0) {
            alert('Carica prima un cronoprogramma');
            return;
        }

        Exporter.exportToPNG();
        this.showSuccess('Immagine esportata con successo');
    },

    /**
     * Clear all data
     */
    clear: function() {
        if (this.currentTasks.length === 0) {
            return;
        }

        if (confirm('Vuoi cancellare tutti i dati?')) {
            this.currentTasks = [];
            GanttManager.clear();

            // Clear inputs
            document.getElementById('fileInput').value = '';
            document.getElementById('manualInput').value = '';

            this.showSuccess('Dati cancellati');
        }
    },

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess: function(message) {
        console.log('✓', message);
        // Could be enhanced with a toast notification library
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError: function(message) {
        console.error('✗', message);
        alert(message);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
