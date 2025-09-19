class CFOHelper {
    constructor() {
        this.scenarioCount = 0;
        this.reportCount = 0;
        this.scenarioCost = 0;
        this.exportCost = 0;
        this.chart = null;
        this.apiBaseUrl = 'https://api.pathway.com/v1'; // Mock Pathway API
        this.flexpriceApiUrl = 'https://api.flexprice.com/v1'; // Mock Flexprice API
        this.apiKey = 'demo-api-key-12345'; // Demo API key
        
        // OpenAI API Configuration for Chatbot
        this.openaiApiKey = 'sk-proj-your-openai-api-key-here'; // Replace with your OpenAI API key
        this.openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
        
        this.liveDataInterval = null;
        this.initializeApp();
    }

    initializeApp() {
        this.setupSliders();
        this.setupEventListeners();
        this.initializeChart();
        this.fetchInitialData();
        this.startLiveDataStream();
        this.initializeFlexpriceIntegration();
    }

    // API Integration Methods
    async fetchInitialData() {
        try {
            this.showAlert('Connecting to Pathway API...', 'info');
            this.updateApiStatus(true, true); // Assume connected initially
            
            // Simulate API call to get initial financial data
            const response = await this.makeApiCall('/financial/initial-data', {
                method: 'GET'
            });
            
            if (response.success) {
                this.updateInputsFromApi(response.data);
                this.updateApiStatus(true, true);
                setTimeout(() => this.runSimulation(), 1000);
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            this.updateApiStatus(false, false);
            this.showAlert('API unavailable - running in offline mode', 'info');
            this.simulateInitialData();
        }
    }

    async makeApiCall(endpoint, options = {}) {
        // Simulate API calls with realistic responses
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        
        // Mock different API responses based on endpoint
        switch (endpoint) {
            case '/financial/initial-data':
                return {
                    success: true,
                    data: {
                        monthlySpending: 35000,
                        engineers: 4,
                        productPrice: 450,
                        marketingSpend: 18000,
                        currentCash: 600000,
                        lastUpdated: new Date().toISOString()
                    }
                };
            
            case '/financial/live-updates':
                return {
                    success: true,
                    data: {
                        updates: [
                            {
                                type: 'revenue',
                                amount: Math.floor(Math.random() * 20000) + 5000,
                                description: 'New customer payment received',
                                timestamp: new Date().toISOString()
                            },
                            {
                                type: 'expense',
                                amount: Math.floor(Math.random() * 10000) + 2000,
                                description: 'Monthly subscription renewed',
                                timestamp: new Date().toISOString()
                            }
                        ]
                    }
                };
                
            case '/billing/track-usage':
                return {
                    success: true,
                    data: {
                        billId: `bill_${Date.now()}`,
                        amount: options.body?.amount || 0,
                        currency: 'INR',
                        status: 'charged'
                    }
                };
                
            default:
                throw new Error('API endpoint not found');
        }
    }

    updateInputsFromApi(data) {
        if (data.monthlySpending) {
            document.getElementById('monthlySpending').value = data.monthlySpending;
            document.getElementById('spendingValue').textContent = `₹${data.monthlySpending.toLocaleString()}`;
        }
        if (data.engineers) {
            document.getElementById('engineers').value = data.engineers;
            document.getElementById('engineersValue').textContent = data.engineers;
        }
        if (data.productPrice) {
            document.getElementById('productPrice').value = data.productPrice;
            document.getElementById('priceValue').textContent = `₹${data.productPrice}`;
        }
        if (data.marketingSpend) {
            document.getElementById('marketingSpend').value = data.marketingSpend;
            document.getElementById('marketingValue').textContent = `₹${data.marketingSpend.toLocaleString()}`;
        }
        if (data.currentCash) {
            document.getElementById('currentCash').value = data.currentCash;
            document.getElementById('cashValue').textContent = `₹${data.currentCash.toLocaleString()}`;
        }
        
        this.showAlert('Financial data updated from Pathway API', 'success');
    }

    setupSliders() {
        const sliders = [
            { id: 'monthlySpending', valueId: 'spendingValue', formatter: (val) => `₹${parseInt(val).toLocaleString()}` },
            { id: 'engineers', valueId: 'engineersValue', formatter: (val) => val },
            { id: 'productPrice', valueId: 'priceValue', formatter: (val) => `₹${val}` },
            { id: 'marketingSpend', valueId: 'marketingValue', formatter: (val) => `₹${parseInt(val).toLocaleString()}` },
            { id: 'currentCash', valueId: 'cashValue', formatter: (val) => `₹${parseInt(val).toLocaleString()}` }
        ];

        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueDisplay = document.getElementById(slider.valueId);
            
            element.addEventListener('input', (e) => {
                valueDisplay.textContent = slider.formatter(e.target.value);
                this.updateSimulationRealTime();
            });
        });
    }

    setupEventListeners() {
        document.getElementById('simulateBtn').addEventListener('click', () => this.runSimulation());
        document.getElementById('refreshDataBtn').addEventListener('click', () => this.refreshLiveData());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportReport());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareScenario());
        document.getElementById('chatbotBtn').addEventListener('click', () => this.toggleChatbot());
        document.getElementById('closeChatbot').addEventListener('click', () => this.toggleChatbot());
        document.getElementById('sendMessage').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Quick question buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.getAttribute('data-question');
                this.askQuickQuestion(question);
            });
        });
    }

    initializeChart() {
        const ctx = document.getElementById('forecastChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Cash Balance',
                        data: [],
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#00d4ff',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Revenue',
                        data: [],
                        borderColor: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        tension: 0.4,
                        pointBackgroundColor: '#48bb78',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Expenses',
                        data: [],
                        borderColor: '#f56565',
                        backgroundColor: 'rgba(245, 101, 101, 0.1)',
                        tension: 0.4,
                        pointBackgroundColor: '#f56565',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Financial Forecast (6 Months)',
                        font: { size: 18, weight: 'bold' },
                        color: '#f7fafc',
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 13, weight: '600' },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.2)'
                        },
                        ticks: {
                            color: '#a0aec0',
                            font: { size: 12, weight: '500' }
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.2)'
                        },
                        ticks: {
                            color: '#a0aec0',
                            font: { size: 12, weight: '500' },
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }

    getInputValues() {
        return {
            monthlySpending: parseInt(document.getElementById('monthlySpending').value),
            engineers: parseInt(document.getElementById('engineers').value),
            productPrice: parseInt(document.getElementById('productPrice').value),
            marketingSpend: parseInt(document.getElementById('marketingSpend').value),
            currentCash: parseInt(document.getElementById('currentCash').value)
        };
    }

    calculateFinancials(inputs) {
        // Engineer salary calculation (assuming ₹80,000 per month per engineer)
        const engineerSalary = inputs.engineers * 80000;
        
        // Total monthly expenses
        const totalMonthlyExpenses = inputs.monthlySpending + engineerSalary + inputs.marketingSpend;
        
        // Revenue calculation (assuming product price affects number of sales)
        // Higher price = fewer sales, optimum around ₹500
        const priceMultiplier = Math.max(0.5, 2 - (inputs.productPrice / 500));
        const baseUsers = Math.floor(inputs.marketingSpend / 100); // Marketing efficiency
        const monthlyRevenue = baseUsers * inputs.productPrice * priceMultiplier;
        
        // Monthly profit
        const monthlyProfit = monthlyRevenue - totalMonthlyExpenses;
        
        // Runway calculation
        const runway = monthlyProfit < 0 ? inputs.currentCash / Math.abs(monthlyProfit) : Infinity;
        
        // Break-even point
        const breakEvenMonths = monthlyProfit <= 0 ? null : inputs.currentCash / monthlyRevenue;
        
        // Profit margin
        const profitMargin = monthlyRevenue > 0 ? ((monthlyRevenue - totalMonthlyExpenses) / monthlyRevenue) * 100 : 0;

        return {
            monthlyRevenue,
            totalMonthlyExpenses,
            monthlyProfit,
            runway,
            breakEvenMonths,
            profitMargin,
            burnRate: Math.abs(monthlyProfit < 0 ? monthlyProfit : 0)
        };
    }

    generateForecastData(inputs, financials) {
        const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
        const cashBalance = [];
        const revenue = [];
        const expenses = [];
        
        let currentCash = inputs.currentCash;
        
        for (let i = 0; i < 6; i++) {
            // Add some growth/decline variability
            const growthFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% variability
            const monthlyRev = financials.monthlyRevenue * growthFactor;
            const monthlyExp = financials.totalMonthlyExpenses * (1 + i * 0.02); // 2% monthly increase
            
            currentCash += (monthlyRev - monthlyExp);
            
            cashBalance.push(Math.round(currentCash));
            revenue.push(Math.round(monthlyRev));
            expenses.push(Math.round(monthlyExp));
        }

        return { months, cashBalance, revenue, expenses };
    }

    updateMetricsDisplay(financials) {
        document.getElementById('runway').textContent = 
            financials.runway === Infinity ? '∞ (Profitable!)' : `${Math.round(financials.runway)} months`;
        
        document.getElementById('burnRate').textContent = 
            `₹${financials.burnRate.toLocaleString()}/month`;
        
        document.getElementById('breakEven').textContent = 
            financials.breakEvenMonths ? `${Math.round(financials.breakEvenMonths)} months` : 'Already profitable';
        
        document.getElementById('profitMargin').textContent = 
            `${financials.profitMargin.toFixed(1)}%`;
    }

    updateChart(forecastData) {
        this.chart.data.labels = forecastData.months;
        this.chart.data.datasets[0].data = forecastData.cashBalance;
        this.chart.data.datasets[1].data = forecastData.revenue;
        this.chart.data.datasets[2].data = forecastData.expenses;
        this.chart.update();
    }

    async runSimulation() {
        const btn = document.getElementById('simulateBtn');
        btn.classList.add('loading');
        btn.textContent = '🔄 Simulating...';
        
        try {
            const inputs = this.getInputValues();
            
            // Send scenario data to Pathway API for enhanced calculations
            const apiResponse = await this.makeApiCall('/financial/simulate-scenario', {
                method: 'POST',
                body: {
                    scenario: inputs,
                    userId: 'demo-user-123'
                }
            });
            
            const financials = this.calculateFinancials(inputs);
            const forecastData = this.generateForecastData(inputs, financials);
            
            this.updateMetricsDisplay(financials);
            this.updateChart(forecastData);
            
            // Track usage with Flexprice API
            await this.trackUsage('scenario', 5);
            
            // Update counters and billing
            this.scenarioCount++;
            this.scenarioCost += 5;
            this.updateCountersAndBilling();
            
            btn.classList.remove('loading');
            btn.textContent = '🔮 Run Simulation';
            
            this.showAlert('Simulation completed with live data integration!', 'success');
            
        } catch (error) {
            console.error('Simulation failed:', error);
            btn.classList.remove('loading');
            btn.textContent = '🔮 Run Simulation';
            this.showAlert('Simulation completed (offline mode)', 'info');
            
            // Fallback to local simulation
            const inputs = this.getInputValues();
            const financials = this.calculateFinancials(inputs);
            const forecastData = this.generateForecastData(inputs, financials);
            
            this.updateMetricsDisplay(financials);
            this.updateChart(forecastData);
            this.scenarioCount++;
            this.scenarioCost += 5;
            this.updateCountersAndBilling();
        }
    }

    updateSimulationRealTime() {
        // Debounced real-time updates
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            const inputs = this.getInputValues();
            const financials = this.calculateFinancials(inputs);
            this.updateMetricsDisplay(financials);
        }, 300);
    }

    simulateInitialData() {
        // Run initial simulation
        setTimeout(() => this.runSimulation(), 500);
    }

    async exportReport() {
        try {
            const inputs = this.getInputValues();
            const financials = this.calculateFinancials(inputs);
            
            // Always generate complete report (fallback approach for reliability)
            this.generateBasicReport(inputs, financials);
        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('Report export failed. Please try again.', 'error');
        }
    }

    generateBasicReport(inputs, financials) {
        try {
            // Enhanced fallback method for complete PDF generation
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('CFO Helper - Financial Forecast Report', 20, 25);
            
            // Date
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
            
            // Scenario Parameters Section
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Scenario Parameters:', 20, 60);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Monthly Spending: ₹${inputs.monthlySpending.toLocaleString()}`, 30, 75);
            doc.text(`Engineers: ${inputs.engineers}`, 30, 88);
            doc.text(`Product Price: ₹${inputs.productPrice}`, 30, 101);
            doc.text(`Marketing Spend: ₹${inputs.marketingSpend.toLocaleString()}`, 30, 114);
            doc.text(`Current Cash: ₹${inputs.currentCash.toLocaleString()}`, 30, 127);
            
            // Forecast Results Section
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Forecast Results:', 20, 150);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            const runwayText = financials.runway === Infinity ? 'Infinite (Profitable!)' : `${Math.round(financials.runway)} months`;
            doc.text(`Runway: ${runwayText}`, 30, 165);
            doc.text(`Monthly Burn Rate: ₹${Math.round(financials.burnRate).toLocaleString()}`, 30, 178);
            doc.text(`Profit Margin: ${financials.profitMargin.toFixed(2)}%`, 30, 191);
            
            // Key Insights Section
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Key Insights:', 20, 215);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            
            let insights = [];
            if (financials.runway < 3) {
                insights.push('Critical: Less than 3 months runway');
            } else if (financials.runway < 6) {
                insights.push('Warning: Monitor cash flow closely');
            } else if (financials.runway === Infinity) {
                insights.push('Excellent: Profitable and self-sustaining');
            } else {
                insights.push('Healthy: Good runway position');
            }
            
            if (financials.profitMargin < 0) {
                insights.push('Focus: Improve profitability immediately');
            } else if (financials.profitMargin > 20) {
                insights.push('Opportunity: Consider scaling operations');
            }
            
            if (inputs.engineers > 5) {
                insights.push('Consider: Hiring efficiency vs growth');
            }
            
            insights.forEach((insight, index) => {
                doc.text(`• ${insight}`, 30, 230 + (index * 13));
            });
            
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Report generated by CFO Helper Agent | ${new Date().toISOString()}`, 20, 280);
            
            doc.save(`CFO-Helper-Report-${new Date().toISOString().split('T')[0]}.pdf`);
            
            this.reportCount++;
            this.exportCost += 10;
            this.updateCountersAndBilling();
            this.showAlert('Complete financial report exported successfully!', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showAlert('PDF generation failed. Please check if jsPDF is loaded.', 'error');
        }
    }

    shareScenario() {
        const inputs = this.getInputValues();
        const financials = this.calculateFinancials(inputs);
        
        const shareText = `CFO Helper Scenario:
💰 Current Cash: ₹${inputs.currentCash.toLocaleString()}
👥 Engineers: ${inputs.engineers}
💵 Monthly Spending: ₹${inputs.monthlySpending.toLocaleString()}
📈 Product Price: ₹${inputs.productPrice}
🎯 Marketing: ₹${inputs.marketingSpend.toLocaleString()}

📊 Results:
⏱️ Runway: ${financials.runway === Infinity ? 'Profitable!' : Math.round(financials.runway) + ' months'}
💸 Burn Rate: ₹${financials.burnRate.toLocaleString()}/month
📈 Profit Margin: ${financials.profitMargin.toFixed(1)}%`;
        
        if (navigator.share) {
            navigator.share({
                title: 'CFO Helper Scenario',
                text: shareText
            });
        } else {
            navigator.clipboard.writeText(shareText);
            this.showAlert('Scenario copied to clipboard!', 'info');
        }
    }

    // Flexprice API Integration
    async initializeFlexpriceIntegration() {
        try {
            const response = await this.makeApiCall('/billing/initialize', {
                method: 'POST',
                body: {
                    userId: 'demo-user-123',
                    planType: 'pay-per-use',
                    currency: 'INR'
                }
            });
            
            if (response.success) {
                console.log('Flexprice integration initialized successfully');
            }
        } catch (error) {
            console.error('Flexprice initialization failed:', error);
        }
    }

    async trackUsage(type, amount) {
        try {
            const response = await this.makeApiCall('/billing/track-usage', {
                method: 'POST',
                body: {
                    userId: 'demo-user-123',
                    usageType: type,
                    amount: amount,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        feature: type === 'scenario' ? 'simulation' : 'report-export',
                        version: '1.0.0'
                    }
                }
            });
            
            if (response.success) {
                console.log(`Usage tracked: ${type} - ₹${amount}`);
                this.updateBillingDisplay();
            }
        } catch (error) {
            console.error('Usage tracking failed:', error);
            // Continue without API tracking
        }
    }

    updateBillingDisplay() {
        // Update billing information in the UI
        const totalCost = this.scenarioCost + this.exportCost;
        document.getElementById('totalCost').textContent = totalCost;
        
        // Add billing status indicator
        const billingInfo = document.querySelector('.billing-info');
        if (billingInfo) {
            const statusElement = billingInfo.querySelector('.billing-status') || document.createElement('p');
            statusElement.className = 'billing-status';
            statusElement.innerHTML = '✅ Billing synced with Flexprice API';
            if (!billingInfo.querySelector('.billing-status')) {
                billingInfo.appendChild(statusElement);
            }
        }
    }

    // Pathway API Integration for Live Data
    startLiveDataStream() {
        // Start real-time data streaming from Pathway API
        this.liveDataInterval = setInterval(async () => {
            try {
                await this.fetchLiveDataUpdates();
            } catch (error) {
                console.error('Live data fetch failed:', error);
                // Continue with mock data
                this.updateLiveData();
            }
        }, 15000); // Every 15 seconds for realistic API usage
        
        // Initial fetch
        setTimeout(() => this.fetchLiveDataUpdates(), 2000);
    }

    async fetchLiveDataUpdates() {
        try {
            const response = await this.makeApiCall('/financial/live-updates', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.success && response.data.updates) {
                this.processLiveUpdates(response.data.updates);
            }
        } catch (error) {
            throw error;
        }
    }

    processLiveUpdates(updates) {
        const dataUpdatesElement = document.getElementById('dataUpdates');
        const timestamp = new Date().toLocaleTimeString();
        
        let updateHtml = `<div class="alert alert-info">
            <strong>${timestamp} - Live Pathway API Update:</strong><br>`;
        
        updates.forEach(update => {
            const icon = update.type === 'revenue' ? '💰' : '💸';
            updateHtml += `${icon} ${update.description}: ₹${update.amount.toLocaleString()}<br>`;
        });
        
        updateHtml += `<small>🔄 Data refreshed via Pathway API integration</small></div>`;
        
        dataUpdatesElement.innerHTML = updateHtml;
        
        // Trigger a subtle animation
        dataUpdatesElement.style.animation = 'none';
        setTimeout(() => {
            dataUpdatesElement.style.animation = 'slideIn 0.5s ease-out';
        }, 10);
    }

    async refreshLiveData() {
        const btn = document.getElementById('refreshDataBtn');
        btn.classList.add('pulse');
        btn.textContent = '🔄 Syncing...';
        
        try {
            // Fetch fresh data from Pathway API
            const response = await this.makeApiCall('/financial/refresh-data', {
                method: 'POST',
                body: {
                    userId: 'demo-user-123',
                    requestType: 'manual-refresh'
                }
            });
            
            if (response.success) {
                await this.fetchLiveDataUpdates();
                // Optionally update input values if API provides new baseline data
                if (response.data && response.data.updatedInputs) {
                    this.updateInputsFromApi(response.data.updatedInputs);
                }
                this.showAlert('Data refreshed successfully from Pathway API!', 'success');
            }
        } catch (error) {
            console.error('Manual refresh failed:', error);
            this.updateLiveData(); // Fallback to mock data
            this.showAlert('Data refreshed (offline mode)', 'info');
        } finally {
            btn.classList.remove('pulse');
            btn.textContent = '🔄 Refresh Live Data';
        }
    }

    updateLiveData() {
        // Fallback method for live data updates when API is unavailable
        const updates = [
            'Revenue update: +₹5,000 this week',
            'New expense logged: Office supplies ₹2,000',
            'Payment received: ₹25,000',
            'Marketing campaign ROI: 240%',
            'Team productivity metrics updated',
            'Monthly subscription renewed: ₹8,000',
            'New lead generated worth ₹15,000'
        ];
        
        const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
        const timestamp = new Date().toLocaleTimeString();
        
        const dataUpdates = document.getElementById('dataUpdates');
        dataUpdates.innerHTML = `
            <div class="alert alert-info">
                <strong>${timestamp}:</strong> ${randomUpdate}
                <br><small>Data refreshed via fallback mode (API unavailable)</small>
            </div>
        `;
    }

    simulateInitialData() {
        // Fallback method for initial data when API is unavailable
        setTimeout(() => this.runSimulation(), 500);
    }

    updateCountersAndBilling() {
        document.getElementById('scenarioCount').textContent = this.scenarioCount;
        document.getElementById('reportCount').textContent = this.reportCount;
        document.getElementById('scenarioCost').textContent = this.scenarioCost;
        document.getElementById('exportCost').textContent = this.exportCost;
        document.getElementById('totalCost').textContent = this.scenarioCost + this.exportCost;
    }

    updateApiStatus(pathwayConnected = true, flexpriceConnected = true) {
        const apiStatus = document.getElementById('apiStatus');
        const flexpriceStatus = document.getElementById('flexpriceStatus');
        
        if (pathwayConnected) {
            apiStatus.innerHTML = '🟢 Connected to Pathway API';
            apiStatus.style.background = 'rgba(72, 187, 120, 0.1)';
            apiStatus.style.borderColor = 'rgba(72, 187, 120, 0.3)';
            apiStatus.style.color = '#68d391';
        } else {
            apiStatus.innerHTML = '🔴 Pathway API Offline';
            apiStatus.style.background = 'rgba(245, 101, 101, 0.1)';
            apiStatus.style.borderColor = 'rgba(245, 101, 101, 0.3)';
            apiStatus.style.color = '#fc8181';
        }
        
        if (flexpriceConnected) {
            flexpriceStatus.innerHTML = '💳 Flexprice Billing Active';
            flexpriceStatus.style.background = 'rgba(0, 212, 255, 0.1)';
            flexpriceStatus.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            flexpriceStatus.style.color = '#63b3ed';
        } else {
            flexpriceStatus.innerHTML = '⚠️ Billing Offline';
            flexpriceStatus.style.background = 'rgba(245, 101, 101, 0.1)';
            flexpriceStatus.style.borderColor = 'rgba(245, 101, 101, 0.3)';
            flexpriceStatus.style.color = '#fc8181';
        }
    }

    // AI Chatbot Methods
    toggleChatbot() {
        const chatbotPanel = document.getElementById('chatbotPanel');
        chatbotPanel.classList.toggle('open');
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Get AI response
        setTimeout(async () => {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
        }, 1000 + Math.random() * 2000);
    }

    askQuickQuestion(question) {
        document.getElementById('chatInput').value = question;
        this.sendChatMessage();
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        
        const avatar = type === 'ai' ? '🤖' : '👤';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                ${typeof content === 'string' ? `<p>${content}</p>` : content}
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>AI is thinking</span>
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getAIResponse(userMessage) {
        const inputs = this.getInputValues();
        const financials = this.calculateFinancials(inputs);
        
        // Try to get response from OpenAI API first
        try {
            const aiResponse = await this.getOpenAIResponse(userMessage, inputs, financials);
            if (aiResponse) {
                return aiResponse;
            }
        } catch (error) {
            console.error('OpenAI API failed, using fallback:', error);
        }
        
        // Fallback to local intelligent responses
        return this.getLocalAIResponse(userMessage, inputs, financials);
    }

    async getOpenAIResponse(userMessage, inputs, financials) {
        const systemPrompt = `You are a CFO AI Assistant for a business finance application. You provide expert financial advice based on real business data.

CURRENT BUSINESS DATA:
- Current Cash: ₹${inputs.currentCash.toLocaleString()}
- Monthly Spending: ₹${inputs.monthlySpending.toLocaleString()}
- Engineers: ${inputs.engineers}
- Product Price: ₹${inputs.productPrice}
- Marketing Spend: ₹${inputs.marketingSpend.toLocaleString()}

CALCULATED FINANCIALS:
- Monthly Revenue: ₹${Math.round(financials.monthlyRevenue).toLocaleString()}
- Monthly Expenses: ₹${Math.round(financials.totalMonthlyExpenses).toLocaleString()}
- Monthly Profit/Loss: ₹${Math.round(financials.monthlyProfit).toLocaleString()}
- Runway: ${financials.runway === Infinity ? 'Infinite (Profitable)' : Math.round(financials.runway) + ' months'}
- Burn Rate: ₹${Math.round(financials.burnRate).toLocaleString()}/month
- Profit Margin: ${financials.profitMargin.toFixed(1)}%

INSTRUCTIONS:
- Provide specific, actionable financial advice based on the user's question
- Use the actual numbers from their business data
- Be concise but thorough (max 150 words)
- Use HTML formatting with <br> for line breaks and <strong> for emphasis
- Include relevant emojis for better engagement
- Always base recommendations on the actual financial situation shown above`;

        try {
            const response = await fetch(this.openaiApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    max_tokens: 300,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || null;

        } catch (error) {
            console.error('OpenAI API call failed:', error);
            return null;
        }
    }

    getLocalAIResponse(userMessage, inputs, financials) {
        const message = userMessage.toLowerCase();

        // Enhanced keyword matching with more specific responses
        if (message.includes('runway') || message.includes('survive') || message.includes('how long') || message.includes('cash last')) {
            return this.generateRunwayAdvice(financials, inputs, userMessage);
        } else if (message.includes('hire') || message.includes('engineer') || message.includes('team') || message.includes('staff') || message.includes('employee')) {
            return this.generateHiringAdvice(financials, inputs, userMessage);
        } else if (message.includes('price') || message.includes('pricing') || message.includes('cost') || message.includes('charge')) {
            return this.generatePricingAdvice(financials, inputs, userMessage);
        } else if (message.includes('marketing') || message.includes('advertising') || message.includes('promotion') || message.includes('campaign')) {
            return this.generateMarketingAdvice(financials, inputs, userMessage);
        } else if (message.includes('cash flow') || message.includes('improve') || message.includes('optimize') || message.includes('better')) {
            return this.generateCashFlowAdvice(financials, inputs, userMessage);
        } else if (message.includes('profit') || message.includes('margin') || message.includes('profitability') || message.includes('money')) {
            return this.generateProfitAdvice(financials, inputs, userMessage);
        } else if (message.includes('break even') || message.includes('breakeven') || message.includes('profitable')) {
            return this.generateBreakEvenAdvice(financials, inputs, userMessage);
        } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return this.generateGreeting();
        } else if (message.includes('help') || message.includes('what can you do')) {
            return this.generateHelpResponse();
        } else if (message.includes('thank') || message.includes('thanks')) {
            return this.generateThankYouResponse();
        } else {
            return this.generateContextualResponse(financials, inputs, userMessage);
        }
    }

    generateRunwayAdvice(financials, inputs, userMessage = '') {
        const runway = Math.round(financials.runway);
        const question = userMessage.toLowerCase();
        
        // Provide different responses based on specific question asked
        if (question.includes('how long') || question.includes('survive')) {
            if (runway === Infinity) {
                return `🎉 <strong>Unlimited Survival Time!</strong><br><br>
                Great question! Your business can survive <strong>indefinitely</strong> at current rates because you're profitable!<br><br>
                
                <strong>You're making money:</strong><br>
                • Monthly profit: ₹${Math.round(financials.monthlyProfit).toLocaleString()}<br>
                • Cash grows by ₹${Math.round(financials.monthlyProfit).toLocaleString()} every month<br>
                • No survival concerns at current performance<br><br>
                
                Focus on scaling and reinvestment! 🚀`;
            } else {
                return `⏰ <strong>Survival Timeline: ${runway} months</strong><br><br>
                Based on your current burn rate, you can survive for <strong>${runway} months</strong> without additional funding.<br><br>
                
                <strong>The math:</strong><br>
                • Current cash: ₹${inputs.currentCash.toLocaleString()}<br>
                • Monthly burn: ₹${financials.burnRate.toLocaleString()}<br>
                • Survival formula: ${inputs.currentCash.toLocaleString()} ÷ ${financials.burnRate.toLocaleString()} = ${runway} months<br><br>
                
                ${runway < 6 ? '🚨 <strong>Action needed soon!</strong>' : '✅ <strong>Reasonable timeframe</strong>'}`;
            }
        } else if (question.includes('what') || question.includes('mean')) {
            if (runway === Infinity) {
                return `🎉 <strong>"Infinite Runway" Explained!</strong><br><br>
                Your runway is <strong>infinite</strong> - here's what that means:<br><br>
                
                <strong>Definition:</strong><br>
                • You're generating MORE money than you spend<br>
                • Monthly profit: +₹${Math.round(financials.monthlyProfit).toLocaleString()}<br>
                • Your cash balance GROWS each month<br>
                • No risk of running out of money<br><br>
                
                <strong>This is excellent!</strong> You can focus on growth and opportunities! 🎯`;
            } else {
                return `📊 <strong>"${runway}-Month Runway" Explained!</strong><br><br>
                Runway means how long your business can operate before running out of cash.<br><br>
                
                <strong>Your situation:</strong><br>
                • You have ${runway} months of cash left<br>
                • Based on current spending vs income<br>
                • Burning ₹${financials.burnRate.toLocaleString()}/month more than you make<br><br>
                
                <strong>Status:</strong> ${runway > 12 ? '✅ Healthy' : runway > 6 ? '⚠️ Monitor closely' : '🚨 Needs attention'}`;
            }
        } else {
            // Default runway response
            if (runway === Infinity) {
                return `🎉 <strong>Excellent Runway Position!</strong><br><br>
                Your business has <strong>infinite runway</strong> - you're profitable!<br><br>
                
                <strong>Current Performance:</strong><br>
                • Monthly profit: ₹${Math.round(financials.monthlyProfit).toLocaleString()}<br>
                • Cash position: ₹${inputs.currentCash.toLocaleString()}<br>
                • Status: Self-sustaining ✅<br><br>
                
                Consider reinvesting profits for growth opportunities!`;
            } else {
                return `📈 <strong>${runway}-Month Runway Analysis</strong><br><br>
                You have <strong>${runway} months</strong> of operational runway.<br><br>
                
                <strong>Financial Breakdown:</strong><br>
                • Monthly burn rate: ₹${financials.burnRate.toLocaleString()}<br>
                • Current cash: ₹${inputs.currentCash.toLocaleString()}<br>
                • Time remaining: ${runway} months<br><br>
                
                ${runway < 3 ? '🚨 Critical - immediate action needed!' : 
                  runway < 6 ? '⚠️ Start planning funding/cuts soon' : 
                  '✅ Good position to execute strategy'}`;
            }
        }
    }

    generateHiringAdvice(financials, inputs, userMessage = '') {
        const currentEngineers = inputs.engineers;
        const monthlyCostPerEngineer = 80000;
        const newBurnWithHire = financials.burnRate + monthlyCostPerEngineer;
        const newRunwayWithHire = inputs.currentCash / newBurnWithHire;
        
        if (financials.runway < 6) {
            return `� <strong>Hiring Not Recommended Right Now</strong><br><br>
            With only <strong>${Math.round(financials.runway)} months runway</strong>, adding engineers is risky.<br><br>
            
            <strong>Impact Analysis:</strong><br>
            • Current team: ${currentEngineers} engineers<br>
            • Cost per new hire: ₹${monthlyCostPerEngineer.toLocaleString()}/month<br>
            • New runway with 1 hire: ~${Math.round(newRunwayWithHire)} months<br>
            • You'd lose ${Math.round(financials.runway - newRunwayWithHire)} months of runway<br><br>
            
            <strong>Better Alternatives:</strong><br>
            • Hire freelancers/contractors for specific projects<br>
            • Focus existing team on revenue-generating features<br>
            • Wait until runway > 12 months<br>
            • Consider equity-only hires if desperate`;
        } else if (financials.profitMargin > 15 && financials.runway > 12) {
            return `💚 <strong>Good Time to Consider Hiring!</strong><br><br>
            Your financials support strategic hiring:<br>
            • Profit margin: ${financials.profitMargin.toFixed(1)}% (healthy)<br>
            • Current runway: ${Math.round(financials.runway)} months (safe)<br>
            • Current team: ${currentEngineers} engineers<br><br>
            
            <strong>Hiring Impact:</strong><br>
            • Each new engineer costs ₹${monthlyCostPerEngineer.toLocaleString()}/month<br>
            • New runway with 1 hire: ~${Math.round(newRunwayWithHire)} months<br>
            • Impact on monthly profit: -₹${monthlyCostPerEngineer.toLocaleString()}<br><br>
            
            <strong>Smart Hiring Strategy:</strong><br>
            • Hire revenue-focused engineers first<br>
            • Look for full-stack developers<br>
            • Set clear 3-month productivity goals<br>
            • Consider senior vs junior trade-offs`;
        } else {
            return `⚖️ <strong>Hiring Requires Careful Planning</strong><br><br>
            Your current team size of <strong>${currentEngineers} engineers</strong> seems appropriate for now.<br><br>
            
            <strong>Current Financial Picture:</strong><br>
            • Monthly burn: ₹${financials.burnRate.toLocaleString()}<br>
            • Profit margin: ${financials.profitMargin.toFixed(1)}%<br>
            • Runway: ${Math.round(financials.runway)} months<br><br>
            
            <strong>Before Hiring, Consider:</strong><br>
            • Can current team be more productive?<br>
            • Will new hire directly increase revenue?<br>
            • Do you have 18+ months runway after hiring?<br>
            • Are you solving the right problems?<br><br>
            
            <strong>Alternative Strategies:</strong><br>
            • Improve processes and tools first<br>
            • Outsource non-core functions<br>
            • Focus on product-market fit<br>
            • Hire when you have clear revenue impact`;
        }
    }

    generatePricingAdvice(financials, inputs, userMessage = '') {
        const currentPrice = inputs.productPrice;
        const optimalPrice = 500; // Based on our pricing model
        
        if (currentPrice < 400) {
            return `📈 <strong>Pricing Opportunity:</strong> At ₹${currentPrice}, you're likely underpricing. Consider:<br>
            • Testing ₹${optimalPrice} (sweet spot in our model)<br>
            • A/B testing different price points<br>
            • Gradual increases of 10-20% quarterly<br>
            • Adding premium features to justify higher prices`;
        } else if (currentPrice > 600) {
            return `📉 <strong>Pricing Analysis:</strong> ₹${currentPrice} might be limiting your customer base. Consider:<br>
            • Testing lower price points around ₹${optimalPrice}<br>
            • Creating multiple pricing tiers<br>
            • Analyzing customer feedback on pricing<br>
            • Volume vs. margin optimization`;
        } else {
            return `✅ <strong>Good Pricing:</strong> ₹${currentPrice} is in a healthy range. Your revenue potential looks good:<br>
            • Current monthly revenue: ₹${Math.round(financials.monthlyRevenue).toLocaleString()}<br>
            • Consider premium/enterprise tiers<br>
            • Monitor customer price sensitivity<br>
            • Test 10% increases quarterly`;
        }
    }

    generateMarketingAdvice(financials, inputs, userMessage = '') {
        const marketingSpend = inputs.marketingSpend;
        const marketingROI = financials.monthlyRevenue / marketingSpend;
        
        if (marketingROI < 2) {
            return `📊 <strong>Marketing ROI Alert:</strong> You're getting ₹${marketingROI.toFixed(2)} for every ₹1 spent on marketing. Recommendations:<br>
            • Reduce marketing spend from ₹${marketingSpend.toLocaleString()}<br>
            • Focus on higher-converting channels<br>
            • Improve customer acquisition cost (CAC)<br>
            • Consider organic growth strategies`;
        } else if (marketingROI > 4) {
            return `🚀 <strong>Excellent Marketing ROI:</strong> ₹${marketingROI.toFixed(2)} return per ₹1 spent! Consider:<br>
            • Increasing marketing budget by 20-30%<br>
            • Scaling successful channels<br>
            • Testing new marketing channels<br>
            • Current spend of ₹${marketingSpend.toLocaleString()} could be increased`;
        } else {
            return `💼 <strong>Decent Marketing Performance:</strong> ₹${marketingROI.toFixed(2)} ROI is acceptable. Optimization ideas:<br>
            • Track conversion rates by channel<br>
            • A/B test marketing messages<br>
            • Focus on customer lifetime value<br>
            • Current ₹${marketingSpend.toLocaleString()} seems reasonable`;
        }
    }

    generateCashFlowAdvice(financials, inputs, userMessage = '') {
        const question = userMessage.toLowerCase();
        const currentProfit = financials.monthlyProfit;
        const revenueGap = financials.totalMonthlyExpenses - financials.monthlyRevenue;
        
        if (question.includes('positive') || question.includes('good')) {
            if (currentProfit > 0) {
                return `� <strong>YES - You Have Positive Cash Flow!</strong><br><br>
                Excellent question! Your cash flow is <strong>positive by ₹${Math.round(currentProfit).toLocaleString()}/month</strong>!<br><br>
                
                <strong>What this means:</strong><br>
                • You make more than you spend each month<br>
                • Your business is self-sustaining<br>
                • Cash balance grows automatically<br>
                • No funding pressure<br><br>
                
                <strong>Monthly Breakdown:</strong><br>
                • Revenue: ₹${Math.round(financials.monthlyRevenue).toLocaleString()}<br>
                • Total costs: ₹${Math.round(financials.totalMonthlyExpenses).toLocaleString()}<br>
                • Net profit: +₹${Math.round(currentProfit).toLocaleString()}<br><br>
                
                Keep doing what you're doing! 🚀`;
            } else {
                return `❌ <strong>No - Cash Flow is Negative</strong><br><br>
                Your current cash flow is <strong>negative by ₹${Math.round(Math.abs(currentProfit)).toLocaleString()}/month</strong>.<br><br>
                
                <strong>The situation:</strong><br>
                • You spend more than you earn<br>
                • Burning cash reserves each month<br>
                • Need to improve revenue or cut costs<br><br>
                
                <strong>Monthly Numbers:</strong><br>
                • Revenue: ₹${Math.round(financials.monthlyRevenue).toLocaleString()}<br>
                • Costs: ₹${Math.round(financials.totalMonthlyExpenses).toLocaleString()}<br>
                • Shortfall: -₹${Math.round(Math.abs(currentProfit)).toLocaleString()}<br><br>
                
                Focus on revenue growth or cost optimization!`;
            }
        } else if (question.includes('improve') || question.includes('better') || question.includes('fix')) {
            if (currentProfit < 0) {
                return `💡 <strong>Cash Flow Improvement Strategy</strong><br><br>
                Great question! Here's how to fix your ₹${Math.round(Math.abs(currentProfit)).toLocaleString()}/month shortfall:<br><br>
                
                <strong>Revenue Growth (Fastest Impact):</strong><br>
                • Increase prices by 15% → +₹${Math.round(financials.monthlyRevenue * 0.15).toLocaleString()}/month<br>
                • Improve marketing ROI by focusing on best channels<br>
                • Add upselling to existing customers<br>
                • Launch premium features or tiers<br><br>
                
                <strong>Cost Optimization (Immediate):</strong><br>
                • Cut non-essential spending<br>
                • Negotiate vendor rates<br>
                • Optimize team structure<br>
                • Reduce office/overhead costs<br><br>
                
                <strong>Target:</strong> Need ₹${Math.round(revenueGap).toLocaleString()}/month more revenue to break even.`;
            } else {
                return `✨ <strong>Already Positive - Growth Ideas!</strong><br><br>
                You're already profitable (₹${Math.round(currentProfit).toLocaleString()}/month)! Here's how to grow further:<br><br>
                
                <strong>Scaling Opportunities:</strong><br>
                • Reinvest ₹${Math.round(currentProfit * 0.7).toLocaleString()} back into growth<br>
                • Increase marketing budget for customer acquisition<br>
                • Hire additional team members<br>
                • Expand to new markets<br><br>
                
                <strong>Build cash reserves for:</strong><br>
                • Market expansion<br>
                • Product development<br>
                • Strategic opportunities<br>
                • Economic downturns`;
            }
        } else {
            // Default response based on current situation
            if (currentProfit > 0) {
                return `�🎯 <strong>Your Cash Flow is Positive!</strong><br><br>
                Great news! You're generating <strong>₹${Math.round(currentProfit).toLocaleString()}/month profit</strong>.<br><br>
                
                <strong>Current Performance:</strong><br>
                • Monthly Revenue: ₹${Math.round(financials.monthlyRevenue).toLocaleString()}<br>
                • Monthly Expenses: ₹${Math.round(financials.totalMonthlyExpenses).toLocaleString()}<br>
                • Net Profit: ₹${Math.round(currentProfit).toLocaleString()}<br><br>
                
                <strong>Optimization Opportunities:</strong><br>
                • Reinvest profits for faster growth<br>
                • Build emergency cash reserves<br>
                • Test premium pricing tiers<br>
                • Scale successful marketing channels<br>
                • Consider strategic hires for growth`;
            } else {
                return `📈 <strong>Cash Flow Improvement Strategy</strong><br><br>
                You need ₹${Math.round(revenueGap).toLocaleString()}/month more revenue to break even.<br><br>
                
                <strong>Revenue Acceleration (Priority 1):</strong><br>
                • Test price increase from current levels by 15%<br>
                • Improve marketing ROI and conversion rates<br>
                • Focus on customer retention and upselling<br>
                • Expand to new market segments<br><br>
                
                <strong>Cost Optimization (Priority 2):</strong><br>
                • Review all monthly expenses<br>
                • Negotiate better rates with vendors<br>
                • Consider remote-first to reduce office costs<br>
                • Automate repetitive tasks<br><br>
                
                <strong>Quick Wins:</strong><br>
                • A 15% price increase could add ₹${Math.round(financials.monthlyRevenue * 0.15).toLocaleString()}/month<br>
                • Better marketing could improve conversion by 20-30%<br>
                • Cost cuts of 10% save ₹${Math.round(financials.totalMonthlyExpenses * 0.1).toLocaleString()}/month`;
            }
        }
    }

    generateProfitAdvice(financials, inputs, userMessage = '') {
        const margin = financials.profitMargin;
        const question = userMessage.toLowerCase();
        
        if (question.includes('what') && question.includes('margin')) {
            return `📊 <strong>Your Profit Margin Explained</strong><br><br>
            Your current profit margin is <strong>${margin.toFixed(1)}%</strong>.<br><br>
            
            <strong>What this means:</strong><br>
            • For every ₹100 in revenue, you ${margin > 0 ? 'keep ₹' + margin.toFixed(1) + ' as profit' : 'lose ₹' + Math.abs(margin).toFixed(1)}<br>
            • This is ${margin > 20 ? 'excellent' : margin > 10 ? 'good' : margin > 0 ? 'acceptable' : 'concerning'}<br><br>
            
            <strong>Industry Context:</strong><br>
            • Tech startups: Usually 15-30%<br>
            • SaaS businesses: Often 20-40%<br>
            • Your ${margin.toFixed(1)}%: ${margin > 20 ? '🟢 Above average!' : margin > 10 ? '🟡 Decent' : margin > 0 ? '🟠 Below average' : '🔴 Needs improvement'}<br><br>
            
            <strong>Calculation:</strong><br>
            (₹${Math.round(financials.monthlyProfit).toLocaleString()} profit ÷ ₹${Math.round(financials.monthlyRevenue).toLocaleString()} revenue) × 100 = ${margin.toFixed(1)}%`;
        } else if (question.includes('improve') || question.includes('increase')) {
            if (margin < 0) {
                return `� <strong>Turning Negative Margins Positive</strong><br><br>
                Your ${margin.toFixed(1)}% margin needs immediate attention! Here's how:<br><br>
                
                <strong>Revenue Improvements (Faster):</strong><br>
                • Increase prices by 20% → Could add ${(financials.monthlyRevenue * 0.2 / financials.monthlyRevenue * 100).toFixed(1)}% to margin<br>
                • Focus on premium customers<br>
                • Add high-margin services<br>
                • Reduce discounting<br><br>
                
                <strong>Cost Reductions (Immediate):</strong><br>
                • Cut non-essential expenses<br>
                • Negotiate vendor rates<br>
                • Optimize team efficiency<br>
                • Automate manual processes<br><br>
                
                <strong>Target:</strong> Get to 15%+ margin for healthy growth.`;
            } else {
                return `🚀 <strong>Margin Improvement Strategies</strong><br><br>
                Your ${margin.toFixed(1)}% margin can be enhanced! Here's how:<br><br>
                
                <strong>Premium Positioning:</strong><br>
                • Test 10-15% price increase<br>
                • Add premium features/tiers<br>
                • Focus on value-based pricing<br>
                • Target higher-value customers<br><br>
                
                <strong>Operational Efficiency:</strong><br>
                • Automate routine tasks<br>
                • Improve team productivity<br>
                • Optimize vendor contracts<br>
                • Reduce waste/overhead<br><br>
                
                <strong>Potential Impact:</strong><br>
                • 15% price increase → ${(margin + 15).toFixed(1)}% margin<br>
                • 10% cost reduction → ${(margin + (financials.totalMonthlyExpenses * 0.1 / financials.monthlyRevenue * 100)).toFixed(1)}% margin`;
            }
        } else {
            // Default margin analysis
            if (margin < 0) {
                return `�🔴 <strong>Negative Profit Margin:</strong> ${margin.toFixed(1)}% means you're losing money. Priority actions:<br>
                • Reduce costs immediately<br>
                • Increase prices if market allows<br>
                • Focus on unit economics<br>
                • Consider pivoting if trend continues<br>
                Current loss: ₹${Math.round(Math.abs(financials.monthlyProfit)).toLocaleString()}/month`;
            } else if (margin < 10) {
                return `🟡 <strong>Low Profit Margin:</strong> ${margin.toFixed(1)}% is concerning. Improve by:<br>
                • Raising prices by 15-20%<br>
                • Reducing operational costs<br>
                • Improving product efficiency<br>
                • Focus on high-value customers`;
            } else if (margin > 25) {
                return `🟢 <strong>Excellent Margins:</strong> ${margin.toFixed(1)}% is outstanding! You can:<br>
                • Invest in growth (marketing, hiring)<br>
                • Build competitive moats<br>
                • Consider market expansion<br>
                • Maintain pricing power`;
            } else {
                return `✅ <strong>Healthy Margins:</strong> ${margin.toFixed(1)}% is solid. Continue:<br>
                • Monitoring unit economics<br>
                • Gradual price optimization<br>
                • Cost efficiency improvements<br>
                • Strategic growth investments`;
            }
        }
    }

    generateBreakEvenAdvice(financials, inputs, userMessage = '') {
        const question = userMessage.toLowerCase();
        
        if (financials.monthlyProfit > 0) {
            if (question.includes('when') || question.includes('break even')) {
                return `🎉 <strong>You're Already Past Break-Even!</strong><br><br>
                Great question! You've already achieved profitability and are generating <strong>₹${Math.round(financials.monthlyProfit).toLocaleString()}/month profit</strong>.<br><br>
                
                <strong>Your Achievement:</strong><br>
                • Monthly Revenue: ₹${Math.round(financials.monthlyRevenue).toLocaleString()}<br>
                • Monthly Costs: ₹${Math.round(financials.totalMonthlyExpenses).toLocaleString()}<br>
                • Net Profit: +₹${Math.round(financials.monthlyProfit).toLocaleString()}<br><br>
                
                <strong>Now Focus On:</strong><br>
                • Scaling profitable operations<br>
                • Reinvesting in growth<br>
                • Building cash reserves<br>
                • Expanding market share`;
            } else {
                return `🎉 <strong>Already Profitable!</strong> You're generating ₹${Math.round(financials.monthlyProfit).toLocaleString()}/month profit. Focus on:<br>
                • Scaling profitable operations<br>
                • Reinvesting in growth<br>
                • Building cash reserves<br>
                • Expanding market share`;
            }
        } else {
            const revenueNeeded = financials.totalMonthlyExpenses;
            const currentRevenue = financials.monthlyRevenue;
            const gap = revenueNeeded - currentRevenue;
            const monthsNeeded = Math.round(inputs.currentCash / Math.abs(financials.monthlyProfit));
            
            if (question.includes('when') || question.includes('time')) {
                return `⏱️ <strong>Break-Even Timeline Analysis</strong><br><br>
                At current rates, you need to increase revenue to reach break-even:<br><br>
                
                <strong>Current Situation:</strong><br>
                • Monthly Revenue: ₹${Math.round(currentRevenue).toLocaleString()}<br>
                • Monthly Expenses: ₹${Math.round(revenueNeeded).toLocaleString()}<br>
                • Revenue Gap: ₹${Math.round(gap).toLocaleString()}/month<br><br>
                
                <strong>Time Scenarios:</strong><br>
                • With 20% monthly growth: ${Math.round(Math.log(revenueNeeded/currentRevenue)/Math.log(1.2))} months<br>
                • With 10% monthly growth: ${Math.round(Math.log(revenueNeeded/currentRevenue)/Math.log(1.1))} months<br>
                • At current growth: Need immediate revenue increase<br><br>
                
                You have ${monthsNeeded} months of cash to achieve this!`;
            } else if (question.includes('how') || question.includes('achieve')) {
                return `🎯 <strong>How to Reach Break-Even</strong><br><br>
                You need ₹${Math.round(gap).toLocaleString()}/month more revenue to break even. Here's how:<br><br>
                
                <strong>Option 1 - Revenue Growth:</strong><br>
                • Increase prices by ${Math.round((gap/currentRevenue)*100)}%<br>
                • Acquire ${Math.round(gap/5000)} new ₹5,000 customers<br>
                • Improve conversion rate by ${Math.round((gap/currentRevenue)*100)}%<br><br>
                
                <strong>Option 2 - Cost Reduction:</strong><br>
                • Cut expenses by ₹${Math.round(gap).toLocaleString()}/month<br>
                • Optimize team size (current: ${inputs.engineers} engineers)<br>
                • Reduce marketing spend if ROI is low<br><br>
                
                <strong>Hybrid Approach (Recommended):</strong><br>
                • Increase revenue by ${Math.round(gap*0.7).toLocaleString()} (70%)<br>
                • Reduce costs by ${Math.round(gap*0.3).toLocaleString()} (30%)`;
            } else {
                return `📊 <strong>Path to Break-Even</strong><br><br>
                You need to increase monthly revenue to ₹${Math.round(revenueNeeded).toLocaleString()} to break even.<br><br>
                
                <strong>Current Gap:</strong><br>
                • Current revenue: ₹${Math.round(currentRevenue).toLocaleString()}<br>
                • Target revenue: ₹${Math.round(revenueNeeded).toLocaleString()}<br>
                • Gap to close: ₹${Math.round(gap).toLocaleString()}<br><br>
                
                <strong>Key Actions:</strong><br>
                • Focus on sales and customer acquisition<br>
                • Optimize pricing strategy<br>
                • Improve product-market fit<br>
                • Consider cost optimization`;
            }
        }
    }

    generateGeneralAdvice(financials, inputs, originalQuestion) {
        // More contextual general advice based on the question
        const questionWords = originalQuestion.toLowerCase();
        
        if (questionWords.includes('what') || questionWords.includes('how') || questionWords.includes('why')) {
            return `🤔 <strong>I'd love to help with that question!</strong><br><br>
            I noticed you asked: "${originalQuestion}"<br><br>
            
            <strong>Based on your current financials:</strong><br>
            • Runway: ${financials.runway === Infinity ? '∞ (Profitable!)' : Math.round(financials.runway) + ' months'}<br>
            • Monthly Status: ${financials.monthlyProfit > 0 ? 'Profit' : 'Loss'} of ₹${Math.round(Math.abs(financials.monthlyProfit)).toLocaleString()}<br>
            • Burn Rate: ₹${Math.round(financials.burnRate).toLocaleString()}/month<br><br>
            
            <strong>Try asking me about:</strong><br>
            • "What does my runway mean?"<br>
            • "Should I hire more engineers?"<br>
            • "How can I improve cash flow?"<br>
            • "Is my pricing strategy good?"<br>
            • "What's my break-even point?"<br><br>
            
            I analyze your real financial data to give personalized advice! 💡`;
        } else {
            const insights = [];
            if (financials.runway < 6) insights.push("🚨 Short runway - focus on extending cash");
            if (financials.profitMargin > 20) insights.push("✅ Excellent margins - consider scaling");
            if (inputs.engineers > 5) insights.push("👥 Large team - monitor productivity");
            if (financials.monthlyRevenue < 50000) insights.push("📈 Focus on revenue growth");
            
            return `🤖 <strong>Financial Health Check</strong><br><br>
            Here's what I see in your current situation:<br><br>
            
            <strong>Key Metrics:</strong><br>
            • Runway: ${financials.runway === Infinity ? '∞ (Profitable!)' : Math.round(financials.runway) + ' months'}<br>
            • Profit Margin: ${financials.profitMargin.toFixed(1)}%<br>
            • Monthly Revenue: ₹${Math.round(financials.monthlyRevenue).toLocaleString()}<br>
            • Team Size: ${inputs.engineers} engineers<br><br>
            
            <strong>Key Insights:</strong><br>
            ${insights.length > 0 ? insights.map(insight => `• ${insight}`).join('<br>') : '• Your financials look reasonably balanced'}
            <br><br>
            
            <strong>Ask me specific questions like:</strong><br>
            • "What should I focus on first?"<br>
            • "How risky is hiring right now?"<br>
            • "Should I raise prices?"<br>
            
            I'm here to help with strategic financial decisions! 🎯`;
        }
    }

    generateGreeting() {
        const greetings = [
            "👋 Hello! I'm your CFO AI Assistant, ready to help with financial strategy!",
            "🤖 Hi there! Let's dive into your financial data and find opportunities!",
            "💼 Hey! I'm here to help you make smarter financial decisions.",
            "🎯 Hello! Ready to optimize your business finances together?"
        ];
        
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        return `${randomGreeting}<br><br>
        
        <strong>I can help you with:</strong><br>
        • 💰 Runway and cash flow analysis<br>
        • 👥 Hiring decisions and team planning<br>
        • 📈 Pricing and revenue optimization<br>
        • 🎯 Marketing budget allocation<br>
        • 📊 Break-even and profitability planning<br><br>
        
        What would you like to know about your business finances?`;
    }

    generateHelpResponse() {
        return `🆘 <strong>Here's how I can help you!</strong><br><br>
        
        I'm your intelligent CFO assistant that analyzes your real financial data to provide personalized advice.<br><br>
        
        <strong>🔍 What I analyze:</strong><br>
        • Your current cash position and runway<br>
        • Monthly revenue and expenses<br>
        • Team size and hiring costs<br>
        • Pricing strategy effectiveness<br>
        • Marketing ROI and efficiency<br><br>
        
        <strong>💡 Questions you can ask:</strong><br>
        • "What does my runway mean?"<br>
        • "Should I hire more engineers?"<br>
        • "How can I improve profitability?"<br>
        • "Is my pricing strategy working?"<br>
        • "What's my break-even point?"<br>
        • "How should I allocate my marketing budget?"<br><br>
        
        <strong>🎯 My responses include:</strong><br>
        • Specific recommendations based on YOUR data<br>
        • Risk assessments and warnings<br>
        • Actionable next steps<br>
        • Financial projections and scenarios<br><br>
        
        Try the quick question buttons below or ask me anything! 🚀`;
    }

    generateThankYouResponse() {
        const responses = [
            "🙏 You're welcome! Happy to help optimize your business finances!",
            "😊 Glad I could help! Feel free to ask more questions anytime.",
            "💼 My pleasure! Strategic financial planning is what I do best.",
            "🎯 Anytime! I'm here whenever you need financial insights."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return `${randomResponse}<br><br>
        
        <strong>💡 Pro tip:</strong> Keep monitoring these key metrics weekly:<br>
        • Runway and burn rate<br>
        • Customer acquisition cost<br>
        • Monthly recurring revenue<br>
        • Profit margins<br><br>
        
        Ask me again after any major business changes! 📊`;
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Insert at top of results panel
        const resultsPanel = document.querySelector('.results-panel');
        resultsPanel.insertBefore(alertDiv, resultsPanel.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CFOHelper();
});