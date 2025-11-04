# Convertitore Cronoprogramma Verticale a Gantt

Applicazione web per convertire cronoprogrammi verticali in diagrammi di Gantt interattivi con esportazione Excel.

## Funzionalità

- 📊 Importazione cronoprogrammi verticali (Excel, CSV, input manuale)
- 📈 Visualizzazione Gantt interattiva
- 💾 Esportazione in formato Excel (.xlsx)
- 🎨 Interfaccia moderna e responsive
- ⚡ Funziona completamente nel browser (no server richiesto)

## Tecnologie Utilizzate

- HTML5/CSS3/JavaScript
- Frappe Gantt - Libreria per diagrammi Gantt
- SheetJS (xlsx) - Esportazione Excel
- Bootstrap 5 - UI Framework

## Come Usare

1. Apri `index.html` nel browser
2. Inserisci i dati del cronoprogramma:
   - Carica un file Excel/CSV
   - Oppure inserisci i dati manualmente
3. Visualizza il diagramma di Gantt interattivo
4. Esporta in formato Excel

## Struttura Progetto

```
app30_crono/
├── index.html          # Pagina principale
├── css/
│   └── style.css       # Stili personalizzati
├── js/
│   ├── parser.js       # Parser cronoprogrammi verticali
│   ├── gantt.js        # Gestione diagramma Gantt
│   ├── exporter.js     # Esportazione Excel
│   └── app.js          # Logica principale
└── examples/
    └── esempio.csv     # Esempio di cronoprogramma
```

## Formato Input

Il cronoprogramma verticale deve contenere:
- Nome attività
- Data inizio
- Data fine (o durata)
- Opzionale: Dipendenze, progresso, responsabile

## Licenza

MIT
