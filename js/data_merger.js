/**
 * DataMerger Module
 * Responsible for synchronizing Solar and Grid datasets into a continuous timeline.
 */
const DataMerger = {
    mergeDatasets(solarData, gridData) {
        const masterMap = new Map();

        const populateMap = (data, type) => {
            data.forEach(row => {
                const ts = row.timestampMs;
                if (!masterMap.has(ts)) {
                    masterMap.set(ts, { 
                        timestamp: row.timestamp,
                        timestampMs: ts, // Added this field!
                        productionKw: 0, 
                        importKwh: 0, 
                        exportKwh: 0 
                    });
                }
                const entry = masterMap.get(ts);
                if (type === 'solar') entry.productionKw = row.productionKw;
                if (type === 'grid') {
                    entry.importKwh = row.importKwh;
                    entry.exportKwh = row.exportKwh;
                }
            });
        };

        populateMap(solarData, 'solar');
        populateMap(gridData, 'grid');

        // Sorting by numeric timestamp
        return Array.from(masterMap.values()).sort((a, b) => a.timestampMs - b.timestampMs);
    },

    /**
     * Aggregate data to daily intervals
     * @param {Array} data - Array of 15-minute interval data
     * @param {Object} fields - Object specifying which fields to sum or average
     *                          { sum: ['field1', 'field2'], average: ['field3', 'field4'] }
     * @returns {Array} Array of daily aggregated data
     */
    aggregateDataToDaily(data, fields) {
        if (!data || data.length === 0) return [];

        const dailyMap = new Map();

        data.forEach(row => {
            const date = new Date(row.timestamp);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, {
                    dateKey: dateKey,
                    timestamp: `${dateKey}T00:00:00`,
                    timestampMs: new Date(`${dateKey}T00:00:00`).getTime(),
                    count: 0,
                    sums: {},
                    totals: {}
                });
            }

            const entry = dailyMap.get(dateKey);
            entry.count++;

            // Sum specified fields
            if (fields.sum) {
                fields.sum.forEach(field => {
                    if (row[field] !== undefined) {
                        if (!entry.sums[field]) entry.sums[field] = 0;
                        entry.sums[field] += row[field];
                    }
                });
            }

            // Accumulate for averaging
            if (fields.average) {
                fields.average.forEach(field => {
                    if (row[field] !== undefined) {
                        if (!entry.totals[field]) entry.totals[field] = 0;
                        entry.totals[field] += row[field];
                    }
                });
            }
        });

        // Convert map to array and calculate averages
        return Array.from(dailyMap.values()).map(entry => {
            const result = {
                timestamp: entry.timestamp,
                timestampMs: entry.timestampMs
            };

            // Add summed fields
            if (fields.sum) {
                fields.sum.forEach(field => {
                    result[field] = entry.sums[field] || 0;
                });
            }

            // Add averaged fields
            if (fields.average) {
                fields.average.forEach(field => {
                    result[field] = entry.count > 0 ? (entry.totals[field] || 0) / entry.count : 0;
                });
            }

            return result;
        }).sort((a, b) => a.timestampMs - b.timestampMs);
    },

    /**
     * Aggregate data to monthly intervals
     * @param {Array} data - Array of 15-minute interval data
     * @param {Object} fields - Object specifying which fields to sum or average
     *                          { sum: ['field1', 'field2'], average: ['field3', 'field4'] }
     * @returns {Array} Array of monthly aggregated data
     */
    aggregateDataToMonthly(data, fields) {
        if (!data || data.length === 0) return [];

        const monthlyMap = new Map();

        data.forEach(row => {
            const date = new Date(row.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    monthKey: monthKey,
                    timestamp: `${monthKey}-01T00:00:00`,
                    timestampMs: new Date(`${monthKey}-01T00:00:00`).getTime(),
                    count: 0,
                    sums: {},
                    totals: {}
                });
            }

            const entry = monthlyMap.get(monthKey);
            entry.count++;

            // Sum specified fields
            if (fields.sum) {
                fields.sum.forEach(field => {
                    if (row[field] !== undefined) {
                        if (!entry.sums[field]) entry.sums[field] = 0;
                        entry.sums[field] += row[field];
                    }
                });
            }

            // Accumulate for averaging
            if (fields.average) {
                fields.average.forEach(field => {
                    if (row[field] !== undefined) {
                        if (!entry.totals[field]) entry.totals[field] = 0;
                        entry.totals[field] += row[field];
                    }
                });
            }
        });

        // Convert map to array and calculate averages
        return Array.from(monthlyMap.values()).map(entry => {
            const result = {
                timestamp: entry.timestamp,
                timestampMs: entry.timestampMs
            };

            // Add summed fields
            if (fields.sum) {
                fields.sum.forEach(field => {
                    result[field] = entry.sums[field] || 0;
                });
            }

            // Add averaged fields
            if (fields.average) {
                fields.average.forEach(field => {
                    result[field] = entry.count > 0 ? (entry.totals[field] || 0) / entry.count : 0;
                });
            }

            return result;
        }).sort((a, b) => a.timestampMs - b.timestampMs);
    }
};
