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

    // Generate last 30 days of dates
    let dates = [];
    let today = new Date();
    for (let i = 29; i >= 0; i--) {
        let d = new Date();
        d.setDate(today.getDate() - i);
        let yyyy = d.getFullYear();
        let mm = String(d.getMonth() + 1).padStart(2, '0');
        let dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
    }

    // LOAD HISTORY
    let logMap = new Map();
    // Explicitly check window.gameState
    const gs = window.gameState || (typeof gameState !== 'undefined' ? gameState : null);

    if (gs && gs.dailyHistory && gs.dailyHistory.length > 0) {
        gs.dailyHistory.forEach(h => {
            if (h.date) {
                logMap.set(h.date, {
                    total_learned: h.wordsLearned,
                    cefr_breakdown: {}
                });
            }
        });
    }

    // Initialize Arrays
    let labels = [];
    let datasets = {
        total: [],
        A1: [],
        A2: [],
        B1: [],
        B2: []
    };
    let isRealData = [];

    // Main Loop: ALWAYS run "Real" logic (History or Zero) + Today's Live Data
    dates.forEach((dateStr, index) => {
        const dPart = new Date(dateStr);
        labels.push(`${dPart.getMonth() + 1}/${dPart.getDate()}`);

        if (index < 29) {
            // PAST: Use stored logs or 0
            if (logMap.has(dateStr)) {
                const data = logMap.get(dateStr);
                isRealData.push(true);
                datasets.total.push(data.total_learned || 0);
                datasets.A1.push(data.cefr_breakdown?.A1 || 0);
                datasets.A2.push(data.cefr_breakdown?.A2 || 0);
                datasets.B1.push(data.cefr_breakdown?.B1 || 0);
                datasets.B2.push(data.cefr_breakdown?.B2 || 0);
            } else {
                isRealData.push(false);
                datasets.total.push(0);
                datasets.A1.push(0);
                datasets.A2.push(0);
                datasets.B1.push(0);
                datasets.B2.push(0);
            }
        } else {
            // TODAY (Index 29): Live Calculation
            // Always try to count from gameState
            // TODAY (Index 29): Live Calculation
            // TODAY (Index 29): Live Calculation
            // Robust Approach: Iterate vocabularyDatabase like game_logic.js does
            // Fix: vocabularyDatabase is 'let' so not on window. Check directly.
            const vDB = (typeof vocabularyDatabase !== 'undefined') ? vocabularyDatabase : null;

            if (gs && gs.wordStates && vDB) {
                console.log("FallbackGraph: Calculating Today's Stats using vocabularyDatabase (Direct Access)...");

                // DEBUG: Check Keys
                const stateKeys = Object.keys(gs.wordStates);
                if (stateKeys.length > 0) {
                    console.log("FallbackGraph: Sample wordStates Keys:", stateKeys.slice(0, 3));
                    console.log("FallbackGraph: Sample wordStates Values:", stateKeys.slice(0, 3).map(k => gs.wordStates[k]));
                } else {
                    console.warn("FallbackGraph: wordStates is EMPTY!");
                }

                // Helper to match getWordKey logic
                const getKey = (wordObj, level) => {
                    if (wordObj.ref && wordObj.ref !== level) {
                        let refCategory = wordObj.ref;
                        let refWordText = wordObj.word;
                        if (wordObj.ref.includes(':')) {
                            const parts = wordObj.ref.split(':');
                            refCategory = parts[0];
                            refWordText = parts[1];
                        }
                        return `${refCategory}_${refWordText}`;
                    }
                    return `${level}_${wordObj.word}`;
                };

                // DEBUG: Check Generated Key for first Junior word
                if (vDB['junior'] && vDB['junior'].length > 0) {
                    const firstW = vDB['junior'][0];
                    console.log("FallbackGraph: First Junior Word:", firstW);
                    console.log("FallbackGraph: Generated Key:", getKey(firstW, 'junior'));
                }

                const countCategory = (catName) => {
                    const words = vDB[catName] || [];
                    let c = 0;
                    words.forEach(w => {
                        const k = getKey(w, catName);
                        if (gs.wordStates[k] === 'perfect') c++;
                    });
                    return c;
                };

                let countA1 = countCategory('junior');
                let countA2 = countCategory('basic');
                let countB1 = countCategory('daily');
                let countB2 = countCategory('exam1');

                const countTotal = countA1 + countA2 + countB1 + countB2;

                console.log(`FallbackGraph: Today Result -> Total:${countTotal} (A1:${countA1}, A2:${countA2}, B1:${countB1}, B2:${countB2})`);

                isRealData.push(true);
                datasets.total.push(countTotal);
                datasets.A1.push(countA1);
                datasets.A2.push(countA2);
                datasets.B1.push(countB1);
                datasets.B2.push(countB2);
            } else {
                console.warn("FallbackGraph: Missing vocabularyDatabase or wordStates!", !!gs, (typeof vocabularyDatabase !== 'undefined'));
                // Fallback (e.g. gs not loaded yet)
                isRealData.push(false);
                datasets.total.push(0);
                datasets.A1.push(0);
                // ... rest 0
                // ... rest 0
                datasets.A2.push(0);
                datasets.B1.push(0);
                datasets.B2.push(0);
            }
        }
    });

    return { labels, datasets, isRealData, isDemo: false };
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
