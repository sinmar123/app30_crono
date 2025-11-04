/**
 * Export functionality for Gantt chart
 * Handles Excel and PNG export
 */

const Exporter = {
    /**
     * Export to Excel
     * @param {Array} tasks - Array of task objects
     * @param {string} filename - Output filename
     */
    exportToExcel: function(tasks, filename = 'cronoprogramma.xlsx') {
        if (!tasks || tasks.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }

        try {
            // Prepare data for Excel
            const excelData = this.prepareExcelData(tasks);

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Add main sheet with task data
            const ws = XLSX.utils.aoa_to_sheet(excelData.main);
            XLSX.utils.book_append_sheet(wb, ws, 'Cronoprogramma');

            // Add Gantt timeline sheet
            const wsGantt = this.createGanttSheet(tasks);
            XLSX.utils.book_append_sheet(wb, wsGantt, 'Gantt Timeline');

            // Add statistics sheet
            const wsStats = XLSX.utils.aoa_to_sheet(excelData.statistics);
            XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiche');

            // Apply column widths
            ws['!cols'] = [
                { wch: 30 }, // Nome
                { wch: 12 }, // Inizio
                { wch: 12 }, // Fine
                { wch: 10 }, // Durata
                { wch: 10 }, // Progresso
                { wch: 20 }, // Dipendenze
                { wch: 15 }  // Stato
            ];

            // Write file
            XLSX.writeFile(wb, filename);

            console.log('Excel esportato con successo:', filename);
        } catch (error) {
            console.error('Errore durante l\'esportazione Excel:', error);
            alert('Errore durante l\'esportazione: ' + error.message);
        }
    },

    /**
     * Prepare data for Excel export
     * @param {Array} tasks - Tasks array
     * @returns {Object} Prepared data
     */
    prepareExcelData: function(tasks) {
        // Main sheet data
        const mainData = [
            ['CRONOPROGRAMMA LAVORI', '', '', '', '', '', ''],
            ['', '', '', '', '', '', ''],
            ['Nome Attività', 'Data Inizio', 'Data Fine', 'Durata (gg)', 'Progresso (%)', 'Dipendenze', 'Stato']
        ];

        tasks.forEach(task => {
            const start = new Date(task.start);
            const end = new Date(task.end);
            const duration = CronoParser.calculateDuration(task.start, task.end);
            const status = this.getTaskStatus(task.progress);

            mainData.push([
                task.name,
                this.formatDateIT(start),
                this.formatDateIT(end),
                duration,
                task.progress,
                task.dependencies || '-',
                status
            ]);
        });

        // Add totals
        mainData.push(['', '', '', '', '', '', '']);
        mainData.push(['TOTALE ATTIVITÀ:', tasks.length, '', '', '', '', '']);

        // Statistics sheet
        const stats = this.calculateStatistics(tasks);
        const statisticsData = [
            ['STATISTICHE PROGETTO', ''],
            ['', ''],
            ['Indicatore', 'Valore'],
            ['Totale Attività', tasks.length],
            ['Attività Completate', stats.completed],
            ['Attività in Corso', stats.inProgress],
            ['Attività Non Iniziate', stats.notStarted],
            ['', ''],
            ['Progresso Medio (%)', stats.avgProgress.toFixed(2)],
            ['Durata Totale (gg)', stats.totalDuration],
            ['', ''],
            ['Data Inizio Progetto', stats.projectStart],
            ['Data Fine Progetto', stats.projectEnd],
            ['Durata Progetto (gg)', stats.projectDuration]
        ];

        return {
            main: mainData,
            statistics: statisticsData
        };
    },

    /**
     * Create Gantt timeline sheet
     * @param {Array} tasks - Tasks array
     * @returns {Object} Worksheet object
     */
    createGanttSheet: function(tasks) {
        // Find project date range
        const dates = tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // Generate date columns (by week)
        const dateColumns = this.generateDateColumns(minDate, maxDate);

        // Header
        const header = ['Attività', ...dateColumns.map(d => this.formatDateIT(d))];
        const data = [header];

        // For each task, create a row with marks in corresponding date columns
        tasks.forEach(task => {
            const row = [task.name];
            const taskStart = new Date(task.start);
            const taskEnd = new Date(task.end);

            dateColumns.forEach(date => {
                if (date >= taskStart && date <= taskEnd) {
                    // Task is active in this period
                    const symbol = task.progress === 100 ? '█' :
                                  task.progress > 0 ? '▓' : '░';
                    row.push(symbol);
                } else {
                    row.push('');
                }
            });

            data.push(row);
        });

        return XLSX.utils.aoa_to_sheet(data);
    },

    /**
     * Generate date columns for Gantt timeline
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {Array} Array of dates
     */
    generateDateColumns: function(start, end) {
        const dates = [];
        const current = new Date(start);

        // Set to Monday of the week
        current.setDate(current.getDate() - current.getDay() + 1);

        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 7); // Next week
        }

        return dates;
    },

    /**
     * Calculate project statistics
     * @param {Array} tasks - Tasks array
     * @returns {Object} Statistics object
     */
    calculateStatistics: function(tasks) {
        const completed = tasks.filter(t => t.progress === 100).length;
        const inProgress = tasks.filter(t => t.progress > 0 && t.progress < 100).length;
        const notStarted = tasks.filter(t => t.progress === 0).length;

        const totalProgress = tasks.reduce((sum, t) => sum + t.progress, 0);
        const avgProgress = tasks.length > 0 ? totalProgress / tasks.length : 0;

        const totalDuration = tasks.reduce((sum, t) => {
            return sum + CronoParser.calculateDuration(t.start, t.end);
        }, 0);

        const dates = tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
        const projectStart = new Date(Math.min(...dates));
        const projectEnd = new Date(Math.max(...dates));
        const projectDuration = CronoParser.calculateDuration(
            this.formatDate(projectStart),
            this.formatDate(projectEnd)
        );

        return {
            completed,
            inProgress,
            notStarted,
            avgProgress,
            totalDuration,
            projectStart: this.formatDateIT(projectStart),
            projectEnd: this.formatDateIT(projectEnd),
            projectDuration
        };
    },

    /**
     * Get task status based on progress
     * @param {number} progress - Progress percentage
     * @returns {string} Status text
     */
    getTaskStatus: function(progress) {
        if (progress === 0) return 'Non iniziata';
        if (progress === 100) return 'Completata';
        return 'In corso';
    },

    /**
     * Export Gantt chart as PNG
     */
    exportToPNG: function() {
        const ganttContainer = document.getElementById('gantt-container');

        if (!ganttContainer.querySelector('svg')) {
            alert('Nessun diagramma di Gantt da esportare');
            return;
        }

        html2canvas(ganttContainer, {
            backgroundColor: '#ffffff',
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'gantt-chart.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            console.log('PNG esportato con successo');
        }).catch(error => {
            console.error('Errore durante l\'esportazione PNG:', error);
            alert('Errore durante l\'esportazione: ' + error.message);
        });
    },

    /**
     * Export tasks data as CSV
     * @param {Array} tasks - Tasks array
     * @param {string} filename - Output filename
     */
    exportToCSV: function(tasks, filename = 'cronoprogramma.csv') {
        if (!tasks || tasks.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }

        const headers = ['Nome,Data Inizio,Data Fine,Durata (gg),Progresso (%),Dipendenze,Stato'];
        const rows = tasks.map(task => {
            const duration = CronoParser.calculateDuration(task.start, task.end);
            const status = this.getTaskStatus(task.progress);
            return [
                `"${task.name}"`,
                task.start,
                task.end,
                duration,
                task.progress,
                `"${task.dependencies || ''}"`,
                status
            ].join(',');
        });

        const csv = [headers, ...rows].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        console.log('CSV esportato con successo:', filename);
    },

    /**
     * Format date to Italian format (DD/MM/YYYY)
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
    }
};

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Exporter;
}
