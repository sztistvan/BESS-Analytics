/**
 * Battery Simulation Module
 * Calculates battery charge/discharge cycles and optimization metrics
 */
const BatterySimulation = {
    // Configuration
    config: {
        capacityKwh: 10,
        chargeEfficiency: 0.96,
        dischargeEfficiency: 0.92,
        maxChargeRateKw: 5,
        maxDischargeRateKw: 5,
        minSocPercent: 10,
        maxSocPercent: 90,
        inverterMode: 'asymmetric', // 'asymmetric' | 'symmetric'
        currency: 'HUF', // 'HUF' | 'EUR'
        pricing: {
            HUF: {
                tier1ImportPrice: 36,
                tier2ImportPrice: 70,
                exportPrice: 5,
                tier1LimitKwh: 2523
            },
            EUR: {
                tier1ImportPrice: 0.09,
                tier2ImportPrice: 0.18,
                exportPrice: 0.01,
                tier1LimitKwh: 2523
            }
        }
    },

    /**
     * Run simulation and calculate metrics
     * @param {Array} mergedData - Timeline with solar and grid data
     * @returns {Object} { simulatedData: Array, metrics: Object }
     */
    simulate(mergedData) {
        let socKwh = this.config.capacityKwh * (this.config.minSocPercent / 100);
        const simulatedData = [];
        
        // Calculate before metrics (baseline without battery)
        const beforeMetrics = this.calculateBaselineMetrics(mergedData);
        
        // Run simulation with battery
        mergedData.forEach(point => {
            let batteryChargeKw = 0;
            let batteryDischargeKw = 0;
            let batteryLossKw = 0;
            let gridImportWithBattery = point.importKwh;
            let gridExportWithBattery = point.exportKwh;
            
            if (this.config.inverterMode === 'asymmetric') {
                // Asymmetric Mode: Calculate net balance
                const netBalance = point.exportKwh - point.importKwh;
                
                if (netBalance > 0) {
                    // Surplus available - Charge battery
                    const chargeRequest = Math.min(netBalance, this.config.maxChargeRateKw * 0.25);
                    const maxChargeKwh = (this.config.maxSocPercent / 100 * this.config.capacityKwh) - socKwh;
                    const actualCharge = Math.min(chargeRequest, Math.max(0, maxChargeKwh));
                    
                    if (actualCharge > 0) {
                        const energyStored = actualCharge * this.config.chargeEfficiency;
                        socKwh += energyStored;
                        const chargeLoss = actualCharge - energyStored;
                        
                        gridImportWithBattery = point.importKwh;
                        gridExportWithBattery = point.exportKwh - actualCharge;
                        batteryChargeKw = actualCharge / 0.25;
                        batteryDischargeKw = 0;
                        batteryLossKw = chargeLoss / 0.25;
                    }
                } else if (netBalance < 0) {
                    // Deficit to cover - Discharge battery
                    const dischargeRequest = Math.min(Math.abs(netBalance), this.config.maxDischargeRateKw * 0.25);
                    const availableDischargeKwh = socKwh - (this.config.minSocPercent / 100 * this.config.capacityKwh);
                    const actualDischarge = Math.min(dischargeRequest, Math.max(0, availableDischargeKwh));
                    
                    if (actualDischarge > 0) {
                        const energyDelivered = actualDischarge * this.config.dischargeEfficiency;
                        socKwh -= actualDischarge;
                        const dischargeLoss = actualDischarge - energyDelivered;
                        
                        gridImportWithBattery = point.importKwh - energyDelivered;
                        gridExportWithBattery = point.exportKwh;
                        batteryDischargeKw = actualDischarge / 0.25;
                        batteryChargeKw = 0;
                        batteryLossKw = dischargeLoss / 0.25;
                    }
                }
            } else {
                // Symmetric Mode: Separate charge/discharge logic
                if (point.exportKwh > 0 && point.importKwh === 0) {
                    // Surplus available for charging
                    const chargeRequest = Math.min(point.exportKwh, this.config.maxChargeRateKw * 0.25);
                    const maxChargeKwh = (this.config.maxSocPercent / 100 * this.config.capacityKwh) - socKwh;
                    const actualCharge = Math.min(chargeRequest, Math.max(0, maxChargeKwh));
                    
                    if (actualCharge > 0) {
                        const energyStored = actualCharge * this.config.chargeEfficiency;
                        socKwh += energyStored;
                        const chargeLoss = actualCharge - energyStored;
                        
                        gridExportWithBattery = point.exportKwh - actualCharge;
                        gridImportWithBattery = point.importKwh;
                        batteryChargeKw = actualCharge / 0.25;
                        batteryDischargeKw = 0;
                        batteryLossKw = chargeLoss / 0.25;
                    }
                } else if (point.importKwh > 0 && point.exportKwh === 0) {
                    // Deficit to be covered
                    const dischargeRequest = Math.min(point.importKwh, this.config.maxDischargeRateKw * 0.25);
                    const availableDischargeKwh = socKwh - (this.config.minSocPercent / 100 * this.config.capacityKwh);
                    const actualDischarge = Math.min(dischargeRequest, Math.max(0, availableDischargeKwh));
                    
                    if (actualDischarge > 0) {
                        const energyDelivered = actualDischarge * this.config.dischargeEfficiency;
                        socKwh -= actualDischarge;
                        const dischargeLoss = actualDischarge - energyDelivered;
                        
                        gridImportWithBattery = point.importKwh - energyDelivered;
                        gridExportWithBattery = point.exportKwh;
                        batteryDischargeKw = actualDischarge / 0.25;
                        batteryChargeKw = 0;
                        batteryLossKw = dischargeLoss / 0.25;
                    }
                }
            }
            
            // Store simulated data point
            simulatedData.push({
                ...point,
                batterySocPercent: (socKwh / this.config.capacityKwh) * 100,
                batterySocKwh: socKwh,
                batteryChargeKw: batteryChargeKw,
                batteryDischargeKw: batteryDischargeKw,
                batteryLossKw: batteryLossKw,
                gridImportWithBattery: gridImportWithBattery,
                gridExportWithBattery: gridExportWithBattery
            });
        });
        
        // Calculate after metrics (with battery)
        const afterMetrics = this.calculateSimulatedMetrics(simulatedData, beforeMetrics);
        
        // Calculate improvements
        const improvements = this.calculateImprovements(beforeMetrics, afterMetrics);
        
        // Calculate financial savings
        const financials = this.calculateFinancialSavings(simulatedData, beforeMetrics, afterMetrics);
        
        return {
            simulatedData,
            metrics: {
                before: beforeMetrics,
                after: afterMetrics,
                improvements: improvements,
                financials: financials
            }
        };
    },

    /**
     * Calculate baseline metrics (without battery)
     */
    calculateBaselineMetrics(data) {
        let totalSolarProduction = 0;
        let totalGridImport = 0;
        let totalGridExport = 0;

        data.forEach(point => {
            const solarEnergy = point.productionKw * 0.25; // 15min to kWh
            totalSolarProduction += solarEnergy;
            totalGridImport += point.importKwh;
            totalGridExport += point.exportKwh;
        });

        // Self-consumption = solar produced that wasn't exported
        const totalSelfConsumption = totalSolarProduction - totalGridExport;

        const selfConsumptionRate = totalSolarProduction > 0 
            ? (totalSelfConsumption / totalSolarProduction) * 100 
            : 0;

        return {
            solarProduction: totalSolarProduction,
            gridImport: totalGridImport,
            gridExport: totalGridExport,
            solarSelfConsumption: totalSelfConsumption,
            selfConsumptionRate: selfConsumptionRate,
            batterySelfConsumption: 0,
            batteryLosses: 0
        };
    },

    /**
     * Calculate simulated metrics (with battery)
     */
    calculateSimulatedMetrics(data, baselineMetrics) {
        let totalGridImportWithBattery = 0;
        let totalGridExportWithBattery = 0;
        let totalBatteryLosses = 0;
        let totalSolarProduction = 0;

        data.forEach(point => {
            totalSolarProduction += point.productionKw * 0.25;
            totalGridImportWithBattery += point.gridImportWithBattery;
            totalGridExportWithBattery += point.gridExportWithBattery;
            totalBatteryLosses += point.batteryLossKw * 0.25;
        });

        // Calculate new solar self-consumption
        const solarSelfConsumption = totalSolarProduction - totalGridExportWithBattery;
        
        // Calculate battery self-consumption (additional solar used due to battery)
        const batterySelfConsumption = solarSelfConsumption - baselineMetrics.solarSelfConsumption;
        
        const selfConsumptionRate = totalSolarProduction > 0 
            ? (solarSelfConsumption / totalSolarProduction) * 100 
            : 0;

        return {
            solarProduction: totalSolarProduction,
            gridImport: totalGridImportWithBattery,
            gridExport: totalGridExportWithBattery,
            solarSelfConsumption: solarSelfConsumption,
            selfConsumptionRate: selfConsumptionRate,
            batterySelfConsumption: batterySelfConsumption,
            batteryLosses: totalBatteryLosses
        };
    },

    /**
     * Calculate improvements (difference between before and after)
     */
    calculateImprovements(before, after) {
        const gridImportReduction = before.gridImport - after.gridImport;
        const gridExportReduction = before.gridExport - after.gridExport;
        const selfConsumptionImprovement = after.solarSelfConsumption - before.solarSelfConsumption;

        return {
            gridImportReduction: gridImportReduction,
            gridImportReductionPercent: before.gridImport > 0 
                ? (gridImportReduction / before.gridImport) * 100 
                : 0,
            gridExportReduction: gridExportReduction,
            gridExportReductionPercent: before.gridExport > 0 
                ? (gridExportReduction / before.gridExport) * 100 
                : 0,
            selfConsumptionImprovement: selfConsumptionImprovement,
            selfConsumptionImprovementPercent: after.selfConsumptionRate - before.selfConsumptionRate
        };
    },

    /**
     * Calculate financial savings from battery simulation
     */
    calculateFinancialSavings(data, baselineMetrics, simulatedMetrics) {
        const prices = this.config.pricing[this.config.currency];
        const tier1Limit = prices.tier1LimitKwh;
        const tier1Price = prices.tier1PricePerKwh;
        const tier2Price = prices.tier2PricePerKwh;
        const exportPrice = prices.exportPricePerKwh;

        // Helper function to calculate cost with tier boundaries
        const calculateCost = (gridImportPerInterval, gridExportPerInterval) => {
            let totalCost = 0;
            let cumulativeImport = 0;

            for (let i = 0; i < gridImportPerInterval.length; i++) {
                const importKwh = gridImportPerInterval[i];
                const exportKwh = gridExportPerInterval[i];

                // Calculate import cost with tier detection
                const importBeforeInterval = cumulativeImport;
                const importAfterInterval = cumulativeImport + importKwh;

                let intervalImportCost = 0;
                if (importAfterInterval <= tier1Limit) {
                    // All in tier 1
                    intervalImportCost = importKwh * tier1Price;
                } else if (importBeforeInterval >= tier1Limit) {
                    // All in tier 2
                    intervalImportCost = importKwh * tier2Price;
                } else {
                    // Crosses tier boundary
                    const tier1Kwh = tier1Limit - importBeforeInterval;
                    const tier2Kwh = importKwh - tier1Kwh;
                    intervalImportCost = (tier1Kwh * tier1Price) + (tier2Kwh * tier2Price);
                }

                // Calculate export revenue (always negative cost)
                const intervalExportRevenue = exportKwh * exportPrice;

                totalCost += (intervalImportCost - intervalExportRevenue);
                cumulativeImport += importKwh;
            }

            return totalCost;
        };

        // Extract per-interval data for baseline (original data)
        const baselineImports = data.map(point => point.importKwh);
        const baselineExports = data.map(point => point.exportKwh);

        // Extract per-interval data for battery scenario (simulated data)
        const batteryImports = data.map(point => point.gridImportWithBattery);
        const batteryExports = data.map(point => point.gridExportWithBattery);

        // Calculate costs
        const baselineCost = calculateCost(baselineImports, baselineExports);
        const batteryCost = calculateCost(batteryImports, batteryExports);
        const totalSavings = baselineCost - batteryCost;
        const savingsPercent = baselineCost > 0 ? (totalSavings / baselineCost) * 100 : 0;

        return {
            baselineCost: baselineCost,
            batteryCost: batteryCost,
            totalSavings: totalSavings,
            savingsPercent: savingsPercent,
            currency: this.config.currency
        };
    },

    /**
     * Update battery parameters
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Validate efficiency values
        if (this.config.chargeEfficiency > 1 || this.config.chargeEfficiency <= 0) {
            console.warn('chargeEfficiency must be between 0 and 1');
            this.config.chargeEfficiency = 0.96;
        }
        if (this.config.dischargeEfficiency > 1 || this.config.dischargeEfficiency <= 0) {
            console.warn('dischargeEfficiency must be between 0 and 1');
            this.config.dischargeEfficiency = 0.92;
        }
    },
    
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
};
