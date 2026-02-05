/**
 * CSVHandler Module
 * Designed to handle any date format and specific column ordering.
 */
const CSVHandler = {
    /**
     * Attempts to parse various date formats into a valid Date object.
     * Handles: 2024.10.01, 10/01/2024, 01-10-2024, etc.
     */
    parseUniversalDate(dateString) {
        if (!dateString) return null;

        // Clean Hungarian or dotted formats: 2024.10.01. -> 2024-10-01
        let cleaned = dateString.trim().replace(/\s+/g, ' ');
        if (cleaned.includes('.')) {
            cleaned = cleaned.replace(/\./g, '-').replace(/-$/, '').replace(/-\s/, ' ');
        }

        const dateObj = new Date(cleaned);
        
        // Validation
        if (isNaN(dateObj.getTime())) {
            console.error(`Failed to parse date: ${dateString}`);
            return null;
        }
        return dateObj;
    },

    /**
     * Processes data based on column index rather than header names.
     * Solar: Index 0 = Time, Index 1 = Production
     * Grid:  Index 0 = Time, Index 1 = Import, Index 2 = Export
     */
    processDataset(text, type) {
        const delimiter = this.detectDelimiter(text.slice(0, 1000));
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        
        if (lines.length < 2) return []; // Header + at least one data row

        return lines.slice(1).map(line => {
            const values = line.split(delimiter).map(v => v.trim());
            const timestamp = this.parseUniversalDate(values[0]);

            let entry = {
                timestamp: timestamp,
                timestampMs: timestamp ? timestamp.getTime() : 0
            };

            if (type === 'solar') {
                // Solar: Column 2 (Index 1) is Production
                entry.productionKw = parseFloat(values[1]?.replace(',', '.') || 0);
            } else if (type === 'grid') {
                // Grid: Column 2 (Index 1) is Import, Column 3 (Index 2) is Export
                entry.importKwh = parseFloat(values[1]?.replace(',', '.') || 0);
                entry.exportKwh = parseFloat(values[2]?.replace(',', '.') || 0);
            }

            return entry;
        }).filter(row => row.timestamp !== null);
    },

    detectDelimiter(text) {
        const commaCount = (text.match(/,/g) || []).length;
        const semiColonCount = (text.match(/;/g) || []).length;
        return semiColonCount > commaCount ? ';' : ',';
    },

    /**
     * Validates CSV structure based on expected column count
     * @param {string} text - Raw CSV content
     * @param {string} type - 'solar' (expects 2 columns) or 'grid' (expects 3 columns)
     * @returns {Object} { valid: boolean, error: string|null }
     */
    validateStructure(text, type) {
        const delimiter = this.detectDelimiter(text.slice(0, 1000));
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        
        if (lines.length < 2) {
            return { valid: false, error: 'CSV file must have at least a header row and one data row' };
        }

        const headerCols = lines[0].split(delimiter).length;
        const expectedCols = type === 'solar' ? 2 : 3;

        if (headerCols !== expectedCols) {
            return { 
                valid: false, 
                error: `Invalid ${type} CSV: Expected exactly ${expectedCols} columns, found ${headerCols}. ${type === 'solar' ? 'This looks like a Grid file.' : 'This looks like a Solar file.'}` 
            };
        }

        // Check a few data rows for consistency
        const rowsToCheck = Math.min(5, lines.length - 1);
        for (let i = 1; i <= rowsToCheck; i++) {
            const colCount = lines[i].split(delimiter).length;
            if (colCount !== expectedCols) {
                return { 
                    valid: false, 
                    error: `Invalid ${type} CSV: Row ${i + 1} has ${colCount} columns (expected exactly ${expectedCols})` 
                };
            }
        }

        return { valid: true, error: null };
    }
};
