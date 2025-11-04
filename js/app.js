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
        this.examples = {
            simple: [
                {
                    id: 'task-1',
                    name: 'Progettazione',
                    start: '2024-01-01',
                    end: '2024-01-31',
                    progress: 100,
                    dependencies: '',
                    custom_class: 'bar-complete'
                },
                {
                    id: 'task-2',
                    name: 'Approvazioni',
                    start: '2024-02-01',
                    end: '2024-02-15',
                    progress: 100,
                    dependencies: 'Progettazione',
                    custom_class: 'bar-complete'
                },
                {
                    id: 'task-3',
                    name: 'Preparazione cantiere',
                    start: '2024-02-16',
                    end: '2024-02-29',
                    progress: 80,
                    dependencies: 'Approvazioni',
                    custom_class: 'bar-in-progress'
                },
                {
                    id: 'task-4',
                    name: 'Scavi e fondazioni',
                    start: '2024-03-01',
                    end: '2024-03-31',
                    progress: 50,
                    dependencies: 'Preparazione cantiere',
                    custom_class: 'bar-in-progress'
                },
                {
                    id: 'task-5',
                    name: 'Strutture in elevazione',
                    start: '2024-04-01',
                    end: '2024-05-31',
                    progress: 0,
                    dependencies: 'Scavi e fondazioni',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-6',
                    name: 'Impianti',
                    start: '2024-06-01',
                    end: '2024-07-15',
                    progress: 0,
                    dependencies: 'Strutture in elevazione',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-7',
                    name: 'Finiture',
                    start: '2024-07-16',
                    end: '2024-08-31',
                    progress: 0,
                    dependencies: 'Impianti',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-8',
                    name: 'Collaudi',
                    start: '2024-09-01',
                    end: '2024-09-15',
                    progress: 0,
                    dependencies: 'Finiture',
                    custom_class: 'bar-not-started'
                }
            ],
            complex: [
                {
                    id: 'task-1',
                    name: 'Fase 1: Progettazione preliminare',
                    start: '2024-01-01',
                    end: '2024-01-15',
                    progress: 100,
                    dependencies: '',
                    custom_class: 'bar-complete'
                },
                {
                    id: 'task-2',
                    name: 'Fase 1: Progettazione definitiva',
                    start: '2024-01-16',
                    end: '2024-02-15',
                    progress: 100,
                    dependencies: 'Fase 1: Progettazione preliminare',
                    custom_class: 'bar-complete'
                },
                {
                    id: 'task-3',
                    name: 'Fase 1: Progettazione esecutiva',
                    start: '2024-02-16',
                    end: '2024-03-15',
                    progress: 100,
                    dependencies: 'Fase 1: Progettazione definitiva',
                    custom_class: 'bar-complete'
                },
                {
                    id: 'task-4',
                    name: 'Fase 2: Autorizzazioni comunali',
                    start: '2024-03-16',
                    end: '2024-04-30',
                    progress: 75,
                    dependencies: 'Fase 1: Progettazione esecutiva',
                    custom_class: 'bar-in-progress'
                },
                {
                    id: 'task-5',
                    name: 'Fase 2: Autorizzazioni ambientali',
                    start: '2024-03-16',
                    end: '2024-05-15',
                    progress: 60,
                    dependencies: 'Fase 1: Progettazione esecutiva',
                    custom_class: 'bar-in-progress'
                },
                {
                    id: 'task-6',
                    name: 'Fase 3: Allestimento cantiere',
                    start: '2024-05-01',
                    end: '2024-05-31',
                    progress: 40,
                    dependencies: 'Fase 2: Autorizzazioni comunali',
                    custom_class: 'bar-in-progress'
                },
                {
                    id: 'task-7',
                    name: 'Fase 3: Bonifica sito',
                    start: '2024-06-01',
                    end: '2024-06-30',
                    progress: 20,
                    dependencies: 'Fase 3: Allestimento cantiere',
                    custom_class: 'bar-in-progress'
                },
                {
                    id: 'task-8',
                    name: 'Fase 4: Demolizioni',
                    start: '2024-07-01',
                    end: '2024-07-31',
                    progress: 0,
                    dependencies: 'Fase 3: Bonifica sito',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-9',
                    name: 'Fase 4: Scavi e sbancamenti',
                    start: '2024-08-01',
                    end: '2024-09-15',
                    progress: 0,
                    dependencies: 'Fase 4: Demolizioni',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-10',
                    name: 'Fase 5: Fondazioni',
                    start: '2024-09-16',
                    end: '2024-11-15',
                    progress: 0,
                    dependencies: 'Fase 4: Scavi e sbancamenti',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-11',
                    name: 'Fase 5: Strutture orizzontali piano terra',
                    start: '2024-11-16',
                    end: '2024-12-31',
                    progress: 0,
                    dependencies: 'Fase 5: Fondazioni',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-12',
                    name: 'Fase 5: Strutture verticali piano 1',
                    start: '2025-01-01',
                    end: '2025-02-28',
                    progress: 0,
                    dependencies: 'Fase 5: Strutture orizzontali piano terra',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-13',
                    name: 'Fase 6: Copertura',
                    start: '2025-03-01',
                    end: '2025-04-30',
                    progress: 0,
                    dependencies: 'Fase 5: Strutture verticali piano 1',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-14',
                    name: 'Fase 6: Impianto elettrico',
                    start: '2025-05-01',
                    end: '2025-06-30',
                    progress: 0,
                    dependencies: 'Fase 6: Copertura',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-15',
                    name: 'Fase 6: Impianto idraulico',
                    start: '2025-05-01',
                    end: '2025-06-30',
                    progress: 0,
                    dependencies: 'Fase 6: Copertura',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-16',
                    name: 'Fase 7: Serramenti',
                    start: '2025-07-01',
                    end: '2025-08-15',
                    progress: 0,
                    dependencies: 'Fase 6: Impianto elettrico, Fase 6: Impianto idraulico',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-17',
                    name: 'Fase 7: Intonaci e rasature',
                    start: '2025-08-16',
                    end: '2025-09-30',
                    progress: 0,
                    dependencies: 'Fase 7: Serramenti',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-18',
                    name: 'Fase 7: Pavimenti e rivestimenti',
                    start: '2025-10-01',
                    end: '2025-11-15',
                    progress: 0,
                    dependencies: 'Fase 7: Intonaci e rasature',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-19',
                    name: 'Fase 8: Tinteggiature',
                    start: '2025-11-16',
                    end: '2025-12-15',
                    progress: 0,
                    dependencies: 'Fase 7: Pavimenti e rivestimenti',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-20',
                    name: 'Fase 8: Sistemazioni esterne',
                    start: '2025-12-16',
                    end: '2026-01-31',
                    progress: 0,
                    dependencies: 'Fase 8: Tinteggiature',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-21',
                    name: 'Fase 9: Collaudi impianti',
                    start: '2026-02-01',
                    end: '2026-02-15',
                    progress: 0,
                    dependencies: 'Fase 8: Sistemazioni esterne',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-22',
                    name: 'Fase 9: Certificazione energetica',
                    start: '2026-02-16',
                    end: '2026-02-28',
                    progress: 0,
                    dependencies: 'Fase 9: Collaudi impianti',
                    custom_class: 'bar-not-started'
                },
                {
                    id: 'task-23',
                    name: 'Fase 9: Consegna lavori',
                    start: '2026-03-01',
                    end: '2026-03-15',
                    progress: 0,
                    dependencies: 'Fase 9: Certificazione energetica',
                    custom_class: 'bar-not-started'
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
