// Fallback Chart Logic (No Firebase Dependencies)
// Ensures Graph works even if firebase_app.js fails to load (e.g. offline/network blocked)

console.log("Fallback Chart Script Loaded");

// 1. Graph Configuration (Scales)
window.GRAPH_SCALES = {
    total: { max: 8018, label: '総合' },
    A1: { max: 1221, label: 'Junior (A1)' },
    A2: { max: 1448, label: 'Basic (A2)' },
    B1: { max: 2480, label: 'Daily (B1)' },
    B2: { max: 2869, label: 'Exam1 (B2)', stepSize: 500 }
};

// 2. Mock Data Logic
// 2. Real Data Only Logic (Demo Removed)
window.getMonthlyStats = async function () {
    // Return early if real stats are already defined by Firebase App
    if (window.firebaseDataLoaded && window.getMonthlyStatsReal) {
        return window.getMonthlyStatsReal();
    }

    const gs = window.gameState || (typeof gameState !== 'undefined' ? gameState : null);
    const vDB = (typeof vocabularyDatabase !== 'undefined') ? vocabularyDatabase : (window.vocabularyDatabase || null);
    const logMap = new Map();

    if (window.ChartDataAdapter) {
        window.ChartDataAdapter.mergeLocalHistory(logMap, gs);
        return window.ChartDataAdapter.buildMonthlyStats(logMap, gs, vDB);
    }

    // Fallback-safe empty response
    return { labels: [], datasets: { total: [], A1: [], A2: [], B1: [], B2: [] }, isRealData: [], isDemo: false };
};

// 3. UI: Render Chart
window.updateChart = async function (type = 'total') {
    const ctx = document.getElementById('learningChart');
    if (!ctx) return;

    // Loading State / Clear
    const ctx2d = ctx.getContext('2d');
    // ctx2d.clearRect(0, 0, ctx.width || 300, ctx.height || 200);

    // Update Tabs
    document.querySelectorAll('.chart-tab').forEach(b => {
        b.classList.remove('active');
        b.style.background = '#f1f2f6';
        b.style.color = '#555';
        if (b.dataset.tab === type) {
            b.classList.add('active');
            b.style.background = '#6c5ce7';
            b.style.color = 'white';
        }
    });

    const dataObj = await window.getMonthlyStats();

    // Colors
    const colors = {
        total: '#6c5ce7',
        A1: '#00b894',
        A2: '#0984e3',
        B1: '#fdcb6e',
        B2: '#e17055'
    };

    // Prepare Gradient
    const gradient = ctx2d.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, colors[type]);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    // Stats Text update
    const currentVal = dataObj.datasets[type][dataObj.datasets[type].length - 1];
    const demoBadge = dataObj.isDemo ? '<span style="color:#e67e22; margin-left:5px;">(Demo Data)</span>' : '';

    // Get Scale Info
    const scaleConfig = window.GRAPH_SCALES[type] || window.GRAPH_SCALES.total;

    const statsEl = document.getElementById('chartStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div style="text-align: right; font-size: 10px; color: #999; margin-bottom: -5px;">過去30日間の推移${demoBadge}</div>
            <div style="text-align: right;">
                現在: <strong style="font-size: 16px; color: ${colors[type]}">${currentVal}語</strong> 
                <span style="font-size:10px; color:#ccc;"> / ${scaleConfig.max}</span>
            </div>
        `;
    }

    if (window.myPageChart) window.myPageChart.destroy();

    window.myPageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataObj.labels,
            datasets: [
                {
                    label: scaleConfig.label,
                    data: dataObj.datasets[type],
                    borderColor: colors[type],
                    backgroundColor: gradient,
                    fill: 'start',
                    tension: 0,
                    pointRadius: 4, // Always show points
                    pointBackgroundColor: colors[type],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            return context.parsed.y + ' / ' + scaleConfig.max;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 6,
                        maxRotation: 0,
                        font: { size: 10 }
                    }
                },
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: scaleConfig.max, // ENFORCE MAX
                    ticks: {
                        stepSize: scaleConfig.stepSize || undefined,
                        maxTicksLimit: 12,
                        autoSkip: false,
                        callback: function (value) { if (value % 1 === 0) { return value; } }
                    },
                    afterBuildTicks: function (axis) {
                        if (scaleConfig.max === 2869) { // B2 Specific
                            axis.ticks = [0, 500, 1000, 1500, 2000, 2500, 2869].map(v => ({ value: v }));
                        }
                    }
                }
            }
        }
    });
};
